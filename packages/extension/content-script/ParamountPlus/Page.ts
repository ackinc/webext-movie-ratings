import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class ParamountPlusPage extends AbstractPage {
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
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
  font-weight: bold;
  text-align: left;
  margin-left: 4px;
}

div.carousel a.link[id^="originals"] a.${CssClasses.imdbDataNode} {
  margin-left: 4px;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      "div.carousel",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.carousel")) {
      return pContainerNode.querySelector("h2.video-section-title")!
        .textContent;
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
    if (selector === "div.carousel") {
      return ['a.link[id^="originals"]', 'a.link[id^="custom"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
