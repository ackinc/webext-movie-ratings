import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessages } from "../../common";
import ProgramNode from "./ProgramNode";
import type { ProgramContainer } from "../../common/types";

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

  override getProgramContainerNodeSelectors(urlPath: string): string[] {
    if (["/custompage/sports"].some((x) => urlPath.includes(x))) {
      return [];
    }

    return [
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

  override isValidProgramNode(pNode: HTMLElement): boolean {
    const ctor = this.constructor as typeof SonyLivPage;
    return ctor.ProgramNode.isMovieOrSeries(pNode);
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;

    if (node.matches("div.layout-main-container")) {
      return [
        "a.trending-tray-link",
        "a.landscape-link",
        "a.portrait-link",
        "a.multipurpose-portrait-link",
      ];
    }

    if (node.matches("div.listinpage_wrapper")) {
      return ["a[title]"];
    }

    if (node.matches("div.PopularSearchContainer")) {
      return ["a[id]", "div.sonyliv-original-block-wrap"];
    }

    if (node.matches("div.searchWrapperContainer")) {
      return ["a[id]"];
    }

    if (node.matches("div.page-position > div.potraitTrayCards")) {
      return ["a.link_container"];
    }

    throw new Error(ErrorMessages.unrecognizedProgramContainer);
  }
}

export default SonyLivPage;
