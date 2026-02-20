import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle, ErrorMessage } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(node: HTMLElement): boolean {
    if (node.matches("a.trending-tray-link")) {
      // we can't say for sure, so always return true
      return true;
    }

    if (node.matches("div.sonyliv-original-block-wrap")) {
      return true;
    }

    const href = node.getAttribute("href") ?? "";
    return ["/movies", "/shows", "/trailer"].some((x) => href.startsWith(x));
  }

  static override extractData(node: HTMLElement): Omit<Program, "node"> {
    let title: string;
    let type: Program["type"] | undefined;

    if (node.matches("div.PopularSearchContainer a[id]")) {
      title =
        node
          .getAttribute("href")
          ?.split("/")
          .at(-1)
          ?.replace(/-\d+$/, "")
          .replace("-", " ") ?? "";

      const href = node.getAttribute("href");
      type = href?.startsWith("/movies")
        ? "movie"
        : href?.startsWith("/shows")
          ? "series"
          : undefined;
    } else if (
      node.matches("div.PopularSearchContainer div.sonyliv-original-block-wrap")
    ) {
      title =
        node.querySelector("div.sonyliv-original-right-sec h2")?.textContent ??
        "";

      type = node.querySelector("strong.episode-count") ? "series" : "movie";
    } else if (
      [
        "div.layout-main-container a.trending-tray-link",
        "div.layout-main-container a.landscape-link",
        "div.layout-main-container a.portrait-link",
        "div.layout-main-container a.multipurpose-portrait-link",
        "div.listinpage_wrapper a[title]",
        "div.searchWrapperContainer a[id]",
        "div.page-position > div.potraitTrayCards a.link_container",
      ].some((s) => node.matches(s))
    ) {
      title =
        node.getAttribute("title") ||
        node
          .querySelector("div.album-cover-container > img[title]")
          ?.getAttribute("title") ||
        // search preview
        node.querySelector("img.card-img")?.getAttribute("alt") ||
        "";

      const href = node.getAttribute("href");
      type = href?.startsWith("/movies")
        ? "movie"
        : href?.startsWith("/shows")
          ? "series"
          : undefined;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return { title: extractProgramTitle(title), ...(type ? { type } : {}) };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (programNode.matches("div.listinpage_wrapper .innerlist a[id]")) {
      programNode
        .querySelector("div.listing-portrait-card-inner-div")!
        .appendChild(imdbNode);
      return;
    }

    if (
      programNode.matches(
        "div.PopularSearchContainer div.sonyliv-original-block-wrap",
      )
    ) {
      const titleNode = programNode.querySelector(
        "div.sonyliv-original-right-sec > h2",
      );
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    programNode.appendChild(imdbNode);
  }
}
