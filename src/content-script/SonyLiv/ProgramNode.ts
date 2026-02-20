import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle, ErrorMessage } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    if (programNode.matches("a.trending-tray-link")) {
      // we can't say for sure, so always return true
      return true;
    }

    if (programNode.matches("div.sonyliv-original-block-wrap")) {
      return true;
    }

    const href = programNode.getAttribute("href") ?? "";
    return ["/movies", "/shows", "/trailer"].some((x) => href.startsWith(x));
  }

  static override extractProgramData(
    programNode: HTMLElement,
  ): Omit<Program, "node"> {
    let title: string;
    let type: Program["type"] | undefined;

    if (programNode.matches("div.PopularSearchContainer a[id]")) {
      title =
        programNode
          .getAttribute("href")
          ?.split("/")
          .at(-1)
          ?.replace(/-\d+$/, "")
          .replace("-", " ") ?? "";

      const href = programNode.getAttribute("href");
      type = href?.startsWith("/movies")
        ? "movie"
        : href?.startsWith("/shows")
          ? "series"
          : undefined;
    } else if (
      programNode.matches(
        "div.PopularSearchContainer div.sonyliv-original-block-wrap",
      )
    ) {
      title =
        programNode.querySelector("div.sonyliv-original-right-sec h2")
          ?.textContent ?? "";

      type = programNode.querySelector("strong.episode-count")
        ? "series"
        : "movie";
    } else if (
      [
        "div.layout-main-container a.trending-tray-link",
        "div.layout-main-container a.landscape-link",
        "div.layout-main-container a.portrait-link",
        "div.layout-main-container a.multipurpose-portrait-link",
        "div.listinpage_wrapper a[title]",
        "div.searchWrapperContainer a[id]",
        "div.page-position > div.potraitTrayCards a.link_container",
      ].some((s) => programNode.matches(s))
    ) {
      title =
        programNode.getAttribute("title") ||
        programNode
          .querySelector("div.album-cover-container > img[title]")
          ?.getAttribute("title") ||
        // search preview
        programNode.querySelector("img.card-img")?.getAttribute("alt") ||
        "";

      const href = programNode.getAttribute("href");
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
