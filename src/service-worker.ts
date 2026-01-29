import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  ONE_HOUR_IN_MS,
  ONE_WEEK_IN_MS,
  browser,
  getSetting,
  setSetting,
  pick,
  MessageType,
  SettingsKey,
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
interface SiftDB extends DBSchema {
  ratingsStore: {
    key: string;
    value: CachedIMDBData;
  };
}
let db: IDBPDatabase<SiftDB>;

browser.runtime.onInstalled.addListener(onInstalled);
browser.runtime.onMessage.addListener(handleMessage);

async function onInstalled() {
  db = await prepareDB();
  await injectUpdatedContentScripts();
  await showPopupIfNotSeen();
}

async function prepareDB() {
  return await openDB<SiftDB>("siftDb", 1, {
    upgrade: (db, oldVersion) => {
      if (oldVersion === 0) {
        db.createObjectStore(ratingsStoreName, { keyPath: "key" });

        // TODO: move already cached data from chrome.storage.local
        //   to the newly created store, then clear chrome.storage.local
        //   of cached ratings data (don't remove other stuff)
      }
    },
  });
}

async function injectUpdatedContentScripts() {
  const tabs = await browser.tabs.query({
    url: browser.runtime.getManifest()["host_permissions"],
  });
  tabs.forEach((tab) => {
    browser.scripting.executeScript({
      files: browser.runtime.getManifest()["content_scripts"]![0]!["js"]!,
      target: { tabId: tab.id! },
    });
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
    const program = request.data as Omit<Program, "node">;
    fetchIMDBData(program)
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
  await db.put(
    ratingsStoreName,
    {
      ...imdbData,
      key,
      expiry:
        +new Date() +
        (imdbData.imdbRating === "N/F"
          ? nfRatingCacheTime
          : imdbRatingCacheTime),
    },
    key,
  );
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

  const response = await fetch(
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
