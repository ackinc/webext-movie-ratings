import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";
import { cssStyleSheetFromText } from "../utils";

export default class ParamountPlusPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheet = cssStyleSheetFromText(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (
      ["/live-tv", "/news", "/collections/sports-hub"].some((x) =>
        location.pathname.startsWith(x),
      )
    )
      return [];

    return [
      // home page, /browse/*, ...
      "div.carousel:has(h2.video-section-title)",
      'div.grid[data-id="search_results_grid"]',
      'div.grid:not(div[data-id="search_results_grid"])',

      // on hover
      "a.ch-expanded-container",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.carousel:has(h2.video-section-title)")) {
      return pContainerNode
        .querySelector("h2.video-section-title")!
        .textContent.trim();
    }

    if (pContainerNode.matches('div.grid[data-id="search_results_grid"]')) {
      return pContainerNode.previousElementSibling!.textContent;
    }

    if (
      pContainerNode.matches('div.grid:not(div[data-id="search_results_grid"])')
    ) {
      if (pContainerNode.dataset["title"])
        return pContainerNode.dataset["title"];

      if (pContainerNode.previousElementSibling?.matches("h1"))
        return pContainerNode.previousElementSibling.textContent.trim();

      return (
        pContainerNode
          .parentElement!.previousElementSibling?.querySelector("h2")
          ?.textContent?.trim() ?? "Grid"
      );
    }

    if (pContainerNode.matches("a.ch-expanded-container")) {
      return "Hovered program";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (
      ["ufc", "explore more collections"].some(
        (x) => pContainer.title.toLowerCase() === x,
      )
    )
      return false;

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.carousel:has(h2.video-section-title)") {
      return ["a.link"];
    }

    if (selector === 'div.grid[data-id="search_results_grid"]') {
      return ['a[role="listitem"]'];
    }

    if (selector === 'div.grid:not(div[data-id="search_results_grid"])') {
      return [
        "a.link",
        'article[role="listitem"]',
        "article.movie-browse-item",
      ];
    }

    if (selector === "a.ch-expanded-container") {
      // NOTE: ratings cannot be shown on hovered programs of
      //   search-results page because the card does not contain
      //   the title of the program
      return ["div.ch-bottom-components"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
