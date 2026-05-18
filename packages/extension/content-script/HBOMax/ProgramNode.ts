import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches("div.image-grid-item")) {
      title = programNode.querySelector("a p")!.textContent;
    } else if (programNode.matches("div.img-wrapper-override")) {
      title = programNode.querySelector("img")!.getAttribute("alt")!;
    } else if (
      programNode.matches('div.row > div[class^="col"]:has(> img:first-child)')
    ) {
      title = programNode.querySelector("img")!.getAttribute("alt")!;
    } else if (
      programNode.matches(
        "li.react-multi-carousel-item a:has(div.item-container)",
      )
    ) {
      title =
        programNode.querySelector("h6")?.textContent ??
        programNode.querySelector("img")!.getAttribute("alt")!;
    } else if (programNode.matches("a.ymal-content-item")) {
      title = programNode.querySelector("h6")!.textContent;
    } else if (programNode.matches('a[data-sonic-type="show"]')) {
      title = programNode.getAttribute("aria-label")!.split(".")[0]!;
      if (
        programNode.firstElementChild!.matches(
          'div[class^="StyledRankImageContainer"]',
        )
      ) {
        // "top 10 ... lists"
        title = title.split(/Number \d+:\s+/)[1]!;
      }
    } else if (programNode.matches('a[data-sonic-type="video"]')) {
      const titleNode = programNode.querySelector(
        'span[class^="StyledPrimaryTitle"]',
      )!;
      title = titleNode.textContent.replace(/(Teaser|Trailer)$/, "");
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      ...(year && Number.isInteger(year) ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches('a[data-sonic-type="show"]')) {
      if (
        programNode.matches(
          'section[data-sonic-id="search-page-rail-results"] a[data-sonic-type="show"]',
        )
      ) {
        const titleNode = programNode.querySelector(
          'span[class^="StyledPrimaryTitle"]',
        )!;
        titleNode.insertAdjacentElement("afterend", imdbNode);
        return;
      } else if (
        programNode.firstElementChild!.matches(
          'div[class^="StyledRankImageContainer"]',
        )
      ) {
        programNode.lastElementChild!.appendChild(imdbNode);
      } else {
        super.insertIMDBNode(programNode, imdbNode);
      }
      return;
    }

    if (programNode.matches('a[data-sonic-type="video"]')) {
      const titleNode = programNode.querySelector(
        'span[class^="StyledPrimaryTitle"]',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
