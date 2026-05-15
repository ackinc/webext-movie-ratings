import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class CrunchyrollPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
    await super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
a.${CssClasses.imdbDataNode} {
  color: #999999 !important;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 0.875rem;
}

section[data-testid="super-carousel"] li {
  position: relative;
  margin-bottom: 1.25em;
}

section[data-testid="super-carousel"] li a.${CssClasses.imdbDataNode} {
  position: absolute;
  bottom: -2em;
}

div[data-t="series-card"] h2 {
  display: flex;
  gap: 1rem;
}

div[data-t^="watch-list-card"] h3 {
  height: auto !important
}

div.erc-episodes-results div[data-t="search-episode-card"] div:has(> small[data-t="series-title"]) {
  display: flex;
  align-items: center;
  gap: 8px;
}

div.erc-episodes-results div[data-t="search-episode-card"] div:has(> small[data-t="series-title"]) .${CssClasses.imdbDataNode} {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: bold;
  line-height: 16px;
}

div.erc-episodes-results div[class^="search-episode-card-hover"][data-t="hover-component"] a[data-t="series-title"] {
  display: flex;
  align-items: center;
  gap: 8px;
}

div.erc-episodes-results div[class^="search-episode-card-hover"][data-t="hover-component"] a[data-t="series-title"] .${CssClasses.imdbDataNode} {
  flex-shrink: 0;
  font-size: 0.625rem;
  font-weight: bold;
  line-height: 16px;
}

div[data-t="release-episode-card-stack-hover"] .${CssClasses.imdbDataNode} {
  padding-top: 4px;
  padding-left: 12px;
}

/* the 'div.' prefix to the selector below might look unnecessary, but it is
in fact what will prevent this clause from disappearing when the filtered-out
nodes' styles are overwritten due to a filter settings change */
div.${CssClasses.filteredOutProgramNode} {
  transition: opacity 0.5s ease-out;
}

.${CssClasses.filteredOutProgramNode}:hover {
  opacity: 1;
}

.${CssClasses.filteredOutProgramNode}[data-t="hover-component"] {
  opacity: 0;
}

.${CssClasses.filteredOutProgramNode}[data-t="hover-component"]:hover {
  opacity: 1;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page (pre log-in)
      'section.cr-browse-section[data-t="browse-section"]',

      // home page (post log-in)
      'div.dynamic-feed-wrapper > div[data-id]:has(div[class^="feed-header"])',
      'div.dynamic-feed-wrapper > div[data-id]:has(div[data-t="single-show-card"])',

      // non-genre category page ("popular", "new", ...)
      // simulcast season page
      "div.erc-browse-collection",

      // "browse all anime" page
      "div.erc-alphabetical-virtual-list",

      // genre pages ("action", "adventure", ...)
      "div.erc-genres-collection",

      // on single-show page
      "div.erc-similar-to",

      // search results
      "div.erc-top-results",
      "div.erc-series-results",
      "div.erc-movies-results",
      "div.erc-episodes-results",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (
      pContainerNode.matches(
        'section.cr-browse-section[data-t="browse-section"]',
      )
    ) {
      return pContainerNode.querySelector("h2.title")!.textContent;
    }

    if (
      pContainerNode.matches(
        'div.dynamic-feed-wrapper > div[data-id]:has(div[class^="feed-header"])',
      )
    ) {
      return pContainerNode.querySelector("div[id] h2")!.textContent;
    }

    if (
      pContainerNode.matches(
        'div.dynamic-feed-wrapper > div[data-id]:has(div[data-t="single-show-card"])',
      )
    ) {
      return "Untitled (single-show container)";
    }

    if (pContainerNode.matches("div.erc-browse-collection")) {
      if (location.pathname.startsWith("/simulcast")) {
        return pContainerNode.parentElement!.querySelector("div.header h1")!
          .textContent;
      }

      // "popular" subcategory page within a genre (ex: /videos/action/popular)
      if (
        location.pathname.split("/").length === 4 &&
        location.pathname.endsWith("/popular")
      ) {
        return pContainerNode.parentElement!.parentElement!.querySelector(
          "div.breadcrumbs-with-filters div.subgenres-breadcrumbs",
        )!.textContent;
      }

      // non-genre category pages (ex: "New", "Popular")
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (pContainerNode.matches("div.erc-alphabetical-virtual-list")) {
      return pContainerNode.parentElement!.parentElement!.querySelector("h1")!
        .textContent;
    }

    if (pContainerNode.matches("div.erc-genres-collection")) {
      return pContainerNode.querySelector("div.collection-header h2")!
        .textContent;
    }

    if (pContainerNode.matches("div.erc-similar-to")) {
      return pContainerNode.querySelector("h3")!.textContent;
    }

    if (
      pContainerNode.matches(
        "div.erc-top-results,div.erc-series-results,div.erc-movies-results,div.erc-episodes-results",
      )
    ) {
      return pContainerNode.querySelector("h1,h2")!.textContent;
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    return Boolean(
      pContainer.title &&
      !["News Collection"].some((x) => x === pContainer.title),
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === 'section.cr-browse-section[data-t="browse-section"]') {
      return ['div[data-t="carousel-card-wrapper"]'];
    }
    if (
      selector ===
      'div.dynamic-feed-wrapper > div[data-id]:has(div[class^="feed-header"])'
    ) {
      return [
        'div[data-t="carousel-card-wrapper"]',
        'div[class^="browse-card-hover"][data-t="hover-component"]',
        'div[data-t^="episode-card"]',
        'div[class^="playable-card-hover"][data-t="hover-component"]',
        'div[data-t^="watch-list-card"]',
        'div[data-t="release-episode-card-stack"]',
        'div[data-t="release-episode-card"]',
        'div[data-t="release-episode-card-stack-hover"]',
      ];
    }
    if (
      selector ===
      'div.dynamic-feed-wrapper > div[data-id]:has(div[data-t="single-show-card"])'
    ) {
      return ['div[data-t="single-show-card"]'];
    }
    if (selector === "div.erc-browse-collection") {
      return [
        "div.browse-card",
        'div[class^="browse-card-hover"][data-t="hover-component"]',
      ];
    }
    if (selector === "div.erc-alphabetical-virtual-list") {
      return [
        'div[data-t="series-card"]',
        'div[class^="horizontal-card-hover"][data-t="hover-component"]',
      ];
    }
    if (selector === "div.erc-genres-collection") {
      return ['div[data-t="carousel-card-wrapper"]'];
    }
    if (selector === "div.erc-similar-to") {
      return ['div[data-t="carousel-card-wrapper"]'];
    }
    if (["div.erc-top-results", "div.erc-series-results"].includes(selector)) {
      return [
        'div[data-t="search-series-card"]',
        'div[class^="search-show-card-hover"][data-t="hover-component"]',
      ];
    }
    if (selector === "div.erc-movies-results") {
      return ['div[data-t="search-movie-card"]'];
    }
    if (selector === "div.erc-episodes-results") {
      return [
        'div[data-t="search-episode-card"]',
        'div[class^="search-episode-card-hover"][data-t="hover-component"]',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
