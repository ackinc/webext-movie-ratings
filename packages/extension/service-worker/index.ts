import { type IDBPDatabase } from "idb";
import { addMinutes } from "date-fns";
import { isNetworkError } from "siftutils";
import {
  browser,
  getSetting,
  delayMs,
  MessageType,
  sendMessageToAllTabs,
  supportedSites,
  ErrorMessage,
  upgradeIdbAndGetConnection,
  addBadge,
} from "../common";
import type {
  Program,
  ProgramData,
  IMDBData,
  Message,
  SWMessageResponse,
} from "../common/types";
import {
  captureException,
  type ExceptionMetadata,
} from "../common/errorReporter";
import RatingsCache, { type RatingsCacheSchema } from "../common/RatingsCache";
import TelemetryStore, {
  type TelemetryStoreSchema,
} from "../common/TelemetryStore";
import OmdbApiClient from "./OmdbApiClient";
import * as siftApiService from "./SiftApiService";
import { RATING_API_REQUEST_TIMEOUT_MS } from "./constants";

let ratingsCache: RatingsCache;
let telemetryStore: TelemetryStore;
let omdbApiClient: OmdbApiClient;
(async () => {
  try {
    browser.runtime.onInstalled.addListener(onInstalled);
    browser.runtime.onMessage.addListener(handleMessage);
    browser.permissions.onAdded.addListener(handlePermissionsAdded);
    browser.tabs.onUpdated.addListener(handleTabUpdated);

    const db = await upgradeIdbAndGetConnection();
    ratingsCache = await RatingsCache.create(
      db as IDBPDatabase<RatingsCacheSchema>,
    );
    telemetryStore = await TelemetryStore.create(
      db as IDBPDatabase<TelemetryStoreSchema>,
    );
    omdbApiClient = new OmdbApiClient(fetchWithAddedTelemetry);

    // Running this on every service-worker startup instead of
    //   inside an onInstalled event listener (which is called for both
    //   installs and extension updates) because we want the content
    //   scripts to be injected where appropriate when a user
    //   disables, then re-enables the extension, and that is not a
    //   situation the onInstalled event listener runs for
    await injectUpdatedContentScripts();
  } catch (e) {
    captureException(e);
  }
})();

//////////////////////////////
//** function definitions **//
//////////////////////////////

async function onInstalled() {
  const onboardingStatus = await getSetting("onboardingStatus");

  if (onboardingStatus !== "finished") {
    addBadge("!");

    // firefox won't let us open the popup outside of a user-gesture
    if (TARGET_BROWSER !== "firefox") {
      browser.action.openPopup();
    }
  }
}

async function injectUpdatedContentScripts(tabUrlMatchPatterns: string[] = []) {
  const results = await sendMessageToAllTabs(
    { type: MessageType.healthCheck },
    tabUrlMatchPatterns,
  );
  results.forEach(({ tab, result }) => {
    if (
      result.status === "rejected" &&
      result.reason.message.includes("Receiving end does not exist")
    ) {
      browser.scripting.executeScript({
        files: [ISOLATED_CONTENT_SCRIPT_PATH],
        target: { tabId: tab.id! },
        world: "ISOLATED",
      });
      browser.scripting.executeScript({
        files: [MAIN_CONTENT_SCRIPT_PATH],
        target: { tabId: tab.id! },
        world: "MAIN",
      });
    }
  });
}

async function removeContentScripts(urlMatchPatterns: string[] = []) {
  // removal of the MAIN world content script will have to be handled
  //   via a window.postMessage from the ISOLATED world content script
  // there's no way for the service worker to communicate directly with
  //   the MAIN world content script
  await sendMessageToAllTabs({ type: MessageType.cleanup }, urlMatchPatterns);
}

async function handlePermissionsAdded({
  origins,
}: chrome.permissions.Permissions): Promise<void> {
  if (origins && origins.length > 0) {
    await injectUpdatedContentScripts(origins);
  }
}

async function handleTabUpdated(
  _tabId: number,
  changeInfo: { status?: string },
  tab: chrome.tabs.Tab,
): Promise<void> {
  if (changeInfo.status === "complete" && tab.url) {
    await injectUpdatedContentScripts([tab.url]);
  }
}

function handleMessage(
  request: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (arg: SWMessageResponse<unknown>) => void,
) {
  try {
    if (FF_TELEMETRY_ENABLED && !telemetryStore) {
      throw new Error(ErrorMessage.telemetryStoreNotReady);
    }

    if (request.type === MessageType.fetchIMDBRating) {
      if (!ratingsCache) throw new Error(ErrorMessage.ratingsCacheNotReady);

      const { pageUrl, program } = request.data;
      getIMDBData(program, pageUrl)
        .then((data) => sendResponse({ data }))
        .catch((e) =>
          handleError(e, { context: { program, location: { href: pageUrl } } }),
        );

      return true; // keeps channel open until sendReponse is called
    } else if (request.type === MessageType.webpageRatingStats) {
      if (FF_TELEMETRY_ENABLED) {
        telemetryStore
          .logEvent({
            type: "WEBPAGE_RATING_STATS_RECEIVED",
            data: request.data,
          })
          .catch(handleError);
      }
    } else if (request.type === MessageType.error) {
      if (FF_TELEMETRY_ENABLED) {
        telemetryStore
          .logEvent({ type: "ERROR", data: request.data })
          .catch(handleError);
      }
    } else if (request.type === MessageType.placeholder) {
      // do something here if desired
    } else if (request.type === MessageType.sitesDisabled) {
      const { sites } = request.data;
      const origins = sites.flatMap((site) => supportedSites[site].permStrings);
      removeContentScripts(origins)
        // give time for content-scripts to clean up
        .then(() => delayMs(500))
        .then(() => browser.permissions.remove({ origins }))
        .then(() => sendResponse({ data: null }))
        .catch(handleError);
      return true; // keep channel open until sendReponse is called
    } else if (request.type === MessageType.sitesEnabled) {
      const { sites } = request.data;
      const origins = sites.flatMap((site) => supportedSites[site].permStrings);

      if (TARGET_BROWSER === "firefox") {
        throw new Error(ErrorMessage.noAsyncPermissionRequestInFirefox);
      }

      // WARNING: will error in firefox, which only allows permissions.request
      //   calls inside a direct user-gesture handler (FF can't track that
      //   the message was sent inside user-gesture handler, and that therefore
      //   the message handling-logic is effectively responding to the
      //   user-gesture)
      browser.permissions
        .request({ origins })
        .then((granted) => {
          sendResponse({ data: { granted } });
          // The popup would have been open when this message was sent - it
          //   would have been sent in response to a user-action in the popup
          // However, the browser's permission-grant dialog, if the browser
          //   brought it up, would have then auto-closed the popup
          // We'll trigger the reopening of the popup here so the user can
          //   continue whatever they were doing
          // The popup itself will take care of placing the user on whatever
          //   page they were last on
          // Edge-case: if the permission-grant dialog did not appear (chrome
          //   doesn't bring it up if we are requesting a perm that was granted
          //   earlier, then revoked), then the popup is already open at this
          //   point, and this call will throw an error; we don't care to
          //   capture it
          browser.action.openPopup().catch(() => {});
        })
        .catch(handleError);
      return true; // keep channel open until sendReponse is called
    } else {
      throw new Error(`Unknown message type: ${request.type}`);
    }
  } catch (e) {
    handleError(e);
  }

  return false;

  function handleError(e: unknown, metadata?: ExceptionMetadata) {
    const error = e instanceof Error ? e : new Error(`${e}`);
    sendResponse({ error: error.message });

    if (isNetworkError(e) && !navigator.onLine) return;

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

// not using async-await here because we don't want to throw
//   inside the setTimeout if the request to the ratings-api
//   service takes too long (because errors thrown from inside
//   setTimeout would not be caught by upstream error handling)
function getIMDBData(
  program: Omit<Program, "node">,
  pageUrl: string,
): Promise<IMDBData> {
  return new Promise((resolve, reject) => {
    if (FF_TELEMETRY_ENABLED) {
      telemetryStore
        .logEvent({
          type: "PROGRAM_RATING_REQUEST_RECEIVED",
          data: { pageUrl },
        })
        .catch(reject);
    }

    ratingsCache.get(program).then((result) => {
      if (result && !result.isExpired) return resolve(result.data);
      const matchedImdbId = result?.data.imdbID;

      setTimeout(
        () => reject(new Error(ErrorMessage.ratingsApiRequestTimedOut)),
        RATING_API_REQUEST_TIMEOUT_MS,
      );

      omdbApiClient
        .fetchIMDBData(matchedImdbId || program)
        .then((imdbData) => cacheFetchedImdbRating(program, imdbData, pageUrl))
        .then(({ imdbData }) => resolve(imdbData))
        .catch(reject);
    });
  });
}

async function cacheFetchedImdbRating(
  program: ProgramData,
  imdbData: IMDBData,
  requestingPageUrl: string,
) {
  const ratingFound = imdbData.imdbRating !== "N/F";
  if (ratingFound) return ratingsCache.putOne({ program, imdbData });

  const matchResult = await siftApiService.getMatchedImdbId(
    program,
    requestingPageUrl,
  );
  if (["error", "pending"].includes(matchResult.status)) {
    // cache for long enough that the matching process on the
    //   server-side will have run before the next time we try
    //   to fetch this program's rating from the ratings-API
    return ratingsCache.putOne({
      program,
      imdbData,
      /* TODO: magic number */
      expiry: addMinutes(new Date(), 20),
    });
  } else if (matchResult.status === "matched") {
    // next time a rating for this program is requested, we'll
    //   make an api request to the ratings-API provider using
    //   the matched IMDb ID
    return ratingsCache.putOne({
      program,
      imdbData: { ...imdbData, imdbID: matchResult.imdbId },
      expiry: addMinutes(new Date(), -1),
    });
  } else /* matchResult.status === 'abandoned' */ {
    return ratingsCache.putOne({ program, imdbData });
  }
}

async function fetchWithAddedTelemetry(
  ...args: Parameters<typeof fetch>
): ReturnType<typeof fetch> {
  const startTime = +new Date();

  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_REQUEST_MADE",
      data: { startTime },
    });
  }

  const response = await fetch(...args);
  if (FF_TELEMETRY_ENABLED) {
    await telemetryStore.logEvent({
      type: "RATINGS_API_RESPONSE_RECEIVED",
      data: {
        startTime,
        durationMs: +new Date() - startTime,
      },
    });
  }

  return response;
}
