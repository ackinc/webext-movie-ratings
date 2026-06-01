import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";
import pageStyles from "./styles.page.css";

export default class HotstarPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
    await super.injectStyles();

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.textContent += pageStyles;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (["/categories", "/sports"].some((x) => location.href.includes(x))) {
      return [];
    }

    return [
      // seen everywhere on the site, but there are variants
      // - the most common variant has the title inside
      // - there are variants with the title outside (search results)
      "div.tray-container",

      // seen on home page when hovering over a program tile
      "div.hover-portal",
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

    if (node.matches("div.hover-portal")) {
      return "Preview modal";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer({
    title,
  }: ProgramContainer): boolean {
    return Boolean(
      title &&
      ![
        "Non-Stop Sports",
        "Popular Languages",
        "Popular Genres",
        "Popular Channels",
        "The Ultimate Learning Game Show",
        "Studios",
        "Latest TV Episodes",
        "Live News",
        /^MTV Splitsvilla/,
      ].some((x) => (x instanceof RegExp ? x.test(title) : x === title)),
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.tray-container") {
      return ['div[data-testid="tray-card-default"]'];
    }

    if (selector === "div.hover-portal") {
      return ['div[data-testid="tray-card-hover"]'];
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
