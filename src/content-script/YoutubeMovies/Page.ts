import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class YoutubeMoviesPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
    await super.injectStyles();

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
.${CssClasses.imdbDataNode} {
    margin-left: 4px;
    padding: 0 4px;

    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 2px;
    color: #606060;
    text-decoration: none;

    font-family: Roboto, Arial, sans-serif;
    font-size: 1.2rem;
    font-weight: 500;
    line-height: 1.8rem;
}

ytd-watch-next-secondary-results-renderer > div#items .${CssClasses.imdbDataNode} {
    background-color: transparent;
    outline: 1px solid rgba(0, 0, 0, 0.1);
    outline-offset: -1px;
}
    `;
  }

  override getProgramContainerNodeSelectors(): string[] {
    if (location.pathname === "/feed/storefront") {
      return ['ytd-browse[role="main"] ytd-item-section-renderer'];
    }

    if (location.pathname === "/watch") {
      return ["ytd-watch-next-secondary-results-renderer > div#items"];
    }

    return [];
  }

  override getTitleFromProgramContainerNode(
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

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return !!pContainer.title;
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;
    if (node.matches('ytd-browse[role="main"] ytd-item-section-renderer')) {
      return ["ytd-grid-movie-renderer"];
    }

    if (node.matches("ytd-watch-next-secondary-results-renderer > div#items")) {
      return ["ytd-compact-movie-renderer"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
