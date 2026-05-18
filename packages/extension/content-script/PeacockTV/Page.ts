import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class PeacockTVPage extends AbstractPage {
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

a[data-testid="tile-link-wrapper"] a.${CssClasses.imdbDataNode} {
  margin: 0;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      'div[data-testid="highlights-carousel"]',
      'div[data-testid="carousel-container"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[data-testid="highlights-carousel"]')) {
      return "Highlights";
    }

    if (pContainerNode.matches('div[data-testid="carousel-container"]')) {
      return pContainerNode.querySelector("h3")!.textContent;
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
    if (selector === 'div[data-testid="highlights-carousel"]') {
      return ['a[data-testid="tile-link"]'];
    }

    if (selector === 'div[data-testid="carousel-container"]') {
      return ['a[data-testid="tile-link-wrapper"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
