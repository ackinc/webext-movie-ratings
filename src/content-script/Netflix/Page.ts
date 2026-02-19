import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessages } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class NetflixPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
    await super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
a.${CssClasses.imdbDataNode} {
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 16px;
  font-weight: bold;
  margin: 4px 0 0 4px;
}

div.title-card-container .${CssClasses.imdbDataNode} {
  margin: 0;
  padding-top: 4px;
}

div.title-card-container:has(> div.progress) .${CssClasses.imdbDataNode} {
  padding-top: 16px;
}

div.title-card-container:has(svg.top-10-rank) .${CssClasses.imdbDataNode} {
  margin-left: 50%;
}

div.moreLikeThis--container div.titleCard--container .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  left: 4px;
  margin: 0;
  padding: 4px 8px;
  background-color: #141414;
  border-radius: 8px;
  color: #d2d2d2;
  font-size: 16px;
  font-weight: normal;
}

.titleCard--metadataWrapper a.${CssClasses.imdbDataNode} {
  margin: 0 0 0.5em 1em;
}

section[data-uia="search-gallery"] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  left: 4px;
  margin: 0;
  padding: 4px 8px;
  background-color: #141414;
  border-radius: 8px;
  color: #d2d2d2;
  font-size: 16px;
  font-weight: normal;
}
    `;
  }

  override getProgramContainerNodeSelectors(): string[] {
    return [
      "div.lolomoRow",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'section[data-uia="search-gallery"]',
    ];
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    const { classList } = pContainerNode;

    if (classList.contains("moreLikeThis--wrapper")) {
      return (
        pContainerNode.querySelector(":scope > h3.moreLikeThis--header")
          ?.textContent ?? ""
      );
    }

    if (classList.contains("titleGroup--wrapper")) {
      return (
        pContainerNode.querySelector(".titleGroup--header")?.textContent ?? ""
      );
    }

    if (classList.contains("gallery")) {
      const pContainerParent = pContainerNode.parentNode as HTMLElement;

      if (pContainerParent.matches('div[data-uia="modal-content-wrapper"]')) {
        return pContainerNode.previousElementSibling?.textContent ?? "";
      } else {
        return (
          pContainerParent.previousElementSibling?.querySelector("div.title")
            ?.textContent ||
          pContainerParent.previousElementSibling?.querySelector(
            "div.aro-genre-details > span.genreTitle",
          )?.textContent ||
          ""
        );
      }
    }

    if (classList.contains("lolomoRow")) {
      return (
        pContainerNode.querySelector(":scope > h2 div.row-header-title")
          ?.textContent ??
        pContainerNode.querySelector(":scope > h2.rowTitle")?.textContent ??
        ""
      );
    }

    if (pContainerNode.matches('section[data-uia="search-gallery"]')) {
      return "Search results";
    }

    return "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return Boolean(pContainer.title);
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;

    if (
      ["div.lolomoRow", "div.titleGroup--wrapper", "div.gallery"].some((sel) =>
        node.matches(sel),
      )
    ) {
      return ["div.title-card-container"];
    }

    if (node.matches("div.moreLikeThis--wrapper")) {
      return ["div.titleCard--container"];
    }

    if (node.matches('section[data-uia="search-gallery"]')) {
      return ['a[data-uia="search-gallery-video-card"]'];
    }

    throw new Error(ErrorMessages.unrecognizedProgramContainerNode);
  }
}
