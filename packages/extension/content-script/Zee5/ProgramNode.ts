import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches('div[data-testid$="active_carousel"]')) {
      const titleNode =
        programNode.firstElementChild!.lastElementChild!.firstElementChild!
          .firstElementChild!;
      title = titleNode.textContent;
    } else if (programNode.matches("div.keen-slider__slide article")) {
      const titleNode = programNode.querySelector("img")!;
      title = titleNode.getAttribute("alt")!;
    } else if (programNode.matches("div.movieCard")) {
      title = programNode
        .querySelector("div[data-minutelytitle]")!
        .getAttribute("data-minutelytitle")!;
    } else if (
      programNode.matches('div[data-testid^="recommended-thumbnail"')
    ) {
      title = programNode.getAttribute("title")!;
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
    if (programNode.matches('div[data-testid$="active_carousel"]')) {
      const titleNode =
        programNode.firstElementChild!.lastElementChild!.firstElementChild!
          .firstElementChild!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
