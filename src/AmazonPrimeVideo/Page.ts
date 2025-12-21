import AbstractPage from "../common/AbstractPage";
import {
  findAncestor,
  IMDB_DATA_NODE_CLASS,
  IMDB_STYLE_NODE_CLASS,
} from "../common";
import type { ProgramContainer, Program } from "../common/types";
import ProgramNode from "./ProgramNode";

export default class AmazonPrimeVideoPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override injectStyles() {
    super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`)!;
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

  override findProgramContainerNodes(): HTMLElement[] {
    const selectors = [
      'section[data-testid="standard-carousel"]',
      'section[data-testid="super-carousel"]',
      'section[data-testid="charts-carousel"]',
      'section[data-testid="charts-container"]',
      'main[data-testid="browse"]',
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement
  ): string {
    const testid = pContainerNode.dataset["testid"] ?? "";

    if (
      ["standard-carousel", "super-carousel", "charts-container"].includes(
        testid
      )
    ) {
      return (
        pContainerNode.querySelector('h2 span[data-testid="carousel-title"]')
          ?.textContent ?? ""
      );
    }

    if (["charts-carousel"].includes(testid)) {
      return (
        findAncestor(
          pContainerNode,
          (node) => node.dataset["testid"] === "charts-container"
        )?.querySelector('h2 span[data-testid="carousel-title"]')
          ?.textContent ?? ""
      );
    }

    if (["browse"].includes(testid)) {
      return pContainerNode.querySelector("h1")?.textContent ?? "";
    }

    console.error(
      `Failed to get title for program container node`,
      pContainerNode
    );

    return "";
  }

  override isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    return true;
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const { node } = pContainer;
    const testid = node.dataset["testid"] ?? "";

    let programNodes: HTMLElement[] = [];
    if (testid === "browse") {
      programNodes = Array.from(
        node.querySelectorAll("article[data-card-title")
      );
    } else if (
      ["standard-carousel", "charts-carousel", "charts-container"].includes(
        testid
      )
    ) {
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

    const ctor = this.constructor as typeof AmazonPrimeVideoPage;
    const programs = programNodes
      .map((node) => ({
        node,
        ...ctor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);
    return programs;
  }
}
