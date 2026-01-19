import AbstractPage from "../AbstractPage";
import { CssClasses } from "../../common";
import type { IMDBData, ProgramContainer, Program } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class AmazonPrimeVideoPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
    await super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
.${CssClasses.imdbDataNode} {
  color: #999999 !important;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 15px;
}

article[data-card-title] .${CssClasses.imdbDataNode} {
  margin: 4px 0 0 4px;
}

article[data-testid="super-carousel-card"] .${CssClasses.imdbDataNode} {
    position: absolute;
    top: 4px;
    left: 4px;
    z-index: 3;
    margin: 0;
    border-radius: 8px;
    padding: 4px 8px;
    background-color: #000;
    opacity: 0.8;
}
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    const selectors = [
      // /movie
      'section[data-testid="standard-carousel"]',

      // /movie ("featured originals", ...)
      'section[data-testid="super-carousel"]',

      // /movie ("top 10 movies in ...", ...)
      'section[data-testid="charts-container"]',

      // /movie (way down the page: "cinema-like ...")
      'section[data-testid="collection-carousel"]',

      // /movie -> click "see more"
      // search results page
      'div[data-testid="grid-container"]',

      // search results preview pane
      'div[data-testid="navigation-bar-content-cards-below"]',
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    const testid = pContainerNode.dataset["testid"] ?? "";

    if (
      ["standard-carousel", "super-carousel", "charts-container"].includes(
        testid,
      )
    ) {
      return (
        pContainerNode.querySelector('h2 span[data-testid="carousel-title"]')
          ?.textContent ?? ""
      );
    }

    if (testid === "collection-carousel") {
      return "";
    }

    if (testid === "grid-container") {
      return (
        // search results page
        pContainerNode.querySelector("h2")?.textContent ??
        // "see more"
        pContainerNode.parentElement!.firstElementChild!.querySelector("h1")
          ?.textContent ??
        ""
      );
    }

    if (testid === "navigation-bar-content-cards-below") {
      return "Search results preview";
    }

    return "";
  }

  override isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    return true;
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer,
  ): Program[] {
    const { node } = pContainer;
    const testid = node.dataset["testid"] ?? "";

    let programNodes: HTMLElement[] = [];
    if (
      [
        "standard-carousel",
        "charts-carousel",
        "charts-container",
        "grid-container",
      ].includes(testid)
    ) {
      programNodes = Array.from(
        node.querySelectorAll("article[data-card-title]"),
      );
    } else if (testid === "super-carousel") {
      programNodes = Array.from(
        node.querySelectorAll('article[data-testid="super-carousel-card"]'),
      );
    } else if (testid === "navigation-bar-content-cards-below") {
      programNodes = Array.from(node.querySelectorAll("article > a"));
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

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    const hasImdbNode = !!(
      this.constructor as typeof AbstractPage
    ).ProgramNode.getIMDBNode(program.node);

    // NOTE: SEARCH_RESULTS_PREVIEW_PANE
    // in search results preview pane, previews are updated in-place,
    //   meaning as user continues typing in search bar, they may be
    //   seeing ratings of the wrong programs
    const isInSearchResultsPreviewPane = program.node.matches(
      'div[data-testid="navigation-bar-content-cards-below"] article > a',
    );
    return hasImdbNode && !isInSearchResultsPreviewPane;
  }

  override addIMDBData(program: Program, data: IMDBData) {
    const ratingNode = this.createIMDBDataNode(data);

    // see note about SEARCH_RESULTS_PREVIEW_PANE
    const isInSearchResultsPreviewPane = program.node.matches(
      'div[data-testid="navigation-bar-content-cards-below"] article > a',
    );
    if (isInSearchResultsPreviewPane) {
      (this.constructor as typeof AbstractPage).ProgramNode.removeIMDBNode(
        program.node,
      );
    }

    (this.constructor as typeof AbstractPage).ProgramNode.insertIMDBNode(
      program.node,
      ratingNode,
    );
  }
}
