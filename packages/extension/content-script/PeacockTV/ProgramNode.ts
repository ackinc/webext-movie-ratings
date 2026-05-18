import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches('a[data-testid="tile-link"]')) {
      title = programNode.getAttribute("aria-label")!;
    } else if (programNode.matches('a[data-testid="tile-link-wrapper"]')) {
      const titleNode = programNode.querySelector(
        'p[data-testid="tile-title"]',
      )!;
      title = titleNode.textContent;
    } else if (programNode.matches('a[data-testid="grid-tile"]')) {
      title = programNode.getAttribute("aria-label")!;
    } else if (
      programNode.matches(
        'div[data-testid^="IA-slide-recommendations-carousel"]',
      )
    ) {
      const titleNode = programNode.querySelector("h3")!;
      title = titleNode.textContent;
    } else if (programNode.matches('div.slick-slide div[role="group"]')) {
      const titleNode = programNode.querySelector("h3")!;
      title = titleNode.textContent;
    } else if (programNode.matches('div.slick-slide div[role="listitem"]')) {
      const titleNode = programNode.querySelector("h3")!;
      title = titleNode.textContent;
    } else if (programNode.matches('div[data-testid^="grid-item"]')) {
      const titleNode = programNode.querySelector(
        'a[data-preview-selector^="gridData-"][data-preview-selector$="showTitle"]',
      )!;
      title = titleNode.textContent;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      ...(year && Number.isInteger(year) ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches('a[data-testid="tile-link-wrapper"]')) {
      const titleNode = programNode.querySelector(
        'p[data-testid="tile-title"]',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('a[data-testid="grid-tile"]')) {
      const titleNode = programNode.querySelector("p");
      titleNode!.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (
      programNode.matches(
        'div[data-testid^="IA-slide-recommendations-carousel"]',
      )
    ) {
      const titleNode = programNode.querySelector("h3")!;
      titleNode!.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div.slick-slide div[role="group"]')) {
      const titleNode = programNode.querySelector("h3")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div.slick-slide div[role="listitem"]')) {
      const titleNode = programNode.querySelector("h3")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-testid^="grid-item"]')) {
      const titleNode = programNode.querySelector(
        'a[data-preview-selector^="gridData-"][data-preview-selector$="showTitle"]',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
