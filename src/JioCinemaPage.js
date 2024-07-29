import {
  IMDB_DATA_NODE_CLASS,
  extractProgramTitle,
  getIMDBLink,
  waitFor,
} from "./common";

const PROGRAM_NODE_CONTAINER_CLASSES = {
  LIST: "mui-style-e0sayp-stackBlock",
  GRID_MORE_LIKE_THIS: "mui-style-1kf8ltx-stackBlock",
  GRID_OTHER: "mui-style-6u7r0i-stackBlock",
};

/* USAGE

```js
const page = new JioCinemaPage();
await page.initialize();
...
```

*/
class JioCinemaPage {
  constructor() {
    this.contentContainer = null;

    this._findProgramsInProgramContainer =
      this._findProgramsInProgramContainer.bind(this);
  }

  async initialize() {
    this.contentContainer = await waitFor(
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
    this._injectStyles();
  }

  // returns a list of all the programs currently being displayed on the page
  // a 'program' can be a movie, tv-series, or misc video content
  // we really only care about movies and tv-series
  findPrograms() {
    const programListSelectors = Object.values(
      PROGRAM_NODE_CONTAINER_CLASSES
    ).map((cName) => `div.${cName}`);

    const programListNodes = Array.from(
      document.querySelectorAll(programListSelectors.join(","))
    );

    const programLists = programListNodes
      .map((node) => ({
        node,
        title: this._getTitleFromProgramContainerNode(node),
      }))
      .filter(this._isValidProgramContainer);

    const programs = programLists
      .map(this._findProgramsInProgramContainer)
      .flat();

    return programs;
  }

  addIMDBData(program, data) {
    const { node } = program;

    if (
      node.nextElementSibling &&
      node.nextElementSibling.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return;
    }

    const ratingNode = document.createElement("a");
    ratingNode.classList.add(IMDB_DATA_NODE_CLASS);
    if (data.imdbRating !== "N/F") {
      ratingNode.setAttribute("href", getIMDBLink(data.imdbID));
      ratingNode.setAttribute("target", "_blank");
    }
    ratingNode.innerText = `IMDb ${data.imdbRating}`;

    if (node.nextElementSibling) {
      node.parentNode.insertBefore(ratingNode, node.nextElementSibling);
    } else {
      node.parentNode.appendChild(ratingNode);
    }
  }

  checkIMDBDataAlreadyAdded(program) {
    const maybeImdbDataNode = program.node.nextElementSibling;
    return (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    );
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
        font-size: 12px;
        font-weight: bold;
        margin: -6px 0 0 4px;
      }
    `;
    document.head.appendChild(styleNode);
  }

  _getTitleFromProgramContainerNode(node) {
    const { classList } = node;

    if (classList.contains(PROGRAM_NODE_CONTAINER_CLASSES.LIST)) {
      return this._getTitleFromProgramListNode(node);
    }

    if (
      classList.contains(PROGRAM_NODE_CONTAINER_CLASSES.GRID_MORE_LIKE_THIS)
    ) {
      return node.querySelector(":scope > h3").textContent;
    }

    if (classList.contains(PROGRAM_NODE_CONTAINER_CLASSES.GRID_OTHER)) {
      return node.firstChild.firstChild.nextElementSibling.querySelector(
        ":scope > h1"
      ).textContent;
    }

    return "";
  }

  _getTitleFromProgramListNode(node) {
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

  _isValidProgramContainer({ title }) {
    return (
      title &&
      !["Watch In Your Language", "Episodes", "Meet The Creators!"].includes(
        title
      )
    );
  }

  _findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;
    const programNodes = Array.from(
      node.querySelectorAll('a.block[role="button"]')
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
}

class ProgramNode {
  static checkProgramNodeIsForMovieOrTVShow(node) {
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

    data.title = this._extractProgramTitle(ariaLabelParts[1]);
    data.type = isMovie ? "movie" : "series";
    data.year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;

    return data;
  }

  static _extractProgramTitle(str) {
    let title = extractProgramTitle(str);

    // page-specific exceptional cases
    if (title === "Watch Chernobyl") return "Chernobyl";
    else if (title === "Watch The Newsroom") return "The Newsroom";
    else if (title === "Enjoy Pokemon") return "Pokemon";
    else return title;
  }
}

export default JioCinemaPage;
