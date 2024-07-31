import AbstractPage from "./AbstractPage";
import AbstractProgramNode from "./AbstractProgramNode";
import {
  IMDB_DATA_NODE_CLASS,
  IMDB_STYLE_NODE_CLASS,
  extractProgramTitle,
} from "./common";

class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return (
      href.startsWith("/movies") ||
      href.startsWith("/shows") ||
      href.startsWith("/trailer") ||
      (node.classList.contains("multipurpose-portrait-link") &&
        href.startsWith("https://www.sonyliv.com/dplnk?schema=sony://asset/"))
    );
  }

  static extractData(node) {
    const href = node.getAttribute("href");
    const data = {};

    data.title = extractProgramTitle(node.getAttribute("title"));
    data.type = href.startsWith("/movies")
      ? "movie"
      : href.startsWith("/shows")
      ? "series"
      : undefined;

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
}

class SonyLivPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        margin: 2px 0 0 8px;
        color: #999999;
        display: block;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        text-align: left;
        text-decoration: none;
      }
    `;
  }

  findProgramContainerNodes() {
    return Array.from(document.querySelectorAll("div.layout-main-container"));
  }

  getTitleFromProgramContainerNode(node) {
    return (
      node.querySelector(".listing-link h3")?.textContent ??
      node.querySelector(":scope > h3")?.textContent
    );
  }

  isValidProgramContainer(pContainer) {
    const { title } = pContainer;
    return (
      title &&
      ![
        "Popular Categories",
        "Popular Channels",
        "Watch In Your Language",
        "Popular Sports",
      ].includes(title)
    );
  }

  findProgramsInProgramContainer(pContainer) {
    const programNodes = Array.from(
      pContainer.node.querySelectorAll(
        "div.slick-track a.landscape-link,a.portrait-link,a.multipurpose-portrait-link"
      )
    ).filter(this.constructor.ProgramNode.isMovieOrSeries);
    const programs = programNodes
      .map((node) => ({
        node,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);
    return programs;
  }
}

export default SonyLivPage;
