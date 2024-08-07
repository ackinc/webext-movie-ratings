import AbstractPage from "../common/AbstractPage";
import { IMDB_STYLE_NODE_CLASS, IMDB_DATA_NODE_CLASS } from "../common";
import ProgramNode from "./ProgramNode";

export default class AppleTvPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: var(--systemSecondary);
      }

      div.epic-inline-shelf a.${IMDB_DATA_NODE_CLASS} {
        color: #9f9f9f;
      }

      a.ordinal-chart-lockup a.${IMDB_DATA_NODE_CLASS} {
        font-size: 12px;
      }

      a.notes-lockup a.${IMDB_DATA_NODE_CLASS} {
        display: block;
        font-size: 12px;
        margin-bottom: 2px;
      }

      a.search-card__link a.${IMDB_DATA_NODE_CLASS} {
        font-size: 12px;
      }
    `;
  }

  findProgramContainerNodes() {
    // user is on MLS (sports) page
    if (location.pathname.includes("/channel/")) return [];

    const selectors = [
      // home page
      "div.landing__main > div.shelf-grid",
      "div.landing__main > div.epic-inline-shelf",
      // page of particular movie/series
      "div.product-main > div.shelf-grid",
      // category pages
      "div.canvas > div.shelf-grid",
      "div.infinite-grid",
      // top chart page
      "div.collection-page.ordinal-chart",
      // search results page
      "div.canvas > div > div.shelf-grid:not(.epic-stage__content-shelf)",
    ];
    return Array.from(document.querySelectorAll(selectors.join(", ")));
  }

  getTitleFromProgramContainerNode(pContainerNode) {
    if (
      pContainerNode.matches("div.shelf-grid") ||
      pContainerNode.matches("div.infinite-grid")
    ) {
      return pContainerNode
        .querySelector("div.shelf-grid__header h2")
        ?.textContent.trim();
    }

    if (pContainerNode.matches("div.epic-inline-shelf")) {
      return pContainerNode
        .querySelector("div.epic-inline-shelf__upsell-details__title")
        .textContent.trim();
    }

    if (pContainerNode.matches("div.collection-page.ordinal-chart")) {
      return pContainerNode.querySelector("h1").textContent.trim();
    }

    return null;
  }

  isValidProgramContainer(pContainer) {
    const { title } = pContainer;
    return (
      title &&
      ![
        // Home page
        "Browse by Category",
        // Particular movie/series page
        /^Season \d+$/,
        "Trailers",
        "Bonus Content",
        "Cast & Crew",
        "How to Watch",
      ].some((x) => (typeof x === "string" ? title === x : x.test(title)))
    );
  }

  findProgramsInProgramContainer(pContainer) {
    let programNodes = [];

    const { node } = pContainer;
    if (
      pContainer.node.matches("div.shelf-grid") ||
      pContainer.node.matches("div.infinite-grid") ||
      pContainer.node.matches("div.ordinal-chart")
    ) {
      programNodes = Array.from(
        node.querySelectorAll(
          "div.canvas-lockup[data-metrics-click],a.ordinal-chart-lockup[data-metrics-click],a.notes-lockup[data-metrics-click],a.search-card__link[data-metrics-click]"
        )
      );
    } else if (pContainer.node.matches("div.epic-inline-shelf")) {
      programNodes = Array.from(
        node.querySelectorAll("div.shelf-grid div.canvas-lockup")
      );
    }

    const programs = programNodes
      .map((node) => ({
        node,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);

    return programs;
  }
}
