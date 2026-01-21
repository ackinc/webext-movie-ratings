import AbstractPage from "../AbstractPage";
import { CssClasses } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class CrunchyrollPage extends AbstractPage {
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
}
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    const selectors = [
      // home page (pre log-in)
      'section.cr-browse-section[data-t="browse-section"]',

      // home page (post log-in)
      "div.dynamic-feed-wrapper > div[data-id]",

      // category-specific page ("popular", "new", ...)
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
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (
      pContainerNode.matches(
        'section.cr-browse-section[data-t="browse-section"]',
      )
    ) {
      return pContainerNode.querySelector("h2.title")?.textContent ?? "";
    }

    if (pContainerNode.matches("div.dynamic-feed-wrapper > div[data-id]")) {
      return pContainerNode.querySelector("div[id] h2")?.textContent ?? "";
    }

    if (pContainerNode.matches("div.erc-browse-collection")) {
      return (
        // genre pages
        pContainerNode.querySelector("h2")?.textContent ??
        // simulcast season page
        pContainerNode.parentElement?.querySelector("div.header h1")
          ?.textContent ??
        // genre > category page (ex: "Action / Popular")
        pContainerNode.parentElement?.parentElement?.querySelector(
          "div.breadcrumbs-with-filters div.subgenres-breadcrumbs",
        )?.textContent ??
        ""
      );
    }

    if (pContainerNode.matches("div.erc-alphabetical-virtual-list")) {
      return (
        pContainerNode.parentElement?.parentElement?.querySelector("h1")
          ?.textContent ?? ""
      );
    }

    if (pContainerNode.matches("div.erc-genres-collection")) {
      return (
        pContainerNode.querySelector("div.collection-header h2")?.textContent ??
        ""
      );
    }

    if (pContainerNode.matches("div.erc-similar-to")) {
      return pContainerNode.querySelector("h3")?.textContent ?? "";
    }

    if (
      pContainerNode.matches(
        "div.erc-top-results,div.erc-series-results,div.erc-movies-results,div.erc-episodes-results",
      )
    ) {
      return pContainerNode.querySelector("h1,h2")?.textContent ?? "";
    }

    return "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return Boolean(
      pContainer.title &&
      !["News Collection"].some((x) => x === pContainer.title),
    );
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer,
  ): Program[] {
    const { node } = pContainer;

    let programNodes: HTMLElement[] = [];

    if (node.matches('section.cr-browse-section[data-t="browse-section"]')) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]'),
      );
    } else if (node.matches("div.dynamic-feed-wrapper > div[data-id]")) {
      programNodes = Array.from(
        node.querySelectorAll(
          [
            'div[data-t="carousel-card-wrapper"]',
            'div[data-t^="episode-card"]',
            'div[data-t^="watch-list-card"]',
            'div[data-t="release-episode-card-stack"]',
            'div[data-t="release-episode-card"]',
            'div[data-t="single-show-card"]',
          ].join(","),
        ),
      );
    } else if (node.matches("div.erc-browse-collection")) {
      programNodes = Array.from(node.querySelectorAll("div.browse-card"));
    } else if (node.matches("div.erc-alphabetical-virtual-list")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="series-card"]'),
      );
    } else if (node.matches("div.erc-genres-collection")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]'),
      );
    } else if (node.matches("div.erc-similar-to")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]'),
      );
    } else if (node.matches("div.erc-top-results,div.erc-series-results")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="search-series-card"]'),
      );
    } else if (node.matches("div.erc-movies-results")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="search-movie-card"]'),
      );
    } else if (node.matches("div.erc-episodes-results")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="search-episode-card"]'),
      );
    }

    const ctor = this.constructor as typeof CrunchyrollPage;
    const programs = programNodes
      .map((node) => ({
        node,
        ...ctor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);
    return programs;
  }
}
