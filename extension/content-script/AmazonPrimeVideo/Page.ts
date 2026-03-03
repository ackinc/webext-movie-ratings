import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessage } from "../../common";
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
    top: 0;
    left: 0;
    z-index: 3;
    margin: 0;
    border-radius: 0;
    border-bottom-right-radius: 3px;
    padding: 3px 7px;
    background-color: white;
    color: black !important;
    opacity: 1;
    font-size: 13px;
    font-weight: bold;
    line-height: var(--fable-typography-label-90-line-height);
}
    `;
  }

  override getProgramContainerNodeSelectors(): string[] {
    return [
      // /movie
      'section[data-testid="standard-carousel"]',

      // /movie ("featured originals", ...)
      'section[data-testid="super-carousel"]',

      // /movie ("top 10 movies in ...", ...)
      'section[data-testid="charts-container"]',

      // /movie (way down the page: "cinema-like experience at home ...")
      'section[data-testid="collection-carousel"]',

      // /movie -> click "see more"
      // search results page
      'div[data-testid="grid-container"]',

      // search results preview pane
      'div[data-testid="navigation-bar-content-cards-below"]',
    ];
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    let title: string;

    if (
      [
        'section[data-testid="standard-carousel"]',
        'section[data-testid="super-carousel"]',
        'section[data-testid="charts-container"]',
      ].some((x) => pContainerNode.matches(x))
    ) {
      title = pContainerNode.querySelector(
        'h2 span[data-testid="carousel-title"]',
      )!.textContent;
    } else if (
      pContainerNode.matches('section[data-testid="collection-carousel"]')
    ) {
      title = "Untitled";
    } else if (pContainerNode.matches('div[data-testid="grid-container"]')) {
      if (location.pathname.startsWith("/search/")) {
        // search results page
        title = pContainerNode.querySelector("h2")!.textContent;
      } else {
        // from main movies/shows page, click "see more" in any
        //   program container
        title =
          pContainerNode.parentElement!.firstElementChild!.querySelector(
            "h1",
          )!.textContent;
      }
    } else if (
      pContainerNode.matches(
        'div[data-testid="navigation-bar-content-cards-below"]',
      )
    ) {
      title = "Search results preview";
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
    }

    return title.trim();
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;
    if (
      [
        'section[data-testid="standard-carousel"]',
        'section[data-testid="charts-container"]',
        'div[data-testid="grid-container"]',
      ].some((sel) => node.matches(sel))
    ) {
      return ["article[data-card-title]"];
    }

    if (
      [
        'section[data-testid="super-carousel"]',
        'section[data-testid="collection-carousel"]',
      ].some((sel) => node.matches(sel))
    ) {
      return ['article[data-testid="super-carousel-card"]'];
    }

    if (
      ['div[data-testid="navigation-bar-content-cards-below"]'].some((sel) =>
        node.matches(sel),
      )
    ) {
      return ["article > a"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    // NOTE: SEARCH_RESULTS_PREVIEW_PANE
    // in search results preview pane, previews are updated in-place,
    //   meaning as user continues typing in search bar, they may be
    //   seeing ratings of the wrong programs
    const isInSearchResultsPreviewPane = program.node.matches(
      'div[data-testid="navigation-bar-content-cards-below"] article > a',
    );
    if (isInSearchResultsPreviewPane) return false;

    const hasImdbNode = !!(
      this.constructor as typeof AbstractPage
    ).ProgramNode.getIMDBNode(program.node);
    return hasImdbNode;
  }

  override addIMDBData(program: Program, data: IMDBData) {
    // see note about SEARCH_RESULTS_PREVIEW_PANE
    const isInSearchResultsPreviewPane = program.node.matches(
      'div[data-testid="navigation-bar-content-cards-below"] article > a',
    );
    if (isInSearchResultsPreviewPane) {
      (this.constructor as typeof AbstractPage).ProgramNode.removeIMDBNode(
        program.node,
      );
    }

    super.addIMDBData(program, data);
  }

  protected override getGeneralizedUrlPath(href: string): string {
    const retval = super.getGeneralizedUrlPath(href);

    const url = new URL(retval);
    url.pathname = url.pathname
      .split("/")
      .map((part) => (part.startsWith("ref=") ? "ref=:n" : part))
      .join("/");
    if (url.pathname.startsWith("/detail/")) {
      url.pathname = "/detail/:n" + url.pathname.split("/").slice(3).join("/");
    }

    return url.href;
  }
}
