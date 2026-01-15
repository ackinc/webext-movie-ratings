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
  fetchIMDBRating = "fetchIMDBRating",
  urlChange = "sift:urlchange",
  filterSettingsChange = "filterSettingsChange",
}

export const enum SettingsKey {
  errorReportingOptIn = "errorReportingOptIn",
  programFiltersSettings = "programFiltersSettings",
}

export const defaultProgramFilterSettings = {
  minRating: 10,
  transparency: 0,
};
