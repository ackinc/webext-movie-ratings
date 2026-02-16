import { type ProgramFilterSettings } from "./types";

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
}

export enum SettingsKey {
  errorReportingOptIn = "errorReportingOptIn",
  programFiltersSettings = "programFiltersSettings",
  popupSeenAtLeastOnce = "popupSeenAtLeastOnce",
}

export const defaultProgramFilterSettings: ProgramFilterSettings = {
  minRating: 0,
  maxRating: 10,
  excludeUnratedPrograms: true,
  transparency: 75,
};

export const telemetryIntervalSizeInSeconds = 1;

// how many times must a selector (that had previously returned non-zero
//   nodes) return zero nodes consecutively for us to assume it is out of
//   date due to a website markup change
export const selectorFailureThreshold = 30;

export const enum ErrorMessages {
  unrecognizedProgramContainer = "ProgramContainerNode does not match a recognized selector",
}
