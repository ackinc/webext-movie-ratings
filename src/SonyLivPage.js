import { IMDB_DATA_NODE_CLASS, getIMDBLink } from "./common";

class SonyLivPage {
  constructor() {}

  async initialize() {
    this._injectStyles();
  }

  findPrograms() {
    const programContainers = this._findProgramContainersOnPage();
    const programs = programContainers
      .map(this._findProgramsInProgramContainer)
      .flat();
    return programs;
  }

  addIMDBData(program, data) {
    if (this.checkIMDBDataAlreadyAdded(program)) return;
    const ratingNode = this._createIMDBDataNode(data);
    ProgramNode.insertIMDBNode(program.node, ratingNode);
  }

  checkIMDBDataAlreadyAdded(program) {
    return !!ProgramNode.getIMDBNode(program.node);
  }

  _injectStyles() {
    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.createElement("style");
    styleNode.classList.add(GENERIC_NODE_CLASS);
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
    document.head.appendChild(styleNode);
  }

  _findProgramContainersOnPage() {
    const programContainerNodes = Array.from(
      document.querySelectorAll("div.layout-main-container")
    );
    const programContainers = programContainerNodes
      .map((node) => ({
        node,
        title: this._getTitleFromProgramContainerNode(node),
      }))
      .filter(this._isValidProgramContainer);
    return programContainers;
  }

  _getTitleFromProgramContainerNode(node) {
    return (
      node.querySelector(".listing-link h3")?.textContent ??
      node.querySelector(":scope > h3")?.textContent
    );
  }

  _isValidProgramContainer(pContainer) {
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

  _findProgramsInProgramContainer(pContainer) {
    const programNodes = Array.from(
      pContainer.node.querySelectorAll(
        "div.slick-track a.landscape-link,a.portrait-link,a.multipurpose-portrait-link"
      )
    ).filter(ProgramNode.checkProgramNodeIsForMovieOrTVShow);
    const programs = programNodes
      .map((node) => ({ node, ...ProgramNode.extractData(node) }))
      .filter(({ title, type }) => title && type);
    return programs;
  }

  _createIMDBDataNode(data) {
    const node = document.createElement("a");
    node.classList.add(IMDB_DATA_NODE_CLASS);
    if (data.imdbRating !== "N/F") {
      node.setAttribute("href", getIMDBLink(data.imdbID));
      node.setAttribute("target", "_blank");
    }
    if (["N/A", "N/F"].includes(data.imdbRating)) {
      node.style.visibility = "hidden";
    }
    node.innerText = `IMDb ${data.imdbRating}`;

    return node;
  }
}

class ProgramNode {
  static checkProgramNodeIsForMovieOrTVShow(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/movies") || href.startsWith("/shows");
  }

  static extractData(node) {
    const isMovie = node.getAttribute("href").startsWith("/movies");
    const data = {};

    data.title = node.getAttribute("title");
    data.type = isMovie ? "movie" : "series";

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

export default SonyLivPage;
