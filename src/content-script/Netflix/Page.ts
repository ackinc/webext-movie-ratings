import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
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
  font-size: 14px;
  font-weight: bold;
  margin: 4px 0 0 4px;
}

div.billboard div.info.meta-layer .${CssClasses.imdbDataNode} {
  margin: 0;
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
  padding: 0 4px;
  background-color: #0000007f;
  border-radius: 0;
  color: white;
}

.titleCard--metadataWrapper a.${CssClasses.imdbDataNode} {
  margin: 0 0 0.5em 1em;
}

section[data-uia="search-gallery"] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  left: 4px;
  margin: 0;
  padding: 0 4px;
  background-color: #0000007f;
  border-radius: 0;
  color: white;
}
    `;
  }

  override getProgramContainerNodeSelectors(): string[] {
    return [
      "div.billboard",
      "div.lolomoRow:not(.lolomoPreview)",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'section[data-uia="search-gallery"]',
    ];
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.billboard")) {
      return "Billboard";
    }

    if (pContainerNode.matches("div.lolomoRow:not(.lolomoPreview)")) {
      return (
        pContainerNode.querySelector(":scope > h2 div.row-header-title")
          ?.textContent ??
        pContainerNode.querySelector(":scope > h2.rowTitle")!.textContent
      );
    }

    if (pContainerNode.matches("div.titleGroup--wrapper")) {
      return pContainerNode.querySelector(".titleGroup--header")!.textContent;
    }

    if (pContainerNode.matches("div.moreLikeThis--wrapper")) {
      return pContainerNode.querySelector(":scope > h3.moreLikeThis--header")!
        .textContent;
    }

    if (pContainerNode.matches("div.gallery")) {
      const pContainerParent = pContainerNode.parentNode as HTMLElement;

      if (pContainerParent.matches('div[data-uia="modal-content-wrapper"]')) {
        return pContainerNode.previousElementSibling!.textContent;
      } else {
        return (
          /* My List page */
          pContainerParent.previousElementSibling!.querySelector("div.title")
            ?.textContent ||
          pContainerParent.previousElementSibling!.querySelector(
            "div.aro-genre-details > span.genreTitle",
          )!.textContent
        );
      }
    }

    if (pContainerNode.matches('section[data-uia="search-gallery"]')) {
      return "Search results";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return Boolean(pContainer.title);
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;

    if (node.matches("div.billboard")) {
      return ["div.info.meta-layer"];
    }

    if (
      [
        "div.lolomoRow:not(.lolomoPreview)",
        "div.titleGroup--wrapper",
        "div.gallery",
      ].some((sel) => node.matches(sel))
    ) {
      return ["div.title-card-container"];
    }

    if (node.matches("div.moreLikeThis--wrapper")) {
      return ["div.titleCard--container"];
    }

    if (node.matches('section[data-uia="search-gallery"]')) {
      return ['a[data-uia="search-gallery-video-card"][aria-label]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
