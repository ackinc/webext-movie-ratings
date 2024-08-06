import AbstractPage from "./AbstractPage";
import AbstractProgramNode from "./AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "./common";

class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries() {
    return true;
  }

  static extractData(programNode) {
    const metadataWrapperNode = programNode.querySelector(
      "div.titleCard--metadataWrapper"
    );
    const durationNode = programNode.querySelector("span.duration");

    return {
      title: programNode.getAttribute("aria-label"),
      year: metadataWrapperNode
        ? metadataWrapperNode.querySelector("div.year").textContent
        : null,
      type: durationNode
        ? ["Seasons", "Episodes", "Series"].some((x) =>
            durationNode.textContent.includes(x)
          )
          ? "series"
          : "movie"
        : null,
    };
  }

  static insertIMDBNode(programNode, imdbNode) {
    if (programNode.matches("a.slider-refocus")) {
      programNode.parentNode.appendChild(imdbNode);
      return;
    }

    if (programNode.matches("div.titleCard--container")) {
      const metadataWrapper = programNode.querySelector(
        "div.titleCard--metadataWrapper"
      );
      metadataWrapper.insertBefore(imdbNode, metadataWrapper.lastChild);
    }

    console.error(
      "Error inserting IMDB node: program node not recognized",
      programNode
    );
  }

  static getIMDBNode(programNode) {
    if (programNode.matches("a.slider-refocus")) {
      const maybeIMDBNode = programNode.nextElementSibling;
      if (
        maybeIMDBNode &&
        maybeIMDBNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ) {
        return maybeIMDBNode;
      } else {
        return null;
      }
    }

    return programNode.querySelector(
      `div.titleCard--metadataWrapper > a.${IMDB_DATA_NODE_CLASS}`
    );
  }
}

class NetflixPage extends AbstractPage {
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
      }

      .titleCard--metadataWrapper a.${IMDB_DATA_NODE_CLASS} {
        margin-left: 1em;
        margin-bottom: 1em;
      }
    `;
  }

  findProgramContainerNodes() {
    return Array.from(
      document.querySelectorAll(
        "div.lolomoRow,div.titleGroup--wrapper,div.moreLikeThis--wrapper,div.gallery"
      )
    );
  }

  getTitleFromProgramContainerNode(pContainerNode) {
    if (pContainerNode.classList.contains("moreLikeThis--wrapper")) {
      return pContainerNode.querySelector(":scope > h3.moreLikeThis--header")
        .textContent;
    }

    if (pContainerNode.classList.contains("titleGroup--wrapper")) {
      return pContainerNode.querySelector(".titleGroup--header").textContent;
    }

    if (pContainerNode.classList.contains("gallery")) {
      return pContainerNode.previousElementSibling.previousElementSibling
        .textContent;
    }

    return pContainerNode.querySelector(":scope > h2 div.row-header-title")
      ?.textContent;
  }

  isValidProgramContainer(pContainer) {
    return !!pContainer.title;
  }

  findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;

    let programNodes;

    if (
      ["lolomoRow", "gallery"].some((cName) => node.classList.contains(cName))
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

export default NetflixPage;
