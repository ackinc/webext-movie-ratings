import type { PermString, ProgramFilterSettings, Sitename } from "./types";

export const DB_NAME = "siftDb";
export const DB_VERSION = 2;

// how long to wait before invoking the 'findProgramsAndAddRatings'
//   workhorse function after a reason to invoke it is detected
export const mainFnInvocationDelayMs = 100;

export const enum CssClasses {
  styleNode = "sift-style",
  imdbDataNode = "sift-imdb-data",
  imdbDataNodeContent = "sift-imdb-data-content",
  filteredOutProgramNode = "sift-filtered-out-program",
}
export const enum CssColors {
  mainBgColor = "#f5c618",
  highlightedBgColor = "#e2b615",
  mainTextColor = "#454545",
  successBg = "#43a047",
  warningBg = "orange",
  failureBg = "red",
}

export const ONE_MINUTE_IN_MS = 1000 * 60;
export const ONE_HOUR_IN_MS = ONE_MINUTE_IN_MS * 60;
export const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24;
export const ONE_WEEK_IN_MS = ONE_DAY_IN_MS * 7;

export const browser = globalThis.chrome;

export const languages = [
  "English",
  "Bengali",
  "Hindi",
  "Punjabi",
  "Tamil",
  "Telugu",
  "Marathi",
  "Kannada",
  "Malayalam",
  "Bhojpuri",
  "Gujarati",
  "Korean",
];

export const enum MessageType {
  fetchIMDBRating = "sift:fetchIMDBRating",
  fetchCachedIMDBRating = "sift:fetchCachedIMDBRating",
  reportIncorrectProgramMatch = "sift:reportIncorrectProgramMatch",
  urlChange = "sift:urlchange",
  filterSettingsChange = "sift:filterSettingsChange",
  orphanCheck = "sift:orphanCheck",
  cleanup = "sift:cleanup",
  removeUrlChangeDispatcher = "sift:removeUrlChangeDispatcher",
  outdatedUrlChangeDispatcherCleanup = "sift:outdatedUrlChangeDispatcherCleanup",
  healthCheck = "sift:healthCheck",
  webpageRatingStats = "sift:webpageRatingStats",
  error = "sift:error",
  placeholder = "sift:placeholderForTestingAndDebugging",
  sitesEnabled = "sift:sitesEnabled",
  sitesDisabled = "sift:sitesDisabled",
  getSelectProgramModeState = "sift:getSelectProgramModeState",
  toggleSelectProgramMode = "sift:toggleSelectProgramMode",
  setMediaRequestBlockingState = "sift:setMediaRequestBlockingState",
}

export const defaultProgramFilterSettings: ProgramFilterSettings = {
  minRating: 0,
  maxRating: 10,
  excludeUnratedPrograms: false,
  transparency: 75,
};

export const telemetryIntervalSizeInSeconds = 1;

export const selectorStatusKeyPrefix = "selectorStatus_";

export const enum ErrorMessage {
  extensionRuntimeDisappeared = "browser.runtime is undefined",
  unexpectedMessageChannelClosure = "The message channel was closed unexpectedly while waiting for a response",
  unrecognizedProgramContainerNode = "ProgramContainerNode does not match a recognized selector",
  unrecognizedProgramNode = "ProgramNode does not match a recognized selector",
  potentiallyOutOfDateSelector = "Potentially out of date selector",
  ratingsServiceNotInitialized = "The ratings service was not initialized",
  telemetryStoreNotReady = "The telemetry store is not ready",
  requestImdbDataTimedOut = "The service worker took too long to respond to a requestImdbData message",
  idbUpgradeCalledUnexpectedly = "IDB upgrade should be handled elsewhere",
  hostPermissionNotGranted = "A requested host permission was not granted",
  noAsyncPermissionRequestInFirefox = "permission.request must be called synchronously inside a user-gesture handler in Firefox",
  unexpectedTargetBrowser = "This code is running in the wrong browser!",
  siftApiServerError = "There was an error on the Sift API server-side",
  unexpectedDataExtractionFailure = "Failed to extract data from program node",
}

export const supportedSites = {
  appletv: {
    displayName: "AppleTV",
    permStrings: ["https://tv.apple.com/*"],
  },
  crunchyroll: {
    displayName: "Crunchyroll",
    permStrings: ["https://www.crunchyroll.com/*"],
  },
  // disneyplus: {
  //   displayName: "Disney Plus",
  //   permStrings: ["https://www.disneyplus.com/*"],
  // },
  hbomax: {
    displayName: "HBO Max",
    permStrings: ["https://www.hbomax.com/*", "https://play.hbomax.com/*"],
  },
  hotstar: {
    displayName: "Hotstar",
    permStrings: ["https://www.hotstar.com/*"],
  },
  hulu: {
    displayName: "Hulu",
    permStrings: ["https://www.hulu.com/*"],
  },
  mxplayer: {
    displayName: "MX Player",
    permStrings: ["https://www.mxplayer.in/*"],
  },
  netflix: {
    displayName: "Netflix",
    permStrings: ["https://www.netflix.com/*"],
  },
  paramountplus: {
    displayName: "Paramount Plus",
    permStrings: ["https://www.paramountplus.com/*"],
  },
  peacocktv: {
    displayName: "Peacock TV",
    permStrings: ["https://www.peacocktv.com/*"],
  },
  primevideo: {
    displayName: "Prime Video (primevideo.com)",
    permStrings: ["https://www.primevideo.com/*"],
  },
  primevideoamazondotcom: {
    displayName: "Prime Video (amazon.com/gp/video)",
    permStrings: ["https://www.amazon.com/*"],
  },
  primevideoamazondotde: {
    displayName: "Prime Video (amazon.de/gp/video)",
    permStrings: ["https://www.amazon.de/*"],
  },
  sonyliv: {
    displayName: "SonyLIV",
    permStrings: ["https://www.sonyliv.com/*"],
  },
  youtubemovies: {
    displayName: "Youtube Movies",
    permStrings: ["https://www.youtube.com/*"],
  },
  zee5: {
    displayName: "Zee5",
    permStrings: ["https://www.zee5.com/*"],
  },
} as const;

export const permStringToSitename = Object.entries(supportedSites).reduce(
  (acc, [sitename, { permStrings }]) =>
    Object.assign(
      acc,
      permStrings.reduce(
        (acc2, ps) => Object.assign(acc2, { [ps]: sitename }),
        {},
      ),
    ),
  {},
) as Record<PermString, Sitename>;

export const hostToSitename = Object.entries(supportedSites).reduce(
  (acc, [sitename, { permStrings }]) =>
    Object.assign(
      acc,
      permStrings.reduce(
        (acc2, ps) => Object.assign(acc2, { [new URL(ps).hostname]: sitename }),
        {},
      ),
    ),
  {},
) as Record<string, Sitename>;

export const webStoreLink =
  TARGET_BROWSER === "edge"
    ? "https://microsoftedge.microsoft.com/addons/detail/odgepppomekmdiifmjmocpjhopdmgjnl"
    : TARGET_BROWSER === "firefox"
      ? "https://addons.mozilla.org/en-US/firefox/addon/sift-imdb-ratings/"
      : "https://chromewebstore.google.com/detail/sift-imdb-ratings-on-vari/pfnhkljamlclkackkndllofcfhihacna";
