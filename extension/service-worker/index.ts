import { limitThroughput } from "rate-limit-utils";
import {
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
} from "../common";
import type {
  Program,
  IMDBData,
  Message,
  CachedIMDBData,
  SWErrorResponse,
  OmdbApiResponse,
} from "../common/types";
import {
  captureException,
  type ExceptionMetadata,
} from "../common/errorReporter";
import RatingsCache from "./RatingsCache";
import TelemetryStore from "./TelemetryStore";

let rateLimitedFetch: typeof fetch;
let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;
(async () => {
  try {
    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onMessage.addListener(handleMessage);

    rateLimitedFetch = limitThroughput(patchedFetch, 50);
    ratingsCache = await initializeRatingsCache();
    telemetryStore = await TelemetryStore.create(
      telemetryIntervalSizeInSeconds,
    );
    await injectUpdatedContentScripts();
  } catch (e) {
    captureException(e);
  }
})();

//////////////////////////////
//** function definitions **//
//////////////////////////////

async function onInstalled() {
  await showPopupIfNotSeen();
}

async function initializeRatingsCache() {
  const allData = await browser.storage.local.get();
  const oldCacheData = omitBy(
    allData,
    (_v, k) =>
      (Object.values(SettingsKey) as string[]).includes(k) ||
      k.startsWith(selectorStatusKeyPrefix),
  ) as Record<string, CachedIMDBData>;

  const cache: RatingsCache = await RatingsCache.createFrom(oldCacheData);
  await browser.storage.local.remove(Object.keys(oldCacheData));
  return cache;
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
  if (["development", "testing"].includes(APP_ENV)) {
    await telemetryStore.logEvent("PROGRAM_RATING_REQUEST", { pageUrl });
  }

  const cached = await ratingsCache.get(program);
  if (cached) return cached;

  const imdbData = await fetchIMDBDataFromApi(program);
  await ratingsCache.put([{ program, imdbData }]);
  return imdbData;
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

async function patchedFetch(
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> {
  const promise = fetch(...args);

  if (["development", "testing"].includes(APP_ENV)) {
    await telemetryStore.logEvent("RATINGS_API_CALL");
  }

  return promise;
}
