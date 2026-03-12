import { type ExtensionSettings, type ProgramFilterSettings } from "./types";

export const enum CssClasses {
  styleNode = "sift-style",
  imdbDataNode = "sift-imdb-data",
  filteredOutProgramNode = "sift-filtered-out-program",
}

export const ONE_HOUR_IN_MS = 1000 * 60 * 60;

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
  healthCheck = "sift:healthCheck",
  webpageRatingStats = "sift:webpageRatingStats",
  error = "sift:error",
  placeholder = "sift:placeholderForTestingAndDebugging",
}

export const ExtensionSettingsKeys = [
  "errorReportingOptIn",
  "programFiltersSettings",
  "popupSeenAtLeastOnce",
  "outdatedSelectorDetectionEnabled",
  "updatedDbVersion",
] as const satisfies (keyof ExtensionSettings)[];

export const defaultProgramFilterSettings: ProgramFilterSettings = {
  minRating: 0,
  maxRating: 10,
  excludeUnratedPrograms: true,
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
  idbUpgradeCalledUnexpectedly = "IDB upgrade should be handled elsewhere",
}
