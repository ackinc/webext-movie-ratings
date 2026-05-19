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
  font-weight: bold;
  text-decoration: none;
}

div[data-testid$="active_carousel"] .${CssClasses.imdbDataNode} {
  color: white;
}

div.keen-slider__slide article .${CssClasses.imdbDataNode} {
  margin: 4px 0 0 4px;
}

div.keen-slider__slide article:has(footer) .${CssClasses.imdbDataNode} {
  margin: 4px 0 0 0px;
}
`;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      'div[aria-label="Featured banners"]',
      'div[data-testid$="rail-container"]',
      'div[class^="rail-"]:not(:has(div[data-testid$="rail-container"])):not(:has(div[aria-label="Featured banners"]))',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[aria-label="Featured banners"]')) {
      return "Billboard";
    }

    if (pContainerNode.matches('div[data-testid$="rail-container"]')) {
      return pContainerNode.querySelector("h3")!.textContent;
    }

    if (
      pContainerNode.matches(
        'div[class^="rail-"]:not(:has(div[data-testid$="rail-container"])):not(:has(div[aria-label="Featured banners"]))',
      )
    ) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (
      ["Z Live TV Channels", /^Live News/i, "Explore on FREE5"].some((x) =>
        x instanceof RegExp ? x.test(pContainer.title) : x === pContainer.title,
      )
    ) {
      return false;
    }

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === 'div[aria-label="Featured banners"]') {
      return ['div[data-testid$="active_carousel"]'];
    }

    if (selector === 'div[data-testid$="rail-container"]') {
      return ["div.keen-slider__slide article"];
    }

    if (
      selector ===
      'div[class^="rail-"]:not(:has(div[data-testid$="rail-container"])):not(:has(div[aria-label="Featured banners"]))'
    ) {
      return ["div.keen-slider__slide article"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
