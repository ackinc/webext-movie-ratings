// this module is for simple, self-contained helper fns

import { browser, languages, SettingsKey } from "./constants";
import type { IsOptional } from "./types";

export function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clampNum(val: number, min: number, max: number) {
  return val < min ? min : val > max ? max : val;
}

export async function waitFor(
  fn: () => Promise<unknown>,
  maxTries = 10,
  intervalBetweenTriesMs = 500,
) {
  let nTries = 0;
  let val;
  while (++nTries <= maxTries) {
    if ((val = await fn())) return val;
    await delayMs(intervalBetweenTriesMs);
  }
  throw new Error("waitFor timed out");
}

export function invert<T extends unknown[]>(
  fn: (...args: T) => boolean,
): (...args: T) => boolean {
  return (...args) => !fn(...args);
}

export function pick(
  obj: Record<string, unknown>,
  keys: string[] | Record<string, IsOptional>,
  defaultRequired: boolean = false,
): Record<string, unknown> {
  if (Array.isArray(keys))
    keys = keys.reduce((acc, k) => ({ ...acc, [k]: defaultRequired }), {});

  const retval: Record<string, unknown> = {};

  for (const k in keys) {
    const isRequired = keys[k];

    if (!(k in obj) && isRequired)
      throw new Error(`Required key ${k} is absent`);

    retval[k] = obj[k];
  }

  return retval;
}

export function omit(
  obj: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const retval = { ...obj };
  for (const key of keys) delete retval[key];
  return retval;
}

export function omitBy(
  obj: Record<string, unknown>,
  predFn: (key: string) => boolean,
): Record<string, unknown> {
  const retval = { ...obj };
  for (const key of Object.keys(retval)) {
    if (predFn(key)) delete retval[key];
  }
  return retval;
}

export function findAncestor(
  node: HTMLElement,
  predFn: (node2: HTMLElement) => boolean,
): HTMLElement | null {
  let result = node.parentElement;
  while (result && !predFn(result)) result = result.parentElement;
  return result;
}

export function getIMDBLink(imdbID: string): string {
  return `https://www.imdb.com/title/${imdbID}`;
}

export async function getSetting(
  key: keyof typeof SettingsKey,
): Promise<unknown> {
  const result = await browser.storage.local.get([key]);
  return result[key];
}

export async function setSetting(
  key: keyof typeof SettingsKey,
  value: unknown,
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
    "(Dubs)",
    /\sS\d+$/, // suffixes like "S09"; see https://github.com/ackinc/webext-movie-ratings/issues/1
    /\(\d{4}\)/, // year
    // REVIEW: are there many programs whose titles legitimately
    //   end with these words?
    /Movie|Series$/,
    /: Restored Version$/i,
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

// see tests/utils.test.ts for examples
export function getGeneralizedUrlPath(href: string) {
  const url = new URL(href.startsWith("/") ? `tmp://${href}` : href);
  url.pathname = url.pathname.replace(/\/\d+(\/|\b)/g, (_m, p1) => `/:n${p1}`);
  url.search = url.search.replace(/=[^&#]+/g, "=:n");
  return url.pathname + url.search;
}

export function ensureError(e: unknown): asserts e is Error {
  if (!(e instanceof Error)) throw new Error("Assertion failed", { cause: e });
}
