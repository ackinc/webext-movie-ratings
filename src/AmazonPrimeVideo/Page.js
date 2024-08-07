import AbstractPage from "../common/AbstractPage";
import {
  findAncestor,
  IMDB_DATA_NODE_CLASS,
  IMDB_STYLE_NODE_CLASS,
} from "../common";
import ProgramNode from "./ProgramNode";

export default class AmazonPrimeVideoPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: #999999 !important;
        display: block;
        font-family: ${pageFontFamily};
        font-size: 15px;
        margin: 4px 0 0 4px;
      }

      section[data-testid="super-carousel"] li {
        position: relative;
        margin-bottom: 1.25em;
      }

      section[data-testid="super-carousel"] li a.${IMDB_DATA_NODE_CLASS} {
        position: absolute;
        bottom: -2em;
      }
    `;
  }

  findProgramContainerNodes() {
    const selectors = [
      'section[data-testid="standard-carousel"]',
      'section[data-testid="super-carousel"]',
      'section[data-testid="charts-carousel"]',
      'main[data-testid="browse"]',
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  getTitleFromProgramContainerNode(pContainerNode) {
    if (
      ["standard-carousel", "super-carousel"].includes(
        pContainerNode.dataset.testid
      )
    ) {
      return pContainerNode.querySelector(
        'h2 span[data-testid="carousel-title"]'
      ).textContent;
    }

    if (["charts-carousel"].includes(pContainerNode.dataset.testid)) {
      return findAncestor(
        pContainerNode,
        (node) => node.dataset.testid === "charts-container"
      ).querySelector('h2 span[data-testid="carousel-title"]').textContent;
    }

    if (["browse"].includes(pContainerNode.dataset.testid)) {
      return pContainerNode.querySelector("h1").textContent;
    }

    console.error(
      `Failed to get title for program container node`,
      pContainerNode
    );

    return null;
  }

  isValidProgramContainer() {
    return true;
  }

  findProgramsInProgramContainer(pContainer) {
    const { node } = pContainer;
    const { testid } = node.dataset;

    let programNodes = [];
    if (testid === "browse") {
      programNodes = Array.from(
        node.querySelectorAll("article[data-card-title")
      );
    } else if (["standard-carousel", "charts-carousel"].includes(testid)) {
      programNodes = Array.from(
        node.querySelectorAll(
          'ul[data-testid="card-container-list"] article[data-card-title]'
        )
      );
    } else if (testid === "super-carousel") {
      programNodes = Array.from(
        node.querySelectorAll(
          'ul[data-testid="card-container-list"] a[data-testid="poster-link"]'
        )
      );
    }

    const programs = programNodes
      .map((node) => ({
        node,
        containerType: testid,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);
    return programs;
  }
}
