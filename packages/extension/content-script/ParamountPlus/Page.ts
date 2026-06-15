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
    if (
      ["/live-tv", "/news", "/collections/sports-hub"].some((x) =>
        location.pathname.startsWith(x),
      )
    )
      return [];

    return [
      // home page
      "div.carousel:has(h2.video-section-title)",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.carousel:has(h2.video-section-title)")) {
      return pContainerNode
        .querySelector("h2.video-section-title")!
        .textContent.trim();
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
    if (selector === "div.carousel:has(h2.video-section-title)") {
      return ["a.link[aria-label]"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
