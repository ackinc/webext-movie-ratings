import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";

export default class Zee5Page extends AbstractPage {
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
  text-decoration: none;
}

div[data-testid$="active_carousel"] .${CssClasses.imdbDataNode} {
  color: white;
}
`;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // pre-login home page
      'div[aria-label="Featured banners"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[aria-label="Featured banners"]')) {
      return "Billboard";
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
    if (selector === 'div[aria-label="Featured banners"]') {
      return ['div[data-testid$="active_carousel"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
