import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

export default class HuluPage extends AbstractPage {
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
  margin: 4px 0;
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    // live tv, live news, live sports
    if (location.pathname.startsWith("/live")) return [];

    return [
      // home page
      "div.SimpleCollection",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.SimpleCollection")) {
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
    if (selector === "div.SimpleCollection") {
      return ['div.Slider__item div.Tile[data-automationid^="tile"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    return super.checkIMDBDataAlreadyAdded(program);
  }
}
