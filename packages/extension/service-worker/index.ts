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
import * as siftApiService from "../common/siftApiService";
import { RATING_API_REQUEST_TIMEOUT_MS } from "./constants";
import * as notificationsService from "../common/notificationsService";

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
  browser.runtime.setUninstallURL(SIFT_WEBSITE_URL + "/uninstall");

  const [
    onboardingStatus,
    errorReportingOptIn,
    pitchMissingRatingReportingPageSeen,
    mediaRequestBlockingEnabled,
    newNotifications,
  ] = await Promise.all([
    getSetting("onboardingStatus"),
    getSetting("errorReportingOptIn"),
    getSetting("pitchMissingRatingReportingPageSeen"),
    getSetting("mediaRequestBlockingEnabled"),
    notificationsService.checkForNewNotifications(),
  ]);

  if (APP_ENV === "development") {
    await setMediaRequestBlockingState(Boolean(mediaRequestBlockingEnabled));
  }

  if (
    onboardingStatus !== "finished" ||
    (!errorReportingOptIn && !pitchMissingRatingReportingPageSeen) ||
    newNotifications.length > 0
  ) {
    addBadge("!");
  }

  if (onboardingStatus !== "finished") {
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
    if (request.type === MessageType.fetchIMDBRating) {
      if (!ratingsCache) throw new Error(ErrorMessage.ratingsCacheNotReady);

      const { pageUrl, program } = request.data;
      getIMDBData(program, pageUrl)
        .then((data) => sendResponse({ data }))
        .catch((e) =>
          handleError(e, { context: { program, location: { href: pageUrl } } }),
        );

      return true; // keeps channel open until sendReponse is called
    } else if (request.type === MessageType.fetchCachedIMDBRating) {
      const { program } = request.data;
      getCachedIMDBData(program)
        .then((data) => sendResponse({ data }))
        .catch((e) => handleError(e, { context: { program } }));

      return true;
    } else if (request.type === MessageType.webpageRatingStats) {
      if (FF_TELEMETRY_ENABLED) {
        if (!telemetryStore) {
          throw new Error(ErrorMessage.telemetryStoreNotReady);
        }

        telemetryStore
          .logEvent({
            type: "WEBPAGE_RATING_STATS_RECEIVED",
            data: request.data,
          })
          .catch(handleError);
      }
    } else if (request.type === MessageType.error) {
      if (FF_TELEMETRY_ENABLED) {
        if (!telemetryStore) {
          throw new Error(ErrorMessage.telemetryStoreNotReady);
        }

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
    } else if (
      APP_ENV === "development" &&
      request.type === MessageType.setMediaRequestBlockingState
    ) {
      setMediaRequestBlockingState(request.data.value)
        .then(() => sendResponse({ data: { enabled: request.data.value } }))
        .catch(handleError);

      return true;
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
      // would've been captured from the server-side
      ErrorMessage.siftApiServerError,
    ];
    if (errorsToIgnore.includes(error.message)) return;
    captureException(error, metadata);
  }
}

async function getCachedIMDBData(
  program: ProgramData,
): Promise<(Required<IMDBData> & { key: string }) | undefined> {
  const cached = await ratingsCache.get(program);
  if (!cached) return undefined;
  return {
    ...cached.imdbData,
    expiry: +cached.expiry,
    key: ratingsCache.getKey(program),
  };
}

// not using async-await here because we don't want to throw
//   inside the setTimeout if the request to the ratings-api
//   service takes too long (because errors thrown from inside
//   setTimeout would not be caught by upstream error handling)
function getIMDBData(
  program: ProgramData,
  pageUrl: string,
): Promise<Required<IMDBData>> {
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
      if (result && result.expiry > new Date()) {
        return resolve({ ...result.imdbData, expiry: +result.expiry });
      }
      const matchedImdbId = result?.imdbData.imdbID;

      setTimeout(
        () => reject(new Error(ErrorMessage.ratingsApiRequestTimedOut)),
        RATING_API_REQUEST_TIMEOUT_MS,
      );

      omdbApiClient
        // matchedImdbId may be '' (cached N/F ratings), so we cannot use '??'
        //   operator below
        .fetchIMDBData(matchedImdbId || program)
        .then((imdbData) => cacheFetchedImdbRating(program, imdbData, pageUrl))
        .then(({ imdbData, expiry }) =>
          resolve({ ...imdbData, expiry: +expiry }),
        )
        .catch(reject);
    });
  });
}

async function cacheFetchedImdbRating(
  program: ProgramData,
  imdbData: IMDBData,
  requestingPageUrl: string,
) {
  if (imdbData.imdbID || imdbData.imdbRating !== "N/F") {
    return ratingsCache.putOne({ program, imdbData });
  }

  let matchResult;
  try {
    matchResult = await siftApiService.getMatchedImdbId(
      program,
      requestingPageUrl,
    );
  } catch (e) {
    // give some time for any server-side issues to be sorted out
    // we don't want to hammer the server with the same request
    //   on the next invocation of the loopFn
    await ratingsCache.putOne({ program, imdbData });
    throw e;
  }

  if (matchResult.status === "pending") {
    // cache for long enough that the matching process on the
    //   server-side will have run before the next time we try
    //   to fetch this program's rating from the ratings-API
    return ratingsCache.putOne({
      program,
      imdbData,
      expiry: addMinutes(new Date(), 1),
    });
  } else if (matchResult.status === "matched") {
    // next time a rating for this program is requested, we'll
    //   notice the cached rating is expired and make an api request
    //   to the ratings-API provider using the cached IMDb ID that
    //   came from the program-matching API
    return ratingsCache.putOne({
      program,
      imdbData: { ...imdbData, imdbID: matchResult.imdbId! },
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

async function setMediaRequestBlockingState(value: boolean): Promise<void> {
  const initiatorDomains = (
    browser.runtime.getManifest().optional_host_permissions! as string[]
  ).map((url) => new URL(url).hostname);
  const rules: chrome.declarativeNetRequest.Rule[] = [
    {
      id: 1,
      priority: 1,
      condition: {
        initiatorDomains,
        requestMethods: ["get"],
        resourceTypes: ["image", "media"],
      },
      action: { type: "block" },
    },
    {
      id: 6,
      priority: 1,
      condition: {
        // when images are blocked, zee5 enters an infinite loop where it tries
        // to load a particular svg; we want to avoid this
        initiatorDomains: initiatorDomains.filter((d) =>
          d.includes("zee5.com"),
        ),
        requestMethods: ["get"],
        requestDomains: ["www.zee5.com"],
        urlFilter: "/fallback_landscape_new.svg|",
      },
      action: { type: "allow" },
    },
    {
      id: 2,
      priority: 2,
      condition: {
        initiatorDomains: ["netflix.com"],
        requestMethods: ["get"],
        requestDomains: ["nflxvideo.net"],
      },
      action: { type: "block" },
    },
    {
      id: 3,
      priority: 2,
      condition: {
        initiatorDomains: ["hotstar.com"],
        requestMethods: ["get"],
        regexFilter: "^https://hses\\d+\\.hotstar\\.com/videos/.+\\.(mp4|m4s)$",
      },
      action: { type: "block" },
    },
    {
      id: 4,
      priority: 2,
      condition: {
        initiatorDomains: ["sonyliv.com"],
        requestMethods: ["get"],
        requestDomains: ["streaming.sonyliv.com"],
      },
      action: { type: "block" },
    },
    {
      id: 5,
      priority: 2,
      condition: {
        initiatorDomains: ["mxplayer.in"],
        requestMethods: ["get"],
        regexFilter: "^https://.+\\.cloudfront\\.net/video",
      },
      action: { type: "block" },
    },
  ];

  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRules.map(({ id }) => id),
  });
  if (value) {
    await browser.declarativeNetRequest.updateDynamicRules({
      addRules: value ? rules : [],
    });
  }
}
