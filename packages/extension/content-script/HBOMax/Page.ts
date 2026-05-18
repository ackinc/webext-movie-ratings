import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

export default class HBOMaxPage extends AbstractPage {
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
    styleNode.textContent += `
a.${CssClasses.imdbDataNode} {
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
  font-weight: bold;
}

div.image-grid-item a.${CssClasses.imdbDataNode} {
  cursor: pointer;
  pointer-events: unset;
}

li.react-multi-carousel-item a:has(div.item-container) h6 {
  margin-top: 0;
  margin-bottom: 0
}

li.react-multi-carousel-item a:has(div.item-container) a.${CssClasses.imdbDataNode} {
  margin-left: 2px;
}

a.ymal-content-item h6 {
  margin-top: 0;
  margin-bottom: 0
}

a.ymal-content-item a.${CssClasses.imdbDataNode} {
  margin-left: 2px;
}

a[data-sonic-type="show"] a.${CssClasses.imdbDataNode} {
  margin-top: 4px;
  text-decoration: none;
}

a[data-sonic-type="video"] a.${CssClasses.imdbDataNode} {
  margin-top: 4px;
  text-decoration: none;
}

a[data-sonic-type="show"]:has(div[class^="StyledRankImageContainer"]) .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  left: 4px;
  margin-top: 0;
  background-color: #2a2a2aca;
  color: white;
  padding: 4px 8px;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (location.pathname.startsWith("/sitemap")) return [];

    if (["/channel", "/collections"].includes(location.pathname)) {
      return ["section.content-tray-section-parent"];
    }

    return [
      // home page (pre-sign up)
      "div.image-grid:not(.sports-league-tiles)",
      "div.carousel-item[data-category]",

      // movies page
      "section.collection-content",

      // single movie page
      "div.max-section-ymal-parent",

      // single series page
      "div.max-section-ymal",

      // search results page
      'section[data-sonic-id="search-page-rail-results"]',

      // (post login) home page, movies page
      'section[data-sonic-id*="page-rail"]',

      // (post login) single series page
      'div[data-testid="tileList"]',

      // (post login) movies page, series page, hbo page, ...
      'section[data-sonic-id*="page-featured-tab-rail"]',
      'section[data-sonic-id*="featured-rail"]',
      'section[data-sonic-id*="page-featured-tab"]',
      'section[data-testid*="-page-"][data-testid$="_rail"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("section.content-tray-section-parent")) {
      return pContainerNode
        .querySelector("a[href]")!
        .getAttribute("href")!
        .split("/")
        .at(-1)!;
    }

    if (pContainerNode.matches("div.image-grid:not(.sports-league-tiles)")) {
      return pContainerNode.previousElementSibling?.textContent ?? "<UNKNOWN>";
    }

    if (pContainerNode.matches("div.carousel-item[data-category]")) {
      return `carousel-${pContainerNode.dataset["category"]}`;
    }

    if (pContainerNode.matches("section.collection-content")) {
      return (
        pContainerNode.querySelector("h2")?.textContent ??
        // containers lower on the movies page
        pContainerNode.parentElement!.previousElementSibling!.querySelector(
          "h2",
        )!.textContent
      );
    }

    // single-movie page
    if (pContainerNode.matches("div.max-section-ymal-parent")) {
      return "You may also like:";
    }

    // single series page
    if (pContainerNode.matches("div.max-section-ymal")) {
      return "You may also like:";
    }

    if (
      pContainerNode.matches(
        'section[data-sonic-id="search-page-rail-results"]',
      )
    ) {
      return "Search results";
    }

    if (pContainerNode.matches('section[data-sonic-id*="page-rail"]')) {
      return pContainerNode.querySelector("h2")!.getAttribute("aria-label")!;
    }

    if (pContainerNode.matches('div[data-testid="tileList"]')) {
      return (
        pContainerNode.parentElement!.querySelector(
          'h2 span[data-testid$="gridTitle"]',
        )?.textContent ?? ""
      );
    }

    if (
      [
        'section[data-sonic-id*="page-featured-tab-rail"]',
        'section[data-sonic-id*="featured-rail"]',
        'section[data-sonic-id*="page-featured-tab"]',
        'section[data-testid*="-page-"][data-testid$="_rail"]',
      ].some((sel) => pContainerNode.matches(sel))
    ) {
      if (pContainerNode.firstElementChild?.matches("picture")) {
        // "turner classic movies"
        return pContainerNode
          .querySelector('div#tileList div[role="heading"][aria-label]')!
          .getAttribute("aria-label")!;
      } else {
        return pContainerNode.querySelector("h2")!.getAttribute("aria-label")!;
      }
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (location.pathname.startsWith("/sports")) {
      if (
        [
          "Browse by Genre",
          "Channels",
          "Discover Our Collections",
          "Upcoming Games",
        ].includes(pContainer.title)
      )
        return false;
    }

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "section.content-tray-section-parent") {
      // NOTE WHY_EXTRA_QUALIFIER
      // qualifying the a-clause in the selector below ensures
      //   the imdb-nodes that sift inserts are excluded from
      //   being identified as program nodes
      return ["li.react-multi-carousel-item a:has(div.item-container)"];
    }

    if (selector === "div.image-grid:not(.sports-league-tiles)") {
      return ["div.image-grid-item", "div.img-wrapper-override"];
    }

    if (selector === "div.carousel-item[data-category]") {
      return ['div.row > div[class^="col"]:has(> img:first-child)'];
    }

    if (selector === "section.collection-content") {
      return [
        // See NOTE WHY_EXTRA_QUALIFIER above
        "li.react-multi-carousel-item a:has(div.item-container)",
      ];
    }

    if (selector === "div.max-section-ymal-parent") {
      return ["a.ymal-content-item"];
    }

    if (selector === "div.max-section-ymal") {
      return ["a.ymal-content-item"];
    }

    if (selector === 'section[data-sonic-id="search-page-rail-results"]') {
      return ['a[data-sonic-type="show"]'];
    }

    if (selector === 'section[data-sonic-id*="page-rail"]') {
      return ['a[data-sonic-type="show"]', 'a[data-sonic-type="video"]'];
    }

    if (selector === 'div[data-testid="tileList"]') {
      return ['a[data-sonic-type="show"]'];
    }

    if (
      [
        'section[data-sonic-id*="page-featured-tab-rail"]',
        'section[data-sonic-id*="featured-rail"]',
        'section[data-sonic-id*="page-featured-tab"]',
        'section[data-testid*="-page-"][data-testid$="_rail"]',
      ].includes(selector)
    ) {
      return ['a[data-sonic-type="show"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    if (
      program.node.matches(
        "li.react-multi-carousel-item a:has(div.item-container)",
      )
    ) {
      // the webpage keeps pushing the program title html
      //   element (a h6) to the last-child position in the
      //   program node, when we want the sift-imdb node to
      //   occupy that position
      // if we detect that the sift-imdb node is not the last
      //   child, we want to remove and re-add it
      if (
        program.node.lastElementChild !==
        HBOMaxPage.ProgramNode.getIMDBNode(program.node)
      ) {
        return false;
      }
    }

    return super.checkIMDBDataAlreadyAdded(program);
  }
}
