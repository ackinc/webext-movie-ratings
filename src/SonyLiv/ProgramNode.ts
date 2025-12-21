import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, extractProgramTitle } from "../common";
import type { Program } from "../common/types";

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
        ""
    );

    const href = node.getAttribute("href");
    const type = href?.startsWith("/movies")
      ? "movie"
      : href?.startsWith("/shows")
        ? "series"
        : undefined;

    return { title, ...(type ? { type } : {}) };
  }

  static override insertIMDBNode(node: HTMLElement, imdbNode: HTMLElement) {
    if ((node.parentNode as HTMLElement).classList.contains("innerlistt")) {
      (node.firstChild as HTMLElement).style.marginBottom = "2em";
      node.firstChild!.firstChild!.appendChild(imdbNode);
    } else {
      node.parentNode!.parentNode!.appendChild(imdbNode);
    }
  }

  static override getIMDBNode(node: HTMLElement): HTMLElement | null {
    if ((node.parentNode as HTMLElement).classList.contains("innerlistt")) {
      const candidate = node.firstChild!.firstChild!.lastChild! as HTMLElement;
      return candidate.classList.contains(IMDB_DATA_NODE_CLASS)
        ? candidate
        : null;
    }

    const candidate = node.parentNode!.parentNode!.lastChild! as HTMLElement;
    return candidate.classList.contains(IMDB_DATA_NODE_CLASS)
      ? candidate
      : null;
  }
}
