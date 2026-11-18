import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { ErrorMessage } from "../../../common";
import type { ProgramContainer } from "../../../common/types";
import pageStyles from "./page.styles.css";

export default class Zee5Page extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      // home page
      'div[aria-label="Featured banners"]',
      'div[data-testid$="rail-container"]',
      'div[class^="rail-"]:not(:has(div[data-testid$="rail-container"])):not(:has(div[aria-label="Featured banners"]))',

      // movies collections page
      "div.viewAllMovie",

      // collections page
      'div[data-testid="collectionsContainer"]',

      // single program page
      'div[data-testid="reco-container"]',

      // search results page
      'div[data-test-id^="search-rail-"]',
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

    if (pContainerNode.matches("div.viewAllMovie")) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="collectionsContainer"]')) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="reco-container"]')) {
      return pContainerNode.querySelector(
        'h2[data-testid="recommended-contents-title"]',
      )!.textContent;
    }

    if (pContainerNode.matches('div[data-test-id^="search-rail-"]')) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (
      pContainerNode.matches('div[data-testid="recent-search"] div.keen-slider')
    ) {
      return pContainerNode.parentElement!.previousElementSibling!.querySelector(
        "h3",
      )!.textContent;
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (
      [
        "Z Live TV Channels",
        /^Live News/i,
        /^Live Entertainment/i,
        /^Live Channels/i,
        /^Lights, Camera, Entertainment!/i,
        "Explore on FREE5",
        /^Browse by/,
        /^FIFA/,
        "Related Videos",
        /Episodes/i,
        /\bTV Ep\b/i,
        /Free Previews/i,
        /Behind The Scenes/i,
      ].some((x) =>
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
    if (this.discreetRatingsMode) {
      return this.getOnHoverProgramNodeSelectors();
    }

    if (selector === 'div[aria-label="Featured banners"]') {
      return ['main[id="hero-banner"]'];
    }

    if (selector === 'div[data-testid$="rail-container"]') {
      return [
        ".card-and-title-wrapper",
        ".card-and-title-wrapper .hover-panel",
      ];
    }

    if (
      selector ===
      'div[class^="rail-"]:not(:has(div[data-testid$="rail-container"])):not(:has(div[aria-label="Featured banners"]))'
    ) {
      return ["div.keen-slider__slide article"];
    }

    if (selector === "div.viewAllMovie") {
      return ["div.movieCard"];
    }

    if (selector === 'div[data-testid="collectionsContainer"]') {
      return [
        ".card-and-title-wrapper",
        ".card-and-title-wrapper .hover-panel",
      ];
    }

    if (selector === 'div[data-testid="reco-container"]') {
      return ['div[data-testid^="recommended-thumbnail"'];
    }

    if (selector === 'div[data-test-id^="search-rail-"]') {
      return [
        ".card-and-title-wrapper",
        ".card-and-title-wrapper .hover-panel",
      ];
    }

    if (selector === 'div[data-testid="recent-search"] div.keen-slider') {
      return ["div.keen-slider__slide article"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override getOnHoverProgramNodeSelectors(): string[] {
    return [".card-and-title-wrapper .hover-panel"];
  }
}
