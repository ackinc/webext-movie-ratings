export const IMDB_RATING_NODE_CLASS = "webext-imdb-rating";

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
