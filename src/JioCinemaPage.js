import { IMDB_RATING_NODE_CLASS } from "./common";

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

  initialize() {
    return new Promise((resolve) => {
      this._injectStyles();

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          const { target } = mutation;
          if (
            target.nodeName === "DIV" &&
            target.getAttribute("id") === "__next" &&
            mutation.addedNodes.length > 0
          ) {
            for (const node of mutation.addedNodes) {
              let mainNode;
              if (
                node.nodeType === Node.ELEMENT_NODE &&
                (mainNode = node.querySelector("main"))
              ) {
                this.contentContainer = mainNode;
                observer.disconnect();
                resolve();
              }
            }
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
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

  addRating(program, rating) {
    const { node } = program;

    if (node.querySelector(`p.${IMDB_RATING_NODE_CLASS}`)) return;

    const ratingNode = document.createElement("p");
    ratingNode.classList.add(IMDB_RATING_NODE_CLASS);
    ratingNode.innerText = `IMDb ${rating}`;

    node.appendChild(ratingNode);
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
      p.webext-imdb-rating {
        color: #999999;
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

    const ariaLabelParts = node
      .getAttribute("aria-label")
      .match(/^(.+?)(\((\d+)\).*)?(:|-)\sWatch/);

    const title = this._cleanTitle(ariaLabelParts[1]);
    const year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;

    return {
      title: this._cleanTitle(title),
      type: isMovie ? "movie" : "series",
      year,
    };
  }

  _cleanTitle(title) {
    // removes suffixes like 'TV Show', 'English Movie', 'Hindi Movie', etc.
    return title.replace(/\s*((TV Show)|(\S+ Movie))\s*$/, "");
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
    const programs = programNodes.map((node) => ({
      node,
      ...this._extractDataFromProgramNode(node),
    }));
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
          this.newProgramCallback({
            node,
            ...this._extractDataFromProgramNode(node),
          });
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
