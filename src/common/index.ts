export const IMDB_DATA_NODE_CLASS = "webext-imdb-data";

export const IMDB_STYLE_NODE_CLASS = "webext-styles";

export const ONE_HOUR_IN_MS = 1000 * 60 * 60;

export const ONE_DAY_IN_MS = ONE_HOUR_IN_MS * 24;

export const ONE_WEEK_IN_MS = ONE_DAY_IN_MS * 7;

export const browser = chrome;

export function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitFor(
  fn: (...args: any[]) => Promise<unknown>,
  maxTries = 10,
  intervalBetweenTriesMs = 500
) {
  let nTries = 0;
  let val;
  while (++nTries <= maxTries) {
    if ((val = await fn())) return val;
    await delayMs(intervalBetweenTriesMs);
  }
  throw new Error("waitFor timed out");
}

export function getIMDBLink(imdbID: string): string {
  return `https://www.imdb.com/title/${imdbID}`;
}

export function invert(
  fn: (...args: any[]) => boolean
): (...args: any[]) => boolean {
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
  "Korean",
];

export function extractProgramTitle(str: string): string {
  let title = str.trim();

  const toRemove = [
    "New TV Show",
    "TV Show",
    "TV Series",
    "Web Series",
    "Webseries",
    // removes suffixes like "Season 1", "Season 1 Streaming Now",
    //   "Season 1 Episode 4", and "Season 1 Episode 4: <Episode Name>"
    /Season \d+.*$/i,
    ...languages.map((l) => `${l} Movie`),
    ...languages.map((l) => `(${l} Dub)`),
    ...languages.map((l) => `(${l})`),
    "(Dub)",
    /\(\d{4}\)/, // year
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

export function pick(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const retval: Record<string, unknown> = {};
  for (const key of keys) retval[key] = obj[key];
  return retval;
}

export function omit(
  obj: Record<string, unknown>,
  keys: string[]
): Record<string, unknown> {
  const retval = { ...obj };
  for (const key of keys) delete retval[key];
  return retval;
}

export function findAncestor(
  node: HTMLElement,
  predFn: (node2: HTMLElement) => boolean
): HTMLElement | null {
  let result = node.parentElement;
  while (result && !predFn(result)) result = result.parentElement;
  return result;
}
