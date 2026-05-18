import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (
      programNode.matches(
        'div.Slider__item div.Tile[data-automationid^="tile"]',
      )
    ) {
      const titleNode =
        programNode.querySelector("a.Tile__title-link") ??
        // streaming library (url: /content?tab=premium)
        programNode.querySelector("h3.Tile__title")!;
      title = titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        "span.Tile__description",
      )!;
      const typeAndYear = typeAndYearNode.textContent.split("•").at(-1);
      type = typeAndYear?.includes("Movie")
        ? "movie"
        : typeAndYear?.includes("Series")
          ? "series"
          : null;
      const yearRegexpMatch = typeAndYear?.match(/\((\d{4})\)$/);
      year = yearRegexpMatch ? +yearRegexpMatch[1]! : null;
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
    if (
      programNode.matches(
        'div.Slider__item div.Tile[data-automationid^="tile"]',
      )
    ) {
      const titleNode =
        programNode.querySelector("a.Tile__title-link") ??
        // streaming library (url: /content?tab=premium)
        programNode.querySelector("h3.Tile__title")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
