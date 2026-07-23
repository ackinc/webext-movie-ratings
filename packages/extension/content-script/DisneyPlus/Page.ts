import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";

export default class DisneyPlusPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      'div[data-testid="slider-container"]:has(ul)',

      // brand/collection pages
      'div[data-testid^="collection"]',

      // single program page
      'div[data-testid="you-may-also-like"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[data-testid^="collection"]')) {
      return pContainerNode.parentElement!.previousElementSibling!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="slider-container"]:has(ul)')) {
      const titleNode =
        pContainerNode.parentElement?.previousElementSibling?.querySelector(
          '[class^="headline"]',
        );
      if (titleNode) return titleNode.textContent;

      // on home page, on scrolling down: bundle showcase
      if (
        (pContainerNode.parentElement!.previousElementSibling! as HTMLElement)
          .dataset["testid"] === "spacer"
      ) {
        return "Bundle showcase";
      }

      return "";
    }

    if (pContainerNode.matches('div[data-testid="you-may-also-like"]')) {
      return "You may also like";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (["Collections"].includes(pContainer.title)) return false;

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === 'div[data-testid^="collection"]') {
      return [
        'li[data-testid^="collection-tile"]:has(> figure:first-child)',
        'li[data-testid^="collection-tile"]:has(> div.block:first-child)',
      ];
    }

    if (selector === 'div[data-testid="slider-container"]:has(ul)') {
      return [
        'li[data-testid^="collection-tile"]:has(> figure:first-child)',
        'li[data-testid^="collection-tile"]:has(> div.block:first-child)',
      ];
    }

    if (selector === 'div[data-testid="you-may-also-like"]') {
      return [
        'li[data-testid^="collection-tile"]:has(> div.block:first-child)',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
