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
    return [
      'div[class*="FullBleed-module"]',
      'main:has(> div[class*="MaxLineWidthContainer-module"])',
      'div[data-testid="searchResults"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[class*="FullBleed-module"]')) {
      return pContainerNode.querySelector("h2")!.textContent;
    }

    if (
      pContainerNode.matches(
        'main:has(> div[class*="MaxLineWidthContainer-module"])',
      )
    ) {
      return pContainerNode.querySelector("h1")!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="searchResults"]')) {
      return "Search results";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (
      [
        "Browse Movies & TV Shows",
        "What's On Now",
        "More Fans to Follow",
        "Featured Videos",
      ].includes(pContainer.title)
    ) {
      return false;
    }

    return super.isValidProgramContainer(pContainer);
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
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

    if (selector === 'div[data-testid="searchResults"]') {
      return [
        'div[class*="SearchPopover-module"] div:has(> span[title]:nth-child(2))',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
