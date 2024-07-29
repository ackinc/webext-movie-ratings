export const IMDB_DATA_NODE_CLASS = "webext-imdb-data";

export const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;

export const TWO_WEEKS_IN_MS = ONE_DAY_IN_MS * 7 * 2;

export function delayMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(fn, maxTries = 10, intervalBetweenTriesMs = 500) {
  let nTries = 0;
  let val;
  while (++nTries <= maxTries) {
    if ((val = await fn())) return val;
    await delayMs(intervalBetweenTriesMs);
  }
  throw new Error("waitFor timed out");
}

export function getIMDBLink(imdbID) {
  return `https://www.imdb.com/title/${imdbID}`;
}

export function invert(fn) {
  return (...args) => !fn(...args);
}

const languages = [
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
];

export function extractProgramTitle(str) {
  let title = str.trim();

  const toRemove = [
    "New TV Show",
    "TV Show",
    "TV Series",
    "Web Series",
    "Webseries",
    ...languages.map((l) => `${l} Movie`),
    // removes suffixes like "Season 1", "Season 1 Streaming Now",
    //   "Season 1 Episode 4", and "Season 1 Episode 4: <Episode Name>"
    /Season \d+.*$/,
    ...languages.map((l) => `(${l})`),
    // REVIEW: are there many programs whose titles legitimately
    //   end with these words?
    /Movie|Series$/,
  ];
  toRemove.forEach((x) => (title = title.replace(x, "")));
  return (
    title
      .trim()
      .replace(/\s+/, " ")
      // title should end with alphabet or number
      .replace(/[^A-Za-z0-9]*$/, "")
  );
}
