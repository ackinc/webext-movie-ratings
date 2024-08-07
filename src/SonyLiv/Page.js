import AbstractPage from "../common/AbstractPage";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";
import ProgramNode from "./ProgramNode";

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
    return Array.from(
      document.querySelectorAll(
        "div.layout-main-container,div.Outerlistt.Outerlist"
      )
    );
  }

  getTitleFromProgramContainerNode(node) {
    return (
      node.querySelector(".listing-link h3")?.textContent ??
      node.querySelector(":scope > h3")?.textContent ??
      node.querySelector(":scope > div.heading-filter-wrap > h1")?.textContent
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
    const { node } = pContainer;
    const programNodes = Array.from(
      node.querySelectorAll(
        node.classList.contains("Outerlistt")
          ? ":scope > div.innerlistt.innerlist a[title]"
          : "div.slick-track a.landscape-link,a.portrait-link,a.multipurpose-portrait-link"
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
