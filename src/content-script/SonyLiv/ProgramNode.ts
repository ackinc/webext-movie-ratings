import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle, ErrorMessage } from "../../common";
import type { Program, ProgramData } from "../../common/types";

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

  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string;
    let type: Program["type"] | undefined;

    if (
      [
        "div.layout-main-container:has(> div.listView) a.portrait-link",
        "div.layout-main-container:has(> div.slick-slider) a.trending-tray-link",
        "div.layout-main-container:has(> div.slick-slider) a.portrait-link",
        "div.layout-main-container:has(> div.slick-slider) a.multipurpose-portrait-link",
        "div.searchWrapperContainer a[id]",
        "div.page-position > div.potraitTrayCards a.link_container",
      ].some((s) => programNode.matches(s))
    ) {
      title =
        programNode.getAttribute("aria-label") ||
        programNode.getAttribute("title") ||
        programNode
          .querySelector("div.album-cover-container > img[title]")
          ?.getAttribute("title") ||
        // search preview
        programNode.querySelector("img.card-img")!.getAttribute("alt")!;

      type = getProgramTypeFromHref(programNode.getAttribute("href")!);
    } else if (
      programNode.matches(
        "div.layout-main-container:has(> div.slick-slider) a.landscape-link",
      )
    ) {
      title = programNode.querySelector("h4.c-show-title")!.textContent;
      type = getProgramTypeFromHref(programNode.getAttribute("href")!);
    } else if (programNode.matches("div.PopularSearchContainer a[id]")) {
      const href = programNode.getAttribute("href")!;
      title = href.split("/").at(-1)!.replace(/-\d+$/, "").replace("-", " ");
      type = getProgramTypeFromHref(href);
    } else if (
      programNode.matches(
        "div.PopularSearchContainer div.sonyliv-original-block-wrap",
      )
    ) {
      title = programNode.querySelector(
        "div.sonyliv-original-right-sec h2",
      )!.textContent;

      type = programNode.querySelector("strong.episode-count")
        ? "series"
        : "movie";
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return { title: extractProgramTitle(title), ...(type ? { type } : {}) };

    function getProgramTypeFromHref(href: string): Program["type"] | undefined {
      return href.startsWith("/movies")
        ? "movie"
        : href.startsWith("/shows")
          ? "series"
          : undefined;
    }
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
