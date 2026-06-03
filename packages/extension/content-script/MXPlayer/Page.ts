import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";

export default class MXPlayerPage extends AbstractPage {
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
    return [
      // home page
      "div.banner-slider",
      "div.card-section",

      // list page
      "div.see-more",
      "div.browse-header-section",

      // single program page
      "div.detail-recommendations",

      // search results
      "div.sc_results",

      // hover card
      "div#modal:has(div.open div.hover-card-container)",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.banner-slider")) {
      return "Billboard";
    }

    if (pContainerNode.matches("div.card-section")) {
      return pContainerNode.querySelector('h2[class$="header-title"]')!
        .textContent;
    }

    if (pContainerNode.matches("div.see-more")) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (pContainerNode.matches("div.browse-header-section")) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (pContainerNode.matches("div.detail-recommendations")) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (pContainerNode.matches("div.sc_results")) {
      return pContainerNode.querySelector("div.sc_results-title")!.textContent;
    }

    if (
      pContainerNode.matches("div#modal:has(div.open div.hover-card-container)")
    ) {
      return "Hover card";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.banner-slider") {
      return ["div.banner-card"];
    }

    if (selector === "div.card-section") {
      return ["div.portrait-container"];
    }

    if (selector === "div.see-more") {
      return ["div.portrait-container"];
    }

    if (selector === "div.browse-header-section") {
      return ["div.portrait-container"];
    }

    if (selector === "div.detail-recommendations") {
      return ["div.landscape-container"];
    }

    if (selector === "div.sc_results") {
      return ["div.landscape-container"];
    }

    if (selector === "div#modal:has(div.open div.hover-card-container)") {
      return ["div.hover-card-container"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
