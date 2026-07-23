import AbstractPage from "../AbstractPage";
import { ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import ProgramNode from "./ProgramNode";
import pageStyles from "./page.styles.css";

export default class YoutubeMoviesPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (location.pathname === "/feed/storefront") {
      return ['ytd-browse[role="main"] ytd-item-section-renderer'];
    }

    if (location.pathname === "/watch") {
      return [
        "ytd-watch-next-secondary-results-renderer > div#items",
        "ytd-watch-metadata",
      ];
    }

    return [];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (
      pContainerNode.matches(
        'ytd-browse[role="main"] ytd-item-section-renderer',
      )
    ) {
      if (
        document.querySelector(
          'ytd-browse[role="main"] div#header.ytd-browse yt-tab-shape[aria-selected="true"]',
        )?.textContent === "Purchased" &&
        pContainerNode
          .querySelector("div.promo-title")
          ?.textContent?.replace(/[^\s\w]/g, "") ===
          "You dont have any purchases"
      ) {
        return "";
      }

      return pContainerNode
        .querySelector("div#title-container div#title-text")!
        .textContent.trim();
    }

    if (
      pContainerNode.matches(
        "ytd-watch-next-secondary-results-renderer > div#items",
      )
    ) {
      return "More like this";
    }

    if (pContainerNode.matches("ytd-watch-metadata")) {
      return "Currently watching";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    return !!pContainer.title;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === 'ytd-browse[role="main"] ytd-item-section-renderer') {
      return ["ytd-grid-movie-renderer"];
    }

    if (selector === "ytd-watch-next-secondary-results-renderer > div#items") {
      return ["yt-lockup-view-model"];
    }

    if (selector === "ytd-watch-metadata") {
      return ["div#above-the-fold.ytd-watch-metadata"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
