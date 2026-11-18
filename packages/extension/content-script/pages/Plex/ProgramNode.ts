import AbstractProgramNode from "../AbstractProgramNode";
import type { ProgramContainer, ProgramData } from "../../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(
    programNode: HTMLElement,
    pContainer: ProgramContainer,
  ): ProgramData {
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
      const labelNode = programNode.querySelector(
        'a[data-id^="tv.plex.provider.vod"][aria-label]',
      )!;
      const label = labelNode.getAttribute("aria-label")!;
      title = label.split("(")[0]!.trim()!;
      year = Number(label.match(/\((\d{4})\)$/)?.[1]) || undefined;

      const typeNode = programNode.querySelector(
        "figcaption:nth-child(2) > span",
      );
      if (typeNode?.textContent.match(/season/i)) type = "series";
      else if (typeNode?.textContent.match(/^\d+$/)) type = "movie";
    } else if (
      programNode.matches(
        'figure:has(a[data-id^="tv.plex.provider.discover"][aria-label])',
      )
    ) {
      const labelNode = programNode.querySelector(
        'a[data-id^="tv.plex.provider.discover"][aria-label]',
      )!;
      const label = labelNode.getAttribute("aria-label")!;
      title = label.split("(")[0]!.trim()!;
      year = Number(label.match(/\((\d{4})\)$/)?.[1]) || undefined;
    } else if (
      programNode.matches('li:has(div[class*="LumaPopularReviewActivityCard"])')
    ) {
      const titleNode = programNode
        .querySelector('a[aria-label^="Review of"]')!
        .previousElementSibling!.querySelector(
          ":scope > div:nth-child(2) > span[title]",
        )!;
      title = titleNode.textContent;
    } else if (programNode.matches('li[data-testid="searchResult"]')) {
      title = programNode
        .querySelector("a[aria-label]:first-child")!
        .getAttribute("aria-label")!;

      const metadataNode = Array.from(
        programNode.querySelectorAll("span"),
      ).find((node) => node.textContent.match(/^\d{4}.+?(Film|Show)$/));
      if (metadataNode) {
        type = metadataNode.textContent.endsWith("Film") ? "movie" : "series";
        year = Number(metadataNode.textContent.split(" ")[0]) ?? undefined;
      }
    }

    return {
      ...super.extractProgramData(programNode, pContainer),
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

    if (programNode.matches('li[data-testid="searchResult"]')) {
      const metadataNode = Array.from(
        programNode.querySelectorAll("span"),
      ).find((node) => node.textContent.match(/^\d{4}.+?(Film|Show)$/));
      metadataNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
