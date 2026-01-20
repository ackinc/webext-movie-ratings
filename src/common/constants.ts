export const enum CssClasses {
  styleNode = "sift-style",
  imdbDataNode = "sift-imdb-data",
  filteredOutProgramNode = "sift-filtered-out-program",
}

export const ONE_HOUR_IN_MS = 1000 * 60 * 60;

export const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24;

export const ONE_WEEK_IN_MS = ONE_DAY_IN_MS * 7;

export const browser = chrome;

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
}

export const enum SettingsKey {
  errorReportingOptIn = "errorReportingOptIn",
  programFiltersSettings = "programFiltersSettings",
  popupSeenAtLeastOnce = "popupSeenAtLeastOnce",
}

export const defaultProgramFilterSettings = {
  minRating: 0,
  maxRating: 10,
  transparency: 0,
};
