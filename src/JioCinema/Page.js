import AbstractPage from "../common/AbstractPage";
import ProgramNode from "./ProgramNode";
import {
  IMDB_DATA_NODE_CLASS,
  IMDB_STYLE_NODE_CLASS,
  waitFor,
} from "../common";

export default class JioCinemaPage extends AbstractPage {
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
        font-size: 14px;
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
    // check if regular program list
    let titleNode = node.firstChild?.firstChild?.firstChild;
    if (titleNode?.nodeName === "H2") return titleNode.textContent;

    // check if toggle-able program list
    titleNode = node.parentNode.previousElementSibling?.firstChild?.firstChild;
    if (titleNode?.nodeName === "H2") return titleNode.textContent;

    return "";
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
