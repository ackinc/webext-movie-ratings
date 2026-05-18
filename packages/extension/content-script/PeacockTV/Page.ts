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

div.rootPortraitRail .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  right: unset;
  bottom: unset;
  left: 4px;
  border-radius: 16px;
  background-color: #2a2a2aca;
  color: white;
  padding: 4px 8px;
}

ul[data-testid="numbered-rail-slider"] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  right: unset;
  bottom: unset;
  left: 4px;
  border-radius: 16px;
  background-color: #2a2a2aca;
  color: white;
  padding: 4px 8px;
}

li[data-testid="collection-tile"] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  right: unset;
  bottom: unset;
  left: 4px;
  border-radius: 16px;
  background-color: #2a2a2aca;
  color: white;
  padding: 4px 8px;
}

section[data-testid="recommendations-section"] .${CssClasses.imdbDataNode} {
  position: absolute;
  top: 4px;
  right: unset;
  bottom: unset;
  left: 4px;
  border-radius: 16px;
  background-color: #2a2a2aca;
  color: white;
  padding: 4px 8px;
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

      // post-login home page
      "div.rootPortraitRail",
      'ul[data-testid="numbered-rail-slider"]',

      // post-login collection page
      "div#collection",

      // post-login single program page
      'section[data-testid="recommendations-section"]',

      // search page
      'ul[data-testid="popular-searches-grid"]',
      'ul[data-testid="search-results-grid"]',
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

    if (pContainerNode.matches("div.rootPortraitRail")) {
      // getting only the first child of the h2 since it also contains
      //   a 'view all' button
      return pContainerNode.querySelector('h2[data-testid="rail-title"]')!
        .firstChild!.textContent!;
    }

    if (pContainerNode.matches('ul[data-testid="numbered-rail-slider"]')) {
      return pContainerNode.parentElement!.parentElement!.querySelector(
        'h2[data-testid="rail-title"]',
      )!.textContent;
    }

    if (pContainerNode.matches("div#collection")) {
      return pContainerNode.querySelector('h1[data-testid="collection-title"]')!
        .textContent;
    }

    if (
      pContainerNode.matches('section[data-testid="recommendations-section"]')
    ) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (pContainerNode.matches('ul[data-testid="popular-searches-grid"]')) {
      return pContainerNode.parentElement!.querySelector(
        'h1[data-testid="popular-searches-title"]',
      )!.textContent;
    }

    if (pContainerNode.matches('ul[data-testid="search-results-grid"]')) {
      // search results area contains two tabs - results and clips
      // we only care about the former
      if (
        pContainerNode.parentElement!.previousElementSibling!.querySelector(
          'button[aria-label="Results"][data-testid$="active"]',
        )
      ) {
        return "Search results";
      } else {
        return "";
      }
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (
      ["Live & Upcoming", "Featured Channels", "Featured Brands"].includes(
        pContainer.title,
      )
    ) {
      return false;
    }

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

    if (selector === "div.rootPortraitRail") {
      return ['li[data-testid="rail-tile"]'];
    }

    if (selector === 'ul[data-testid="numbered-rail-slider"]') {
      return ['li[data-testid="rail-tile"]'];
    }

    if (selector === "div#collection") {
      return ['li[data-testid="collection-tile"]'];
    }

    if (selector === 'section[data-testid="recommendations-section"]') {
      return ['ul[data-grid="recommendations"] > li'];
    }

    if (selector === 'ul[data-testid="popular-searches-grid"]') {
      return ['li[data-testid="collection-tile"]'];
    }

    if (selector === 'ul[data-testid="search-results-grid"]') {
      return ['li[data-testid="collection-tile"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
