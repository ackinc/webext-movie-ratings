import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class MXPlayerPage extends AbstractPage {
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
  line-height: normal;
  text-decoration: none;
}

div.banner-card .${CssClasses.imdbDataNode} {
  position: relative;
  top: -24px;
}

div.see-more div.portrait-container .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 12px;
  left: 8px;
  background-color: #2a2a2aca;
  border-radius: 4px;
  color: white;
  padding: 4px 8px;
}
`;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      "div.banner-slider",
      "div.card-section",

      "div.see-more",
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

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
