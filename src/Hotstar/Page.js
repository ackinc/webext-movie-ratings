import AbstractPage from "../common/AbstractPage";
import ProgramNode from "./ProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";

export default class HotstarPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");
    styleNode.innerHTML = `
      div.swiper-slide > div:first-child {
        padding-bottom: 21px;
      }

      a.${IMDB_DATA_NODE_CLASS} {
        /* absolute positioning is needed to make this node 'extrude' outside the ancestor
             node that has the 'expand-onMouseEnter' event listener */
        position: absolute;
        color: #999999;
        display: block;
        font-family: ${pageFontFamily};
        font-size: 14px;
        font-weight: bold;
      }

      div[data-scale-down="true"] a.${IMDB_DATA_NODE_CLASS} {
        position: inherit;
        margin: 0 0 0 2px;
        color: var(--ON-SURFACE-ALT);
        font-size: 16px;
        font-weight: 500;
      }
    `;
  }

  findProgramContainerNodes() {
    return Array.from(document.querySelectorAll("div.tray-container"));
  }

  getTitleFromProgramContainerNode(node) {
    if (node.firstChild.dataset["testid"] === "grid-container") {
      return node.parentNode.parentNode.querySelector("div.headerSpace h4")
        .textContent;
    }

    if (
      node.parentNode.parentNode.parentNode.dataset["testid"] ===
      "scroll-section-More Like This"
    ) {
      return "More Like This";
    }

    return node.firstChild.querySelector("h2").textContent;
  }

  isValidProgramContainer({ title }) {
    return (
      title &&
      !["Popular Languages", "Popular Genres", "Popular Channels"].includes(
        title
      )
    );
  }

  findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;

    const programNodes = Array.from(
      node.querySelectorAll('a[data-testid="link"]')
    ).filter(this.constructor.ProgramNode.isMovieOrSeries);
    const programs = programNodes
      .map((node) => ({
        node,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      // drop program nodes for which data extraction failed
      .filter(({ title, type }) => title && type);
    return programs;
  }
}
