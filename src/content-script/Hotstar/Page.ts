import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

export default class HotstarPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
    await super.injectStyles();

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");
    styleNode.innerHTML += `
div.swiper-slide > div:first-child {
  padding-bottom: 21px;
}

div.search-results {
  padding-bottom: 16px;
}

a.${CssClasses.imdbDataNode} {
  /* absolute positioning is needed to make this node 'extrude' outside the ancestor
       node that has the 'expand-onMouseEnter' event listener */
  position: absolute;
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
  font-weight: bold;
}

div[data-scale-down="true"] a.${CssClasses.imdbDataNode} {
  position: inherit;
  margin: 0 0 0 2px;
  color: var(--ON-SURFACE-ALT);
  font-size: 16px;
  font-weight: 500;
}

div[data-testid="tray-card-default"]:has(div[data-testid="action"]:not([aria-label])) .${CssClasses.imdbDataNode} {
  position: relative;
}
    `;
  }

  override getProgramContainerNodeSelectors(): string[] {
    return [
      // seen everywhere on the site, but there are variants
      //   - the most common variant has the title inside
      //   - there is a variant with the title outside (search results)
      // we don't consider the variants with title outside to be legit;
      //   other selectors will be used to identify a suitable parent
      //   as the program container for these cases
      "div.tray-container",

      // search pane, when something entered into search bar
      "div.search-results",

      // category page
      "div#page-container",

      // "more like this" section of program page, when visited from category page
      'div[data-testid="section-scroller"]',
    ];
  }

  override getTitleFromProgramContainerNode(node: HTMLElement): string {
    if (node.matches("div.tray-container")) {
      if (
        (node.firstElementChild as HTMLElement)!.dataset["testid"] ===
        "grid-container"
      ) {
        // search page (when nothing entered into search bar)
        return node.querySelector("p.TITLE1")?.textContent ?? "";
      }

      // everywhere else
      return (
        (node.firstChild as HTMLElement)?.querySelector("h2")?.textContent ?? ""
      );
    }

    // search page (when something entered into search bar)
    if (node.matches("div.search-results")) {
      return node.querySelector("p.TITLE1")?.textContent ?? "Search results";
    }

    // category page
    if (node.matches("div#page-container")) {
      return node.querySelector("div.headerSpace h4")?.textContent ?? "";
    }

    if (node.matches('div[data-testid="section-scroller"]')) {
      return node.querySelector("button h2")?.textContent ?? "";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override isValidProgramContainer({ title }: ProgramContainer): boolean {
    return Boolean(
      title &&
      !["Popular Languages", "Popular Genres", "Popular Channels"].includes(
        title,
      ),
    );
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;
    if (
      [
        "div.tray-container",
        "div.search-results",
        "div#page-container",
        'div[data-testid="section-scroller"]',
      ].some((s) => node.matches(s))
    ) {
      return ['div[data-testid="tray-card-default"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override isValidProgram({ title, type }: Program): boolean {
    return Boolean(title && type);
  }
}
