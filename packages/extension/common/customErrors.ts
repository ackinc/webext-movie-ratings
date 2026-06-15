import type { Selector } from "./types";

export class DataExtractionError extends Error {
  // Because the extension's main data-extraction function runs on every
  //   page mutation, and the same data-extraction errors will occur on every
  //   invocation, we risk flooding Sentry with redundant error captures
  // The DataExtractionError caching logic below mitigates this
  static Cache: Map<string, DataExtractionError> = new Map();

  static from(error: Error, node: HTMLElement, selector?: Selector) {
    const key = [
      error.stack,
      location.href,
      node.outerHTML,
      selector ?? "",
    ].join("::");

    const cached = DataExtractionError.Cache.get(key);
    if (cached) {
      cached.__fromCache = true;
      return cached;
    }

    const err = new DataExtractionError(error, node, selector);
    DataExtractionError.Cache.set(key, err);
    return err;
  }

  node: HTMLElement;
  pageUrl: string;
  selector: Selector | undefined;

  // can be used downstream to figure out whether it's the first time
  //   this error is being encountered
  __fromCache: boolean;

  constructor(error: Error, node: HTMLElement, selector?: Selector) {
    super(`Error extracting data`, { cause: error });
    this.name = "DataExtractionError";
    this.node = node;
    this.pageUrl = location.href;
    this.selector = selector;
    this.__fromCache = false;
  }
}

// to identify errors that occurred on the SW-side in non-SW code (for
//   example, in code that deals with the response to a message sent
//   to the SW), so we don't call captureException on them a second time
export class SWError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class OmdbApiError extends Error {
  url: string;

  constructor(message: string, url: string, options?: { cause: unknown }) {
    super(message, options);
    this.url = url;
  }
}
