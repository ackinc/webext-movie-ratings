import AbstractProgramNode from "../AbstractProgramNode";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: ProgramData["type"] | undefined = undefined;
    let year: ProgramData["year"] | undefined = undefined;

    if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.epg"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      title = titleNode.textContent;

      const typeNode = programNode.querySelector(
        'a[data-id^="tv.plex.provider.epg"][aria-label]',
      )!;
      if (typeNode.getAttribute("aria-label")!.match(/episode/i)) {
        type = "series";
      }
    } else if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.vod"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      title = titleNode.textContent;

      const typeNode = programNode.querySelector(
        "figcaption > span:nth-child(2)",
      );
      if (typeNode?.textContent.match(/season/i)) type = "series";
      else if (typeNode?.textContent.match(/^\d+$/)) type = "movie";
    } else if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      title = titleNode.textContent;

      const yearNode = programNode.querySelector(
        "figcaption > span:nth-child(2)",
      );
      if (yearNode?.textContent.match(/\d+/)) year = +yearNode.textContent;
    } else if (
      programNode.matches('li:has(div[class*="LumaPopularReviewActivityCard"])')
    ) {
      const titleNode = programNode
        .querySelector('a[aria-label^="Review of"]')!
        .previousElementSibling!.querySelector(
          ":scope > div:nth-child(2) > span[title]",
        )!;
      title = titleNode.textContent;
    }

    return {
      title,
      ...(type ? { type } : {}),
      ...(year ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.epg"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.vod"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
      )
    ) {
      const titleNode = programNode.querySelector(
        "figcaption > span:first-child",
      )!;
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (
      programNode.matches('li:has(div[class*="LumaPopularReviewActivityCard"])')
    ) {
      const titleNode = programNode
        .querySelector('a[aria-label^="Review of"]')!
        .previousElementSibling!.querySelector(
          ":scope > div:nth-child(2) > span[title]",
        );
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
