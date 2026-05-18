import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer, Program } from "../../common/types";

export default class DisneyPlusPage extends AbstractPage {
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
  text-align: left;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      'div[data-testid="slider-container"]:has(ul)',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[data-testid="slider-container"]:has(ul)')) {
      const titleNode =
        pContainerNode.parentElement?.previousElementSibling?.querySelector(
          '[class^="headline"]',
        );
      if (titleNode) return titleNode.textContent;

      if (
        (pContainerNode.parentElement!.previousElementSibling! as HTMLElement)
          .dataset["testid"] === "spacer"
      ) {
        return "Bundle showcase";
      }

      return "";
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
    if (selector === 'div[data-testid="slider-container"]:has(ul)') {
      return [
        'li[data-testid^="collection-tile"]:has(> figure:first-child)',
        'li[data-testid^="collection-tile"]:has(> div.block:first-child)',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    return super.checkIMDBDataAlreadyAdded(program);
  }
}
