import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

export default class HotstarPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
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

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // seen everywhere on the site, but there are variants
      // - the most common variant has the title inside
      // - there are variants with the title outside (search results)
      "div.tray-container",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    node: HTMLElement,
  ): string {
    if (node.matches("div.tray-container")) {
      // search results page
      if (
        node.parentElement?.classList.contains("search-results") ||
        /* hotstar is weird */
        node.parentElement?.parentElement?.classList.contains("search-results")
      ) {
        // When search bar is empty, hotstar displays a placeholder program
        //   list, which does contain a title
        // Actually entering a search query causes the placeholder programs
        //   to be replaced by actual search results
        return node.querySelector("p.TITLE1")?.textContent ?? "Search results";
      }

      // category page
      if (
        node.parentElement?.previousElementSibling?.classList.contains(
          "headerSpace",
        )
      ) {
        return node.parentElement.previousElementSibling.querySelector("h4")!
          .textContent;
      }

      // program page
      if (
        node.parentElement?.parentElement?.parentElement?.parentElement
          ?.dataset["testid"] === "scroll-section-More Like This"
      ) {
        return "More Like This";
      }

      // everywhere else
      return (node.firstChild as HTMLElement)!.querySelector("h2")!.textContent;
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer({
    title,
  }: ProgramContainer): boolean {
    return Boolean(
      title &&
      !["Popular Languages", "Popular Genres", "Popular Channels"].includes(
        title,
      ),
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.tray-container") {
      return ['div[data-testid="tray-card-default"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgram({ title, type }: Program): boolean {
    return Boolean(title && type);
  }

  protected override getGeneralizedUrlPath(href: string): string {
    let retval = super.getGeneralizedUrlPath(href);

    if (retval.startsWith("/in/browse/")) {
      retval = retval.split("/").slice(0, 4).join("/") + "/:n";
    } else if (
      ["/in/shows/", "/in/movies/"].some((x) => retval.startsWith(x))
    ) {
      retval = retval.split("/").slice(0, 3).join("/") + "/:n";
    }

    return retval;
  }
}
