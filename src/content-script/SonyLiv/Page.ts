import AbstractPage from "../AbstractPage";
import { CssClasses } from "../../common";
import ProgramNode from "./ProgramNode";
import type { Program, ProgramContainer } from "../../common/types";

class SonyLivPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
    await super.injectStyles();

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
a.${CssClasses.imdbDataNode} {
  margin: 2px 0 0 8px;
  color: #999999;
  display: block;
  font-family: sans-serif;
  font-size: 14px;
  font-weight: bold;
  text-align: left;
  text-decoration: none;
}

div.listinpage_wrapper .innerlist a[id] div.listing-portrait-card-inner-div {
  position: relative;
}

div.listinpage_wrapper .innerlist a[id] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 8px;
  left: 8px;
  margin: 0;
  padding: 4px 8px;
  background-color: #454545;
  border-radius: 4px;
  color: #eaeaea;
}

/* these show up when hovering over the "movies" link on the home and
     other pages */
div.megaMenu div.layout-container a.portrait-link .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 8px;
  left: 8px;
  margin: 0;
  padding: 4px 8px;
  background-color: #454545;
  border-radius: 4px;
  color: #eaeaea;
}

div.PopularSearchContainer > a[id] {
  position: relative;
}

div.PopularSearchContainer > a[id] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 8px;
  left: 8px;
  margin: 0;
  padding: 4px 8px;
  background-color: #454545;
  border-radius: 4px;
  color: #eaeaea;
}

div.PopularSearchContainer div.sonyliv-original-block-wrap .${CssClasses.imdbDataNode} {
  margin: 0;
}

@media screen and (max-width: 420px) {
  a.${CssClasses.imdbDataNode} {
    position: absolute;
    top: 2px;
    right: 10px;
    margin: 0;
    width: 48px;
    height: 20px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-size: 9px;
  }
}
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    if (["/custompage/sports"].some((x) => location.pathname.includes(x))) {
      return [];
    }

    const selectors = [
      // lists on home and top-level categories (tv shows, movies, ...) pages
      // also shows on hovering over "movies" link on home and other pages
      "div.layout-main-container",
      // list on second-tier category pages
      "div.listinpage_wrapper",

      // search preview
      "div.PopularSearchContainer",

      // search results
      "div.searchWrapperContainer",

      // mobile web
      "div.page-position > div.potraitTrayCards",
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

    if (node.matches("div.page-position > div.potraitTrayCards")) {
      const titleWrapper = node.previousElementSibling;
      if (titleWrapper?.matches("div.ty-wrapper")) {
        return titleWrapper.querySelector("h3")?.textContent?.trim() ?? "";
      }
    }

    if (node.matches("div.PopularSearchContainer")) {
      return node.querySelector("h1")?.textContent ?? "Search results";
    }

    if (node.matches("div.searchWrapperContainer")) {
      return (
        node.querySelector("div.SearchContainerGrid div.TopHeading h5")
          ?.textContent ?? ""
      );
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
      ].some((x) => (x instanceof RegExp ? x.test(title) : x === title)),
    );
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer,
  ): Program[] {
    const { node } = pContainer;

    const selector = node.matches("div.layout-main-container")
      ? "a.trending-tray-link,a.landscape-link,a.portrait-link,a.multipurpose-portrait-link"
      : node.matches("div.listinpage_wrapper")
        ? "a[title]"
        : node.matches("div.page-position > div.potraitTrayCards")
          ? "a.link_container"
          : node.matches("div.PopularSearchContainer")
            ? "a[id],div.sonyliv-original-block-wrap"
            : node.matches("div.searchWrapperContainer")
              ? "a[id]"
              : null;
    if (!selector) return [];

    const ctor = this.constructor as typeof SonyLivPage;
    const programNodes = Array.from(
      node.querySelectorAll<HTMLElement>(selector),
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
