import AbstractPage from "../AbstractPage";
import { ErrorMessage } from "@common";
import type { IMDBData, ProgramContainer, Program } from "@common/types";
import ProgramNode from "./ProgramNode";
import pageStyles from "./page.styles.css";

export default class AmazonPrimeVideoPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
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

  protected override getTitleFromProgramContainerNode(
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

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    return !["watch in your language"].some(
      (x) => pContainer.title.toLowerCase() === x,
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (
      [
        'section[data-testid="standard-carousel"]',
        'section[data-testid="charts-container"]',
        'div[data-testid="grid-container"]',
      ].includes(selector)
    ) {
      return [
        "article[data-card-title]",
        'div[data-testid="standard-mini-details"]',
      ];
    }

    if (
      [
        'section[data-testid="super-carousel"]',
        'section[data-testid="collection-carousel"]',
      ].includes(selector)
    ) {
      return ['article[data-testid="super-carousel-card"]'];
    }

    if (
      ['div[data-testid="navigation-bar-content-cards-below"]'].includes(
        selector,
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

    return super.checkIMDBDataAlreadyAdded(program);
  }

  protected override getGeneralizedUrlPath(href: string): string {
    let retval = super.getGeneralizedUrlPath(href);

    retval = retval
      .split("/")
      .map((part) => (part.startsWith("ref=") ? "ref=:n" : part))
      .join("/");
    if (retval.startsWith("/detail/")) {
      retval = "/detail/:n/" + retval.split("/").slice(3).join("/");
    }

    return retval;
  }

  protected override createIMDBDataNode(
    program: Program,
    imdbData: IMDBData,
  ): HTMLElement {
    const additionalClasses = program.node.matches(
      'article[data-testid="super-carousel-card"]',
    )
      ? "inside-super-carousel-card"
      : "";
    return super.createIMDBDataNode(program, imdbData, additionalClasses);
  }
}
