import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class NetflixPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
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

section[data-uia="billboard"] .${CssClasses.imdbDataNode} {
  margin-left: 0;
  color: white;
}

div[data-uia="carousel-scroller"] div:has(> a[data-uia="progress-card"]) .${CssClasses.imdbDataNode} {
  margin-top: 12px;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      "div.billboard",
      "div.lolomoRow:not(.lolomoPreview)",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'section[data-uia="search-gallery"]',

      // 2026-05-14
      'div:has(> section[data-uia="billboard"])',
      "section.carousel-row",
    ];
  }

  protected override getTitleFromProgramContainerNode(
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

    if (pContainerNode.matches('div:has(> section[data-uia="billboard"])')) {
      return "Billboard";
    }

    if (pContainerNode.matches("section.carousel-row")) {
      return (pContainerNode.firstChild as HTMLElement).querySelector("p")!
        .textContent;
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    return Boolean(pContainer.title) && !pContainer.title.startsWith("WWE:");
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.billboard") {
      return ["div.info.meta-layer"];
    }

    if (
      [
        "div.lolomoRow:not(.lolomoPreview)",
        "div.titleGroup--wrapper",
        "div.gallery",
      ].includes(selector)
    ) {
      return ["div.title-card-container"];
    }

    if (selector === "div.moreLikeThis--wrapper") {
      return ["div.titleCard--container"];
    }

    if (selector === 'section[data-uia="search-gallery"]') {
      return ['a[data-uia="search-gallery-video-card"][aria-label]'];
    }

    if (selector === 'div:has(> section[data-uia="billboard"])') {
      return ['section[data-uia="billboard"]'];
    }

    if (selector === "section.carousel-row") {
      return [
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="standard-card"])',
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="progress-card"])',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
