import type { Selector } from "./types";

export class DataExtractionError extends Error {
  static Cache: Map<string, DataExtractionError> = new Map();

  static from(error: Error, node: HTMLElement, selector?: Selector) {
    const key = [
      error.stack,
      location.href,
      node.outerHTML,
      selector ?? "",
    ].join("::");

    const cached = DataExtractionError.Cache.get(key);
    if (cached) return cached;

    const err = new DataExtractionError(error, node, selector);
    DataExtractionError.Cache.set(key, err);
    return err;
  }

  node: HTMLElement;
  pageUrl: string;
  selector: Selector | undefined;

  constructor(error: Error, node: HTMLElement, selector?: Selector) {
    super(`Error extracting data`, { cause: error });
    this.node = node;
    this.pageUrl = location.href;
    this.selector = selector;
  }
}
