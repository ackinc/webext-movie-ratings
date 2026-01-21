import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

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

  override findProgramContainerNodes(): HTMLElement[] {
    const selectors = [
      "div.lolomoRow",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'section[data-uia="search-gallery"]',
    ];
    const nodes = document.querySelectorAll<HTMLElement>(selectors.join(","));
    return Array.from(nodes);
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

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer,
  ): Program[] {
    const { node } = pContainer;

    let programNodes: HTMLElement[] = [];

    if (
      ["lolomoRow", "gallery"].some((cName) =>
        node.classList.contains(cName),
      ) ||
      node.getAttribute("data-uia") === "search-video-gallery"
    ) {
      programNodes = Array.from(
        node.querySelectorAll("div.title-card-container"),
      );
    }

    if (
      ["moreLikeThis--wrapper", "titleGroup--wrapper"].some((cName) =>
        node.classList.contains(cName),
      )
    ) {
      programNodes = Array.from(
        node.querySelectorAll("div.titleCard--container"),
      );
    }

    if (node.matches('section[data-uia="search-gallery"]')) {
      programNodes = Array.from(
        node.querySelectorAll('a[data-uia="search-gallery-video-card"]'),
      );
    }

    const ctor = this.constructor as typeof NetflixPage;
    const programs = programNodes
      .map((node) => ({
        node,
        ...ctor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => title);
    return programs;
  }
}
