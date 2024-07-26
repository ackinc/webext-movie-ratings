import { IMDB_DATA_NODE_CLASS, getIMDBLink, waitFor } from "./common";

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

    this._findProgramsInProgramList =
      this._findProgramsInProgramList.bind(this);
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
    const programListSelectors = [
      "div.mui-style-e0sayp-stackBlock", // program list
      "div.mui-style-6u7r0i-stackBlock", // program grid on program listing page (ex: "Best of premium")
      "div.mui-style-1kf8ltx-stackBlock", // program grid on program-specific page
    ];

    const programListNodes = Array.from(
      document.querySelectorAll(programListSelectors.join(","))
    );

    const programLists = programListNodes
      .map((node) => ({ node, title: this._getTitleFromProgramListNode(node) }))
      .filter(this._isValidProgramList);

    const programs = programLists.map(this._findProgramsInProgramList).flat();

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

  _getTitleFromProgramListNode(node) {
    let listTitle = node.querySelector("h1,h2,h3")?.textContent;
    if (!listTitle) {
      const gp = node.parentNode.parentNode;
      listTitle = gp.querySelector("h2")?.textContent;
    }
    return listTitle;
  }

  _isValidProgramList({ title }) {
    return (
      title &&
      !["Watch In Your Language", "Episodes", "Meet The Creators!"].includes(
        title
      )
    );
  }

  _findProgramsInProgramList(pList) {
    const { node } = pList;
    const programNodes = Array.from(
      node.querySelectorAll('a.block[role="button"]')
    ).filter(this._checkProgramNodeIsForMovieOrTVShow);
    const programs = programNodes
      .map((node) => ({
        node,
        ...this._extractDataFromProgramNode(node),
      }))
      // drop program nodes for which data extraction failed
      .filter(({ title, type }) => title && type);
    return programs;
  }

  _checkProgramNodeIsForMovieOrTVShow(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/movies") || href.startsWith("/tv-shows");
  }

  _extractDataFromProgramNode(node) {
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

    data.title = this._cleanTitle(ariaLabelParts[1]);
    data.type = isMovie ? "movie" : "series";
    data.year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;

    return data;
  }

  _cleanTitle(title) {
    // removes suffixes like 'TV Show', 'Season 1', 'Season 1 Episode 4',
    //   'English Movie', etc.
    return title
      .trim()
      .replace(
        /\s*((TV Show)|(Web Series)|(\S+ Movie)|(Season \d+(\s+Episode\d+)?))$/,
        ""
      );
  }
}

export default JioCinemaPage;
