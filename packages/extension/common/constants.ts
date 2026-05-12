import type { PermString, ProgramFilterSettings, Sitename } from "./types";

export const DB_NAME = "siftDb";
export const DB_VERSION = 2;

export const enum CssClasses {
  styleNode = "sift-style",
  imdbDataNode = "sift-imdb-data",
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
  toggleActiveTabLoopState = "sift:toggleActiveTabLoopState",
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
  unrecognizedProgramContainerNode = "ProgramContainerNode does not match a recognized selector",
  unrecognizedProgramNode = "ProgramNode does not match a recognized selector",
  potentiallyOutOfDateSelector = "Potentially out of date selector",
  ratingsCacheNotReady = "The ratings cache is not ready",
  telemetryStoreNotReady = "The telemetry store is not ready",
  ratingsApiRequestTimedOut = "The ratings API request timed out",
  ratingsApiRequestAlreadyInFlight = "A request for this program's rating is already in-flight",
  ratingsApiRequestFailed = "The ratings API request failed",
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
  hotstar: {
    displayName: "Hotstar",
    permStrings: ["https://www.hotstar.com/*"],
  },
  netflix: {
    displayName: "Netflix",
    permStrings: ["https://www.netflix.com/*"],
  },
  primevideo: {
    displayName: "Prime Video (primevideo.com)",
    permStrings: ["https://www.primevideo.com/*"],
  },
  primevideoalt: {
    displayName: "Prime Video (amazon.com/gp/video)",
    permStrings: ["https://www.amazon.com/*"],
  },
  sonyliv: {
    displayName: "SonyLIV",
    permStrings: ["https://www.sonyliv.com/*"],
  },
  youtubemovies: {
    displayName: "Youtube Movies",
    permStrings: ["https://www.youtube.com/*"],
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
      ? "https://addons.mozilla.org/en-US/firefox/addon/imdb-ratings-for-various-ott/"
      : "https://chromewebstore.google.com/detail/sift-imdb-ratings-on-vari/pfnhkljamlclkackkndllofcfhihacna";
