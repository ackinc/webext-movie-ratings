import AbstractPage from "../common/AbstractPage";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";
import type { ProgramContainer, Program } from "../common/types";
import ProgramNode from "./ProgramNode";

export default class CrunchyrollPage extends AbstractPage {
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
        font-size: 0.75rem;
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
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement
  ): string {
    if (
      pContainerNode.matches(
        'section.cr-browse-section[data-t="browse-section"]'
      )
    ) {
      return pContainerNode.querySelector("h2.title")?.textContent ?? "";
    }

    if (pContainerNode.matches("div.dynamic-feed-wrapper > div[data-id]")) {
      return (
        pContainerNode.firstElementChild?.firstElementChild?.firstElementChild?.querySelector(
          "div[id] h2"
        )?.textContent ?? ""
      );
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
          "div.breadcrumbs-with-filters div.subgenres-breadcrumbs"
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

    return "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    return !!pContainer.title;
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const { node } = pContainer;

    let programNodes: HTMLElement[] = [];

    if (node.matches('section.cr-browse-section[data-t="browse-section"]')) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]')
      );
    } else if (node.matches("div.dynamic-feed-wrapper > div[data-id]")) {
      programNodes = Array.from(
        node.querySelectorAll(
          [
            'div[data-t="carousel-card-wrapper"]',
            'div[data-t^="episode-card"]',
            'div[data-t^="watch-list-card"]',
          ].join(",")
        )
      );
    } else if (node.matches("div.erc-browse-collection")) {
      programNodes = Array.from(node.querySelectorAll("div.browse-card"));
    } else if (node.matches("div.erc-alphabetical-virtual-list")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="series-card"]')
      );
    } else if (node.matches("div.erc-genres-collection")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]')
      );
    } else if (node.matches("div.erc-similar-to")) {
      programNodes = Array.from(
        node.querySelectorAll('div[data-t="carousel-card-wrapper"]')
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
