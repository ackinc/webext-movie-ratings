import AbstractPage from "./AbstractPage";
import AbstractProgramNode from "./AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "./common";

class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/in/movies") || href.startsWith("/in/shows");
  }

  static extractData(node) {
    const href = node.getAttribute("href");
    const isMovie = href.startsWith("/in/movies");

    const label = node.getAttribute("aria-label");
    if (!label) {
      // console.warn("No label found for node", node);
    }

    return {
      title: label?.replace(/,\s*?(Movie|Show),?.*$/, "").trim(),
      type: isMovie ? "movie" : "series",
    };
  }

  static insertIMDBNode(node, imdbNode) {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      metadataNode.insertBefore(
        imdbNode,
        metadataNode.lastChild.previousElementSibling
      );
    } else if (node.nextElementSibling) {
      node.parentNode.insertBefore(imdbNode, node.nextElementSibling);
    } else {
      node.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(node) {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      return metadataNode.querySelector(`a.${IMDB_DATA_NODE_CLASS}`);
    }

    const maybeImdbDataNode = node.nextElementSibling;
    if (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbDataNode;
    }

    return null;
  }

  static getMetadataNode(node) {
    return node.firstChild.querySelector(
      ':scope > div[data-scale-down="true"]'
    );
  }
}

class HotstarPage extends AbstractPage {
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

export default HotstarPage;
