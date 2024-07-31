import AbstractPage from "./AbstractPage";
import AbstractProgramNode from "./AbstractProgramNode";
import {
  IMDB_DATA_NODE_CLASS,
  IMDB_STYLE_NODE_CLASS,
  extractProgramTitle,
  waitFor,
} from "./common";

class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/movies") || href.startsWith("/tv-shows");
  }

  static extractData(node) {
    const isMovie = node.getAttribute("href").startsWith("/movies");
    const data = {};

    const ariaLabelParts = node
      .getAttribute("aria-label")
      .match(
        /^(.+?)(\((\d+)\).*)?(:|-)\s(Watch|Stay Tuned|All Seasons, Episodes|A Thrilling New Series)/
      );

    if (!ariaLabelParts) {
      // console.error(`Error extracting data from program node`, node);
      return data;
    }

    data.title = ProgramNode.#extractProgramTitle(ariaLabelParts[1]);
    data.type = isMovie ? "movie" : "series";
    data.year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;

    return data;
  }

  static insertIMDBNode(node, imdbNode) {
    if (node.nextElementSibling) {
      node.parentNode.insertBefore(imdbNode, node.nextElementSibling);
    } else {
      node.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(node) {
    const maybeImdbDataNode = node.nextElementSibling;
    if (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbDataNode;
    }

    return null;
  }

  static #extractProgramTitle(str) {
    let title = extractProgramTitle(str);

    // page-specific exceptional cases
    if (title === "Watch Chernobyl") return "Chernobyl";
    else if (title === "Watch The Newsroom") return "The Newsroom";
    else if (title === "Enjoy Pokemon") return "Pokemon";
    else return title;
  }
}

class JioCinemaPage extends AbstractPage {
  static #programContainerNodeClasses = {
    LIST: "mui-style-e0sayp-stackBlock",
    GRID_MORE_LIKE_THIS: "mui-style-1kf8ltx-stackBlock",
    GRID_OTHER: "mui-style-6u7r0i-stackBlock",
  };

  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  async initialize() {
    this.injectStyles();
    await waitFor(
      () => document.querySelector("main"),
      // if a logged-in user visits the jiocinema website,
      //   jio presents them with an account-choosing UI
      //   which blocks the loading of the main page until
      //   the user selects an account
      // since the user may take any amount of time to do this,
      //   and we want the extension to work regardless, we have
      //   no option but to wait indefinitely
      Infinity,
      250
    );
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
        font-size: 12px;
        font-weight: bold;
        margin: -6px 0 0 4px;
      }
    `;
  }

  findProgramContainerNodes() {
    const selectors = Object.values(
      JioCinemaPage.#programContainerNodeClasses
    ).map((cName) => `div.${cName}`);

    const programContainerNodes = Array.from(
      document.querySelectorAll(selectors.join(","))
    );

    return programContainerNodes;
  }

  getTitleFromProgramContainerNode(node) {
    const containerClasses = JioCinemaPage.#programContainerNodeClasses;
    const { classList } = node;

    if (classList.contains(containerClasses.LIST)) {
      return this.#getTitleFromProgramListNode(node);
    }

    if (classList.contains(containerClasses.GRID_MORE_LIKE_THIS)) {
      return node.querySelector(":scope > h3").textContent;
    }

    if (classList.contains(containerClasses.GRID_OTHER)) {
      return node.firstChild.firstChild.nextElementSibling.querySelector(
        ":scope > h1"
      ).textContent;
    }

    return "";
  }

  #getTitleFromProgramListNode(node) {
    let listTitle = "";

    let titleContainerNode = node.firstChild.firstChild;
    if (titleContainerNode) {
      listTitle = titleContainerNode.querySelector(":scope > h2")?.textContent;
    }

    if (!listTitle) {
      titleContainerNode = node.parentNode.parentNode.firstChild;
      listTitle = titleContainerNode.querySelector(":scope > h2")?.textContent;
    }

    return listTitle;
  }

  isValidProgramContainer({ title }) {
    return (
      title &&
      !["Watch In Your Language", "Episodes", "Meet The Creators!"].includes(
        title
      )
    );
  }

  findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;
    const programNodes = Array.from(
      node.querySelectorAll('a.block[role="button"]')
    ).filter(ProgramNode.isMovieOrSeries);
    const programs = programNodes
      .map((node) => ({
        node,
        ...ProgramNode.extractData(node),
      }))
      // drop program nodes for which data extraction failed
      .filter(({ title, type }) => title && type);
    return programs;
  }
}

export default JioCinemaPage;
