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
