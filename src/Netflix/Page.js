import AbstractPage from "../common/AbstractPage";
import ProgramNode from "./ProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";

export default class NetflixPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
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

  findProgramContainerNodes() {
    const selectors = [
      "div.lolomoRow",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'div[data-uia="search-video-gallery"]',
    ];
    const nodes = document.querySelectorAll(selectors.join(","));
    return Array.from(nodes);
  }

  getTitleFromProgramContainerNode(pContainerNode) {
    const { classList } = pContainerNode;

    if (classList.contains("moreLikeThis--wrapper")) {
      return pContainerNode.querySelector(":scope > h3.moreLikeThis--header")
        .textContent;
    }

    if (classList.contains("titleGroup--wrapper")) {
      return pContainerNode.querySelector(".titleGroup--header").textContent;
    }

    if (classList.contains("gallery")) {
      return pContainerNode.parentNode.previousElementSibling.querySelector(
        "div.title"
      ).textContent;
    }

    if (classList.contains("lolomoRow")) {
      return pContainerNode.querySelector(":scope > h2 div.row-header-title")
        ?.textContent;
    }

    return null;
  }

  isValidProgramContainer(pContainer) {
    return (
      pContainer.title ||
      pContainer.node.getAttribute("data-uia") === "search-video-gallery"
    );
  }

  findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;

    let programNodes;

    if (
      ["lolomoRow", "gallery"].some((cName) =>
        node.classList.contains(cName)
      ) ||
      node.getAttribute("data-uia") === "search-video-gallery"
    ) {
      programNodes = node.querySelectorAll(
        "div.ptrack-content a.slider-refocus"
      );
    }

    if (
      ["moreLikeThis--wrapper", "titleGroup--wrapper"].some((cName) =>
        node.classList.contains(cName)
      )
    ) {
      programNodes = node.querySelectorAll("div.titleCard--container");
    }

    const programs = Array.from(programNodes)
      .map((node) => ({
        node,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => title);
    return programs;
  }
}
