// simple, self-contained helper fns

export function delayMs(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function clampNum(val: number, min: number, max: number) {
  return val < min ? min : val > max ? max : val;
}

type BackoffStrategy = {
  // if exponential, delays will be 1, n, n^2, ...
  type: "linear" | "exponential";
  n: number;
  maxRetries: number;
};
export function retry<Args extends unknown[], Ret>(
  fn: (...args: Args) => Promise<Ret>,
  strategy: BackoffStrategy,
): (...args: Args) => Promise<Ret> {
  const { type, n, maxRetries } = strategy;
  if (maxRetries < 0) throw new Error(`maxRetries cannot be < 0`);
  const delays = new Array(maxRetries)
    .fill(0)
    .map((_v, idx) => (type === "linear" ? n : 1 * Math.pow(n, idx)));

  return async (...args) => {
    let nRetries = 0;
    do {
      try {
        return await fn(...args);
      } catch (e) {
        if (nRetries === maxRetries) throw e;
        await delayMs(delays[nRetries]! * 1000);
        nRetries += 1;
      }
    } while (true);
  };
}

export function invert<T extends (...args: unknown[]) => boolean>(
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

export function pick<const T extends {}, const K extends string[]>(
  obj: T,
  keys: K,
  requireAll: boolean = false,
): Pick<T, keyof T & K[number]> {
  const [keysInObj, keysNotInObj] = partition(keys, (k) => k in obj);

  if (keysNotInObj.length > 0 && requireAll) {
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

export function omit<T extends {}, K extends (keyof T)[]>(
  obj: T,
  keys: K,
): Omit<T, K[number]> {
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

export function invertObj(obj: Record<string, string>) {
  return Object.entries(obj).reduce(
    (acc, [k, v]) => Object.assign(acc, { [v]: k }),
    {} as Record<string, string>,
  );
}

export function percentile(sortedNums: number[], pc: number): number {
  if (sortedNums.length === 0) throw new Error(`sortedNums cannot be empty`);
  if (pc < 0 || pc > 100) throw new Error(`pc must be in [0, 100]`);

  ensureSorted(sortedNums);

  if (sortedNums.length === 1) return sortedNums[0]!;
  if (pc === 0) return sortedNums[0]!;
  if (pc === 100) return sortedNums.at(-1)!;

  const tgtIdx = (sortedNums.length * pc) / 100;
  if (tgtIdx % 1) return sortedNums[Math.floor(tgtIdx)]!;
  return (sortedNums[tgtIdx - 1]! + sortedNums[tgtIdx]!) / 2;
}

export function ensureSorted(nums: number[]) {
  if (!isSorted(nums)) throw new Error(`nums are not sorted`);
}

export function isSorted(nums: number[]) {
  if (nums.length < 2) return true;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i]! < nums[i - 1]!) return false;
  }
  return true;
}

export function renderTemplate(
  templateString: string,
  vars: Record<string, unknown>,
) {
  const matches = templateString.match(/{{[^}]+}}/g) ?? [];
  return matches.reduce((acc, m) => {
    acc = acc.replaceAll(m, String(vars[m.replace(/\W/g, "")] ?? ""));
    return acc;
  }, templateString);
}
