import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { limitThroughput } from "rate-limit-utils";
import {
  ONE_HOUR_IN_MS,
  ONE_WEEK_IN_MS,
  browser,
  getSetting,
  setSetting,
  omitBy,
  pick,
  MessageType,
  SettingsKey,
  telemetryIntervalSizeInSeconds,
  selectorStatusKeyPrefix,
  sendMessageToAllTabs,
} from "./common";
import type {
  Program,
  IMDBData,
  Message,
  CachedIMDBData,
  SWErrorResponse,
  OmdbApiResponse,
} from "./common/types";
import {
  captureException,
  type ExceptionMetadata,
} from "./common/errorReporter";

const nfRatingCacheTime = ONE_HOUR_IN_MS * 6;
const imdbRatingCacheTime = ONE_WEEK_IN_MS * 2;
const ratingsStoreName = "ratingsStore";
const telemetryStoreName = "telemetryStore";
interface SiftDB extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
  telemetryStore: {
    key: string;
    value: unknown;
  };
}

browser.runtime.onInstalled.addListener(onInstalled);
browser.runtime.onMessage.addListener(handleMessage);

const rateLimitedFetch = limitThroughput(patchedFetch, 50);
let db: IDBPDatabase<SiftDB>;
(async () => {
  try {
    db = await prepareDB();
    await injectUpdatedContentScripts();
  } catch (e) {
    captureException(e);
  }
})();

async function onInstalled() {
  await showPopupIfNotSeen();
}

async function prepareDB() {
  const db = await openDB<SiftDB>("siftDb", 2, {
    upgrade: (db, oldVersion) => {
      if (oldVersion < 1) {
        db.createObjectStore(ratingsStoreName, { keyPath: "key" });
      }

      if (oldVersion < 2) {
        db.createObjectStore(telemetryStoreName);
      }
    },
  });

  await migrateCachedRatingsFromOutsideIdb(db);

  return db;
}

async function migrateCachedRatingsFromOutsideIdb(db: IDBPDatabase<SiftDB>) {
  const allCachedData = await browser.storage.local.get();
  const allCachedRatingsData = omitBy(
    allCachedData,
    (_v, k) =>
      (Object.values(SettingsKey) as string[]).includes(k) ||
      k.startsWith(selectorStatusKeyPrefix),
  );

  const txn = db.transaction(ratingsStoreName, "readwrite");
  const store = txn.objectStore(ratingsStoreName);
  for (const [key, v] of Object.entries(allCachedRatingsData)) {
    await store.put({ ...(v as Omit<CachedIMDBData, "key">), key });
  }

  await browser.storage.local.remove(Object.keys(allCachedRatingsData));
}

async function injectUpdatedContentScripts() {
  const results = await sendMessageToAllTabs({
    messageType: MessageType.healthCheck,
  });
  results.forEach(({ tab, result }) => {
    if (
      result.status === "rejected" &&
      result.reason.message.includes("Receiving end does not exist")
    ) {
      browser.scripting.executeScript({
        files: browser.runtime.getManifest()["content_scripts"]![0]!["js"]!,
        target: { tabId: tab.id! },
      });
    }
  });
}

async function showPopupIfNotSeen() {
  if (await getSetting(SettingsKey.popupSeenAtLeastOnce)) return;
  browser.action?.openPopup();
  await setSetting(SettingsKey.popupSeenAtLeastOnce, true);
}

function handleMessage(
  request: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (arg: IMDBData | SWErrorResponse) => void,
) {
  try {
    if (request.messageType === MessageType.fetchIMDBRating) {
      if (!db) throw new Error("idb connection not ready");

      const { pageUrl, program } = request.data as {
        pageUrl: string;
        program: Omit<Program, "node">;
      };
      getIMDBData(program, pageUrl)
        .then((data) => sendResponse(data))
        .catch((e) =>
          handleError(e, { context: { program, location: { href: pageUrl } } }),
        );

      return true; // keeps channel open until sendReponse is called
    } else if (request.messageType === MessageType.placeholder) {
      // do something here if desired
    } else {
      throw new Error(`Unknown message type: ${request.messageType}`);
    }
  } catch (e) {
    handleError(e);
  }

  return false;

  function handleError(e: unknown, metadata?: ExceptionMetadata) {
    const error = e instanceof Error ? e : new Error(`${e}`);
    sendResponse({ error: error.message });

    // let's capture these for a bit so we know how often they occur
    // if (error.message === "idb connection not ready") return;

    captureException(error, metadata);
  }
}

async function getIMDBData(
  program: Omit<Program, "node">,
  pageUrl?: string,
): Promise<IMDBData> {
  if (DEBUG_MODE) {
    let key = `nRatingRequests::${getCurrentTelemetryInterval()}`;
    if (pageUrl) {
      const url = new URL(pageUrl);
      key += `::${url.origin}::${url.href}`;
    }
    await logEventForTelemetry(key);
  }

  const key = getCacheKey(program);
  const cached: CachedIMDBData | undefined = await db.get(
    ratingsStoreName,
    key,
  );
  if (cached && checkCachedDataIsUsable(cached)) {
    return pick(cached, ["imdbID", "imdbRating"]) as IMDBData;
  }

  const imdbData = await fetchIMDBDataFromApi(program);
  const txn = db.transaction(
    [ratingsStoreName, telemetryStoreName],
    "readwrite",
  );
  const ratingsStore = txn.objectStore(ratingsStoreName);
  await ratingsStore.put({
    ...imdbData,
    key,
    expiry:
      +new Date() +
      (imdbData.imdbRating === "N/F" ? nfRatingCacheTime : imdbRatingCacheTime),
  });

  return imdbData;
}

function getCacheKey(program: Omit<Program, "node">): string {
  const { title, type, year } = program;
  // using btoa directly on a title with non-latin1 chars (without
  //   encoding to utf-8 first) will throw
  const utf8EncodedTitle = String.fromCharCode(
    ...new TextEncoder().encode(title),
  );
  return btoa(
    [utf8EncodedTitle.replace(/[^\w\s]/g, "").toLowerCase(), type, year]
      .filter(Boolean)
      .join("|"),
  );
}

function checkCachedDataIsUsable(data: CachedIMDBData): boolean {
  return Boolean(
    data.imdbRating &&
    (data.imdbID || data.imdbRating === "N/F") &&
    data.expiry > +new Date(),
  );
}

async function fetchIMDBDataFromApi(
  program: Omit<Program, "node">,
): Promise<IMDBData> {
  const { title, type, year } = program;
  const searchParams = new URLSearchParams({ apiKey: OMDB_API_KEY, t: title });
  if (type) searchParams.set("type", type);
  if (year) searchParams.set("y", year);

  const response = await rateLimitedFetch(
    `https://www.omdbapi.com/?${searchParams.toString()}`,
  );
  const respBody = (await response.json()) as OmdbApiResponse;

  let result: IMDBData;
  if ("Error" in respBody) {
    if (!respBody.Error.includes("not found")) {
      throw new Error(respBody.Error);
    }
    result = { imdbRating: "N/F", imdbID: "" };
  } else {
    result = pick(respBody, ["imdbID", "imdbRating"]) as IMDBData;
  }

  return result;
}

async function patchedFetch(...args: Parameters<typeof fetch>) {
  const promise = fetch(...args);

  if (DEBUG_MODE) {
    const key = `nApiCalls::${getCurrentTelemetryInterval()}`;
    await logEventForTelemetry(key);
  }

  return promise;
}

function getCurrentTelemetryInterval() {
  return (
    Math.ceil(+new Date() / (telemetryIntervalSizeInSeconds * 1000)) *
    telemetryIntervalSizeInSeconds *
    1000
  );
}

async function logEventForTelemetry(key: string) {
  const txn = db.transaction(telemetryStoreName, "readwrite");
  const telemetryStore = txn.objectStore(telemetryStoreName);
  const curCount = ((await telemetryStore.get(key)) as number) ?? 0;
  await telemetryStore.put(curCount + 1, key);
}
