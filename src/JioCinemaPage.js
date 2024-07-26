import { IMDB_DATA_NODE_CLASS, getIMDBLink, waitFor } from "./common";

/* USAGE

```js
const page = new JioCinemaPage();
await page.initialize();
...
page.watchForNewPrograms(cb);
...
page.stopWatchingForNewPrograms();
```

*/
class JioCinemaPage {
  constructor() {
    this.contentContainer = null;
    this.newProgramCallback = null;
    this.observer = null;

    this._findProgramsInProgramList =
      this._findProgramsInProgramList.bind(this);
    this._mutationCallback = this._mutationCallback.bind(this);
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
    const programListNodes = Array.from(
      document.querySelectorAll("div.mui-style-e0sayp-stackBlock")
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

  watchForNewPrograms(callback) {
    this.newProgramCallback = callback;

    this.observer = new MutationObserver(this._mutationCallback);
    this.observer.observe(this.contentContainer, {
      subtree: true,
      childList: true,
    });
  }

  stopWatchingForNewPrograms() {
    this.observer.disconnect();
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
    let listTitle = node.querySelector("h2")?.textContent;
    if (!listTitle) {
      const gp = node.parentNode.parentNode;
      if (gp.classList.contains("MuiStack-root")) {
        listTitle = gp.querySelector("h2")?.textContent;
      }
    }
    return listTitle;
  }

  _extractDataFromProgramNode(node) {
    const isMovie = node.getAttribute("href").startsWith("/movies");
    const data = {};

    try {
      const ariaLabelParts = node
        .getAttribute("aria-label")
        .match(
          /^(.+?)(\((\d+)\).*)?(:|-)\s(Watch|Stay Tuned|All Seasons, Episodes|A Thrilling New Series)/
        );

      data.title = this._cleanTitle(ariaLabelParts[1]);
      data.type = isMovie ? "movie" : "series";
      data.year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;
    } catch (e) {
      e.message = `Error extracting data from program node: ${e.message}`;
      console.error(e, node);
    }

    return data;
  }

  _cleanTitle(title) {
    // removes suffixes like 'TV Show', 'Season 1', 'English Movie', etc.
    return title.replace(/\s*((TV Show)|(\S+ Movie)|(Season \d+))\s*$/, "");
  }

  _isValidProgramList({ title }) {
    // get rid of the channels and languages lists

    if (!title) {
      // channels list has no title
      return false;
    }

    if (title === "Watch In Your Language") {
      // languages list
      return false;
    }

    return true;
  }

  _checkProgramNodeIsForMovieOrTVShow(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/movies") || href.startsWith("/tv-shows");
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
      .filter(({ title }) => title);
    return programs;
  }

  _mutationCallback(mutationList) {
    for (const mutation of mutationList) {
      const target = mutation.target;

      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // check if a program node was added
        // this happens when scrolling horizontally through
        //   a program list
        if (
          node.nodeName === "A" &&
          node.classList.contains("block") &&
          node.getAttribute("role") === "button" &&
          this._checkProgramNodeIsForMovieOrTVShow(node)
        ) {
          const programNodeData = this._extractDataFromProgramNode(node);
          if (programNodeData) {
            this.newProgramCallback({ node, ...programNodeData });
          }
          continue;
        }

        // check if a program list node was added
        // this happens when scrolling vertically down the page
        if (
          node.nodeName === "DIV" &&
          node.classList.contains("mui-style-e0sayp-stackBlock")
        ) {
          const listTitle = this._getTitleFromProgramListNode(node);
          if (!this._isValidProgramList({ title: listTitle })) continue;

          this._findProgramsInProgramList({ node }).forEach(
            this.newProgramCallback
          );

          continue;
        }

        // check if a program list node's contents were modified
        // this happens in some special cases, like when changing
        //   the selected language in the 'Fresh Episodes' program list
        if (
          target.nodeName === "DIV" &&
          target.classList.contains("mui-style-e0sayp-stackBlock") &&
          node.nodeName === "DIV" &&
          node.classList.contains("slick-slider")
        ) {
          const listTitle = this._getTitleFromProgramListNode(target);
          if (!this._isValidProgramList({ title: listTitle })) continue;

          this._findProgramsInProgramList({ node: target }).forEach(
            this.newProgramCallback
          );

          continue;
        }

        // check if an element was added that contains one/more
        //   program list nodes
        // this usually happens when the page is loaded for the first time
        if (node.querySelector("div.mui-style-e0sayp-stackBlock")) {
          this.findPrograms().forEach(this.newProgramCallback);
          continue;
        }
      }
    }
  }
}

export default JioCinemaPage;
