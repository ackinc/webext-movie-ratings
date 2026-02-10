import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { limitThroughput } from "rate-limit-utils";
import {
  ONE_HOUR_IN_MS,
  ONE_WEEK_IN_MS,
  browser,
  getSetting,
  setSetting,
  omit,
  pick,
  MessageType,
  SettingsKey,
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
import { captureException } from "./common/errorReporter";

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

const rateLimitedFetch = limitThroughput(fetch.bind(globalThis), 50);
let db: IDBPDatabase<SiftDB>;
(async () => {
  db = await prepareDB();
  await injectUpdatedContentScripts();
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
  const allCachedRatingsData = omit(
    await browser.storage.local.get(),
    Object.values(SettingsKey),
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
  if (request.messageType === MessageType.fetchIMDBRating) {
    const { pageUrl, program } = request.data as {
      pageUrl: string;
      program: Omit<Program, "node">;
    };
    fetchIMDBData(program, pageUrl)
      .then((data) => sendResponse(data))
      .catch((e) => {
        const error = e instanceof Error ? e : new Error(e.toString());
        error.message = `Failed to fetch rating. Program: ${JSON.stringify(program)}. Error: ${error.message}`;
        sendResponse({ error });
        captureException(error);
      });
  } else {
    const err = new Error(`Unknown message type: ${request.messageType}`);
    captureException(err);
    throw err;
  }

  return true;
}

async function fetchIMDBData(
  program: Omit<Program, "node">,
  pageUrl?: string,
): Promise<IMDBData> {
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

  if (BUILDTIME_ENV.DEBUG_MODE) {
    const telemetryStore = txn.objectStore(telemetryStoreName);

    // increment the request counter
    const intervalSizeInSeconds = 10;
    let key = `nRequests::${Math.ceil(+new Date() / (intervalSizeInSeconds * 1000)) * intervalSizeInSeconds * 1000}`;
    if (pageUrl) {
      const url = new URL(pageUrl);
      key += `::${url.origin}::${url.href}`;
    }
    const curCount = ((await telemetryStore.get(key)) ?? 0) as number;
    await telemetryStore.put(curCount + 1, key);
  }

  return imdbData;
}

function getCacheKey(program: Omit<Program, "node">): string {
  const { title, type, year } = program;
  return btoa(
    [title.replace(/[^\w\s]/g, "").toLowerCase(), type, year]
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
  const searchParams = new URLSearchParams({
    apiKey: BUILDTIME_ENV.OMDB_API_KEY,
    t: title,
  });
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
