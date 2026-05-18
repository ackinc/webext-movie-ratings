import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches('div.Tile[data-automationid^="tile"]')) {
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
    } else if (programNode.matches("div.PortraitTile")) {
      const titleNode = programNode.querySelector(
        "div.PortraitTile__title img",
      )!;
      title = titleNode.getAttribute("aria-label")!;

      const typeAndYearNode = programNode.querySelector(
        "span.PortraitTile__joined-tags",
      )!;
      const typeAndYear = typeAndYearNode.textContent.split("•").at(-1);
      type = typeAndYear?.includes("Movie")
        ? "movie"
        : typeAndYear?.includes("Series")
          ? "series"
          : null;
      const yearRegexpMatch = typeAndYear?.match(/\((\d{4})\)$/);
      year = yearRegexpMatch ? +yearRegexpMatch[1]! : null;
    } else if (programNode.matches("div.DetailEntityMasthead__entity")) {
      const titleNode = programNode.querySelector(
        "span.DetailEntityMasthead__title__text",
      )!;
      title = titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        "div.DetailEntityMetadata__tag-group",
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
    if (programNode.matches('div.Tile[data-automationid^="tile"]')) {
      const titleNode =
        programNode.querySelector("a.Tile__title-link") ??
        // streaming library (url: /content?tab=premium)
        programNode.querySelector("h3.Tile__title")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div.PortraitTile")) {
      const titleNode = programNode.querySelector(
        "div.PortraitTile__title img",
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div.DetailEntityMasthead__entity")) {
      const tagGroupNode = programNode.querySelector(
        "div.DetailEntityMetadata__tag-group",
      )!;
      tagGroupNode.parentElement!.insertAdjacentElement(
        "beforebegin",
        imdbNode,
      );
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
