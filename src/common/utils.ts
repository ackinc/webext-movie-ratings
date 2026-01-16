import { browser, languages, SettingsKey } from "./constants";

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

export function invert(
  fn: (...args: any[]) => boolean
): (...args: any[]) => boolean {
  return (...args) => !fn(...args);
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

export function getIMDBLink(imdbID: string): string {
  return `https://www.imdb.com/title/${imdbID}`;
}

export async function getSetting(
  key: keyof typeof SettingsKey
): Promise<unknown> {
  const result = await browser.storage.local.get([key]);
  return result[key];
}

export async function setSetting(
  key: keyof typeof SettingsKey,
  value: unknown
): Promise<void> {
  await browser.storage.local.set({ [key]: value });
}

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
    /\sS\d+$/, // suffixes like "S09"; see https://github.com/ackinc/webext-movie-ratings/issues/1
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
