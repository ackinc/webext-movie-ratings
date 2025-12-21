import AbstractPage from "../common/AbstractPage";
import ProgramNode from "./ProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";
import type { ProgramContainer, Program } from "../common/types";

export default class NetflixPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override injectStyles() {
    super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`)!;
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: #999999;
        display: block;
        font-family: ${pageFontFamily};
        font-size: 16px;
        font-weight: bold;
        margin: 4px 0 0 4px;
      }

      .titleCard--metadataWrapper a.${IMDB_DATA_NODE_CLASS} {
        margin: 0 0 0.5em 1em;
      }
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    const selectors = [
      "div.lolomoRow",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'div[data-uia="search-video-gallery"]',
    ];
    const nodes = document.querySelectorAll<HTMLElement>(selectors.join(","));
    return Array.from(nodes);
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement
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
            "div.aro-genre-details > span.genreTitle"
          )?.textContent ||
          ""
        );
      }
    }

    if (classList.contains("lolomoRow")) {
      return (
        pContainerNode.querySelector(":scope > h2 div.row-header-title")
          ?.textContent ?? ""
      );
    }

    return "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return Boolean(
      pContainer.title ||
      pContainer.node.getAttribute("data-uia") === "search-video-gallery"
    );
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const { node } = pContainer;

    let programNodes: HTMLElement[] = [];

    if (
      ["lolomoRow", "gallery"].some((cName) =>
        node.classList.contains(cName)
      ) ||
      node.getAttribute("data-uia") === "search-video-gallery"
    ) {
      programNodes = Array.from(
        node.querySelectorAll("div.ptrack-content a.slider-refocus")
      );
    }

    if (
      ["moreLikeThis--wrapper", "titleGroup--wrapper"].some((cName) =>
        node.classList.contains(cName)
      )
    ) {
      programNodes = Array.from(
        node.querySelectorAll("div.titleCard--container")
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
