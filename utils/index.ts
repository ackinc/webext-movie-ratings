// this module is for simple, self-contained helper fns

export function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clampNum(val: number, min: number, max: number) {
  return val < min ? min : val > max ? max : val;
}

export async function waitFor<T>(
  fn: () => T,
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

export function invert<T extends (...args: Parameters<T>) => boolean>(
  fn: T,
): (...args: Parameters<T>) => boolean {
  return (...args) => !fn(...args);
}

export function partition<const T extends unknown[]>(
  elems: T,
  partFn: (el: T[number]) => boolean,
): [T[number][], T[number][]] {
  const pass: T[number][] = [];
  const fail: T[number][] = [];
  for (const el of elems) (partFn(el) ? pass : fail).push(el);
  return [pass, fail];
}

export function pick<
  const T extends Record<string, unknown>,
  const K extends string[],
>(
  obj: T,
  keys: K,
  requireAllKeys: boolean = false,
): Pick<T, keyof T & K[number]> {
  const [keysInObj, keysNotInObj] = partition(keys, (k) => k in obj);

  if (keysNotInObj.length > 0 && requireAllKeys) {
    throw new Error(`Required keys are absent: ${keysNotInObj.join(", ")}`);
  }

  return (keysInObj as (keyof T & K[number])[]).reduce(
    (acc, k) => Object.assign(acc, { [k]: obj[k] }),
    {} as Partial<Pick<T, keyof T & K[number]>>,
  ) as Pick<T, keyof T & K[number]>;
}

export function pickBy(
  obj: Record<string, unknown>,
  predFn: (value: unknown, key: string) => boolean = invert(isNullOrUndef),
) {
  const retval: Record<string, unknown> = {};
  for (const k in obj) {
    if (predFn(obj[k], k)) retval[k] = obj[k];
  }
  return retval;
}

export function isNullOrUndef(x: unknown) {
  return x == void 0;
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
  predFn: (value: unknown, key: string) => boolean = isNullOrUndef,
): Record<string, unknown> {
  const retval = { ...obj };
  for (const key in obj) {
    if (predFn(obj[key], key)) delete retval[key];
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

// see tests/utils.test.ts for examples
export function getGeneralizedUrlPath(href: string) {
  const url = new URL(href.startsWith("/") ? `tmp://${href}` : href);

  // replace numeric identifiers with a placeholder
  url.pathname = url.pathname.replace(/\/\d+(\/|\b)/g, (_m, p1) => `/:n${p1}`);

  // make search-param values and order of search-params irrelevant
  const searchParamKeys = Array.from(url.searchParams.keys()).sort();
  url.search = searchParamKeys.reduce(
    (acc, k, idx) => `${acc}${idx > 0 ? "&" : ""}${k}=:n`,
    "?",
  );

  return url.pathname + url.search;
}

export function ensureError(e: unknown): asserts e is Error {
  if (!(e instanceof Error)) throw new Error("Assertion failed", { cause: e });
}

export function isNetworkError(e: unknown): boolean {
  return (
    e instanceof TypeError &&
    [
      "Failed to fetch", // chrome/edge
      "NetworkError when attempting to fetch resource", // firefox
    ].some((x) => e.message.startsWith(x))
  );
}

export function shallowEqual(
  objA: Record<string, unknown>,
  objB: Record<string, unknown>,
): boolean {
  const keys = new Set(Object.keys(objA).concat(Object.keys(objB)));
  for (const k of keys) if (objA[k] !== objB[k]) return false;
  return true;
}
