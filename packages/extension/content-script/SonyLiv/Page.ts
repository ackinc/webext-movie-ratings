import AbstractPage from "../AbstractPage";
import { ErrorMessage } from "../../common";
import ProgramNode from "./ProgramNode";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";

class SonyLivPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (["/custompage/sports"].some((x) => location.pathname.includes(x))) {
      return [];
    }

    if (location.pathname.startsWith("/listing/")) {
      return ["div.layout-main-container:has(> div.listView)"];
    }

    return [
      // lists on home, movies, and shows pages
      "div.layout-main-container:has(> div.slick-slider)",

      // search preview
      "div.PopularSearchContainer",

      // mobile web
      "div.page-position > div.potraitTrayCards",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    node: HTMLElement,
  ): string {
    if (node.matches("div.layout-main-container:has(> div.listView)")) {
      return node.querySelector("span.title")!.textContent;
    }

    if (node.matches("div.layout-main-container:has(> div.slick-slider)")) {
      return (
        node.querySelector("span.title")?.textContent ??
        node.querySelector("h3.layout-label")?.textContent ??
        /* on home page, the 'best in your language' PC has the title
             outside the program-container */
        node.parentElement!.parentElement!.querySelector("span.title")!
          .textContent
      );
    }

    if (node.matches("div.PopularSearchContainer")) {
      return node.querySelector("h1")?.textContent ?? "Search results";
    }

    if (node.matches("div.page-position > div.potraitTrayCards")) {
      const titleWrapper = node.previousElementSibling;
      if (titleWrapper?.matches("div.ty-wrapper")) {
        return titleWrapper.querySelector("h3")!.textContent;
      }

      return "";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
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
        "Best In Cricket",
      ].some((x) => (x instanceof RegExp ? x.test(title) : x === title)),
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.layout-main-container:has(> div.listView)") {
      return ["a.portrait-link"];
    }

    if (selector === "div.layout-main-container:has(> div.slick-slider)") {
      return [
        "a.trending-tray-link",

        // 'watch free episodes' list on home page
        "a.landscape-link",

        // most common program card on home and other pages
        "a.portrait-link",

        "a.multipurpose-portrait-link",

        // appears on hovering over a program tile
        "div.card_container",
      ];
    }

    if (selector === "div.PopularSearchContainer") {
      return ["a[id]", "div.sonyliv-original-block-wrap"];
    }

    if (selector === "div.page-position > div.potraitTrayCards") {
      return ["a.link_container"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}

export default SonyLivPage;
