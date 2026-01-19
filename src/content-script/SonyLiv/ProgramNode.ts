import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(node: HTMLElement): boolean {
    if (node.matches("a.trending-tray-link")) {
      // we can't say for sure, so always return true
      return true;
    }

    const href = node.getAttribute("href") ?? "";
    return ["/movies", "/shows", "/trailer"].some((x) => href.startsWith(x));
  }

  static override extractData(node: HTMLElement): Omit<Program, "node"> {
    const title = extractProgramTitle(
      node.getAttribute("title") ||
        node
          .querySelector("div.album-cover-container > img[title]")
          ?.getAttribute("title") ||
        // search preview
        node.querySelector("img.card-img")?.getAttribute("alt") ||
        "",
    );

    const href = node.getAttribute("href");
    const type = href?.startsWith("/movies")
      ? "movie"
      : href?.startsWith("/shows")
        ? "series"
        : undefined;

    return { title, ...(type ? { type } : {}) };
  }
}
