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
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
  text-decoration: none;
}

div[data-testid="highlights-carousel"] .${CssClasses.imdbDataNode} {
  margin: 4px 0 0 4px;
}

div[data-testid="recommendations"] .${CssClasses.imdbDataNode} {
  text-decoration: none;
}

section[data-testid="IA-video-template-multi-rails"] .${CssClasses.imdbDataNode} {
  padding: 0 16px;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (
      location.pathname.startsWith("/sports") ||
      location.pathname.includes("/sports/")
    ) {
      return [];
    }

    return [
      // home page
      'div[data-testid="highlights-carousel"]',
      'div[data-testid="carousel-container"]',

      // genre page (ex: "Crime TV Shows")
      'div[data-testid="grid"]',

      // single program page
      'div[data-testid="recommendations"]',
      'section[data-testid="IA-video-template-multi-rails"]',

      // collection page (ex: "best tv shows to binge watch")
      'section[data-testid="IA-carousel"]',

      // "new on peacock"
      'section[data-testid="ia-content-grid"]',
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

    if (pContainerNode.matches('div[data-testid="grid"]')) {
      return pContainerNode.parentElement!.querySelector(
        ":scope > h2:first-child",
      )!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="recommendations"]')) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (
      pContainerNode.matches(
        'section[data-testid="IA-video-template-multi-rails"]',
      )
    ) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (pContainerNode.matches('section[data-testid="IA-carousel"]')) {
      return pContainerNode.querySelector('h2[data-testid="title"]')!
        .textContent;
    }

    if (pContainerNode.matches('section[data-testid="ia-content-grid"]')) {
      return pContainerNode.querySelector('h1[data-preview-selector="title"]')!
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
    if (selector === 'div[data-testid="highlights-carousel"]') {
      return ['a[data-testid="tile-link"]'];
    }

    if (selector === 'div[data-testid="carousel-container"]') {
      return ['a[data-testid="tile-link-wrapper"]'];
    }

    if (selector === 'div[data-testid="grid"]') {
      return ['a[data-testid="grid-tile"]'];
    }

    if (selector === 'div[data-testid="recommendations"]') {
      return ['div[data-testid^="IA-slide-recommendations-carousel"]'];
    }

    if (selector === 'section[data-testid="IA-video-template-multi-rails"]') {
      return ['div.slick-slide div[role="group"]'];
    }

    if (selector === 'section[data-testid="IA-carousel"]') {
      return ['div.slick-slide div[role="listitem"]'];
    }

    if (selector === 'section[data-testid="ia-content-grid"]') {
      return ['div[data-testid^="grid-item"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
