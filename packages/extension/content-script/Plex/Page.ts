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
    // TODO: Add selectors for Plex carousels, grids, and hero sections.
    return ['div[class*="FullBleed-module"]'];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches('div[class*="FullBleed-module"]')) {
      return pContainerNode.querySelector("h2")!.textContent;
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
        'li:has(a[data-id^="tv.plex.provider.epg"][aria-label])',
        'li:has(a[data-id^="tv.plex.provider.vod"][aria-label])',
        'li:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
        'li:has(div[class*="LumaPopularReviewActivityCard"])',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
