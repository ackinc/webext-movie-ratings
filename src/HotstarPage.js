import { IMDB_DATA_NODE_CLASS, getIMDBLink } from "./common";

class HotstarPage {
  constructor() {}

  async initialize() {
    this._injectStyles();
  }

  findPrograms() {
    const programContainerNodes =
      document.querySelectorAll("div.tray-container");
    const programContainers = Array.from(programContainerNodes)
      .map((node) => ({
        title: this._getTitleFromProgramContainerNode(node),
        node,
      }))
      .filter(this._isValidProgramContainer);

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
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: #999999;
        display: block;
        font-family: ${pageFontFamily};
        font-size: 14px;
        font-weight: bold;
        margin: 4px 0 0 8px;
      }

      div[data-scale-down="true"] a.${IMDB_DATA_NODE_CLASS} {
        margin: 0 0 0 2px;
        color: var(--ON-SURFACE-ALT);
        fontSize: 16px;
        fontWeight: 500;
      }
    `;
    document.head.appendChild(styleNode);
  }

  _getTitleFromProgramContainerNode(node) {
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

  _isValidProgramContainer({ title }) {
    return (
      title &&
      !["Popular Languages", "Popular Genres", "Popular Channels"].includes(
        title
      )
    );
  }

  _findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;

    const programNodes = Array.from(
      node.querySelectorAll('a[data-testid="link"]')
    ).filter(ProgramNode.checkProgramNodeIsForMovieOrTVShow);
    const programs = programNodes
      .map((node) => ({
        node,
        ...ProgramNode.extractData(node),
      }))
      // drop program nodes for which data extraction failed
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

  static getMetadataNode(node) {
    return node.firstChild.querySelector(
      ':scope > div[data-scale-down="true"]'
    );
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
}

export default HotstarPage;
