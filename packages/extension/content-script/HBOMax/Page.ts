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
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (location.pathname.startsWith("/sitemap")) return [];

    if (location.pathname === "/channel") {
      return ["section.content-tray-section-parent"];
    }

    return [
      // home page (pre-sign up)
      "div.image-grid:not(.sports-league-tiles)",
      "div.carousel-item[data-category]",

      // movies page
      "section.collection-content",

      // single-program page
      "div.max-section-ymal-parent",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("section.content-tray-section-parent")) {
      return pContainerNode
        .querySelector("div.rich-text div.pt a[href]")!
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

    if (pContainerNode.matches("div.max-section-ymal-parent")) {
      return "You may also like:";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (location.pathname.startsWith("/sports")) {
      if (["Upcoming Games"].includes(pContainer.title)) return false;
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
