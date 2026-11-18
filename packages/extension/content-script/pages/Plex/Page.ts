import AbstractPage from "../AbstractPage";
import { ErrorMessage } from "@common";
import type { ProgramContainer } from "@common/types";
import ProgramNode from "./ProgramNode";
import pageStyles from "./page.styles.css";

export default class PlexPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    if (location.pathname.includes("/live-tv/")) {
      return [];
    }

    return [
      'main:has(> div[class*="FullBleed-module"])',
      'div[class*="FullBleed-module"]',
      'main:has(> div[class*="MaxLineWidthContainer-module"])',
      'div[data-testid="searchZeroState"]',
      'ul[aria-label^="Search Results for"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('main:has(> div[class*="FullBleed-module"])')) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (pContainerNode.matches('div[class*="FullBleed-module"]')) {
      return pContainerNode.querySelector("h2")!.innerText.split("\n").at(-1)!;
    }

    if (
      pContainerNode.matches(
        'main:has(> div[class*="MaxLineWidthContainer-module"])',
      )
    ) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (
      ['div[data-testid="searchZeroState"]'].some((x) =>
        pContainerNode.matches(x),
      )
    ) {
      return "Pre-search popular suggestions";
    }

    if (pContainerNode.matches('ul[aria-label^="Search Results for"]')) {
      return "Search results";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (
      [
        "Browse Films & TV Shows",
        "Browse Movies & TV Shows",
        "What's On Now",
        "Popular Discussions",
        "Popular Lists",
        "More Fans to Follow",
        "Featured Videos",
        "Frequently Asked Questions",
      ].includes(pContainer.title)
    ) {
      return false;
    }

    return super.isValidProgramContainer(pContainer);
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (this.discreetRatingsMode) {
      // do nothing; this site does not have on-hover program nodes, so if
      //   we restrict ourselved to on-hover program selectors here, no
      //   ratings will show up at all
    }

    if (selector === 'main:has(> div[class*="FullBleed-module"])') {
      return ['figure:has(a[data-id^="tv.plex.provider.vod"][aria-label])'];
    }

    if (selector === 'div[class*="FullBleed-module"]') {
      return [
        'figure:has(a[data-id^="tv.plex.provider.epg"][aria-label])',
        'figure:has(a[data-id^="tv.plex.provider.vod"][aria-label])',
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
        'li:has(div[class*="LumaPopularReviewActivityCard"])',
      ];
    }

    if (selector === 'main:has(> div[class*="MaxLineWidthContainer-module"])') {
      return [
        'figure:has(a[data-id^="tv.plex.provider.epg"][aria-label])',
        'figure:has(a[data-id^="tv.plex.provider.vod"][aria-label])',
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
      ];
    }

    if (selector === 'div[data-testid="searchZeroState"]') {
      return [
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
      ];
    }

    if (selector === 'ul[aria-label^="Search Results for"]') {
      return ['li[data-testid="searchResult"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
