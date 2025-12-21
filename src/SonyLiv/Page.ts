import AbstractPage from "../common/AbstractPage";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";
import ProgramNode from "./ProgramNode";
import type { Program, ProgramContainer } from "../common/types";

class SonyLivPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`)!;
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        margin: 2px 0 0 8px;
        color: #999999;
        display: block;
        font-family: sans-serif;
        font-size: 14px;
        font-weight: bold;
        text-align: left;
        text-decoration: none;
      }

      div.trending-tray-layout a.${IMDB_DATA_NODE_CLASS} {
        text-align: right;
      }
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    if (["/custompage/sports"].some((x) => location.pathname.includes(x))) {
      return [];
    }

    const selectors = [
      // lists on home and top-level categories (tv shows, movies, ...) pages
      "div.layout-main-container",
      // list on second-tier category pages
      "div.listinpage_wrapper",
    ];
    return Array.from(document.querySelectorAll(selectors.join(",")));
  }

  override getTitleFromProgramContainerNode(node: HTMLElement): string {
    if (node.matches("div.layout-main-container")) {
      return node.querySelector("h3.layout-label")?.textContent ?? "";
    }

    if (node.matches("div.listinpage_wrapper")) {
      return node.querySelector("h1.listingHeadert")?.textContent ?? "";
    }

    return "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    const { title } = pContainer;
    return Boolean(
      title &&
      ![
        // home page
        "Best of Men's U19 Asia Cup 2025",
        "U-19 Asia Cup 2025 Fixtures",
        "Best of KBC",
        "Explore More",
        "Trending In Sports",
        /^Indian Idol/,
        "Top Moments In Reality",
      ].some((x) => (x instanceof RegExp ? x.test(title) : x === title))
    );
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const { node } = pContainer;

    const selector = node.matches("div.layout-main-container")
      ? "a.trending-tray-link,a.landscape-link,a.portrait-link,a.multipurpose-portrait-link"
      : node.matches("div.listinpage_wrapper")
        ? "a[title]"
        : null;
    if (!selector) return [];

    const ctor = this.constructor as typeof SonyLivPage;
    const programNodes = Array.from(
      node.querySelectorAll<HTMLElement>(selector)
    ).filter(ctor.ProgramNode.isMovieOrSeries);
    const programs = programNodes
      .map((node) => ({
        node,
        ...ctor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);
    return programs;
  }
}

export default SonyLivPage;
