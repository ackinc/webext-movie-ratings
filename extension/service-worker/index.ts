import {
  browser,
  getSetting,
  setSetting,
  omitBy,
  MessageType,
  SettingsKey,
  telemetryIntervalSizeInSeconds,
  selectorStatusKeyPrefix,
  sendMessageToAllTabs,
  ErrorMessage,
  storage,
} from "../common";
import type {
  Program,
  IMDBData,
  Message,
  CachedIMDBData,
  SWErrorResponse,
} from "../common/types";
import {
  captureException,
  type ExceptionMetadata,
} from "../common/errorReporter";
import RatingsCache from "./RatingsCache";
import TelemetryStore from "./TelemetryStore";
import OmdbApiClient from "./OmdbApiClient";
import { RATING_API_REQUEST_TIMEOUT_MS } from "./constants";

let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;
let omdbApiClient: OmdbApiClient;
(async () => {
  try {
    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onMessage.addListener(handleMessage);

    ratingsCache = await initializeRatingsCache();
    telemetryStore = await TelemetryStore.create(
      telemetryIntervalSizeInSeconds,
    );
    omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);
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
  const allData = await storage.getAll();
  const oldCacheData = omitBy(
    allData,
    (_v, k) =>
      (Object.values(SettingsKey) as string[]).includes(k) ||
      k.startsWith(selectorStatusKeyPrefix),
  ) as Record<string, CachedIMDBData>;

  const cache: RatingsCache = await RatingsCache.createFrom(oldCacheData);
  await storage.remove(Object.keys(oldCacheData));
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
      if (!ratingsCache) throw new Error(ErrorMessage.ratingsCacheNotReady);
      if (FF_TELEMETRY_ENABLED && !telemetryStore) {
        throw new Error(ErrorMessage.telemetryStoreNotReady);
      }

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

    const errorsToIgnore: string[] = [
      ErrorMessage.ratingsCacheNotReady,
      ErrorMessage.telemetryStoreNotReady,
      ErrorMessage.ratingsApiRequestTimedOut,
      ErrorMessage.ratingsApiRequestAlreadyInFlight,
    ];
    if (errorsToIgnore.includes(error.message)) return;
    captureException(error, metadata);
  }
}

function getIMDBData(
  program: Omit<Program, "node">,
  pageUrl?: string,
): Promise<IMDBData> {
  return new Promise((resolve, reject) => {
    if (FF_TELEMETRY_ENABLED) {
      telemetryStore
        .logEvent("PROGRAM_RATING_REQUEST", { pageUrl })
        .catch(reject);
    }

    ratingsCache.get(program).then((cached) => {
      if (cached) return resolve(cached);

      setTimeout(
        () => reject(new Error(ErrorMessage.ratingsApiRequestTimedOut)),
        RATING_API_REQUEST_TIMEOUT_MS,
      );

      omdbApiClient
        .fetchIMDBData(program)
        .then((imdbData) => ratingsCache.putOne({ program, imdbData }))
        .then(({ imdbData }) => resolve(imdbData))
        .catch(reject);
    });
  });
}

async function fetchWithAddedTelemetry(
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> {
  if (FF_TELEMETRY_ENABLED) await telemetryStore.logEvent("RATINGS_API_CALL");
  return fetch(...args);
}
