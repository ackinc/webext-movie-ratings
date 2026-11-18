import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../../common";
import type { ProgramContainer, ProgramData } from "../../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(
    programNode: HTMLElement,
    pContainer: ProgramContainer,
  ): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches('div[data-testid$="active_carousel"]')) {
      const titleNode =
        programNode.firstElementChild!.lastElementChild!.firstElementChild!
          .firstElementChild!;
      title = titleNode.textContent;
    } else if (
      programNode.matches(".keen-slider__slide .card-and-title-wrapper")
    ) {
      const titleNode = programNode.querySelector(".hover-panel h3[title]")!;
      title = titleNode.textContent;

      const metadataNode = titleNode.nextElementSibling;
      type = metadataNode?.textContent.split("•")[0]?.match(/\d+h( \d+m)/)
        ? "movie"
        : "series";
      year =
        Number(metadataNode?.textContent.match(/\b(\d{4})\b/)?.[1]) ??
        undefined;
    } else if (
      programNode.matches(
        ".keen-slider__slide .card-and-title-wrapper .hover-panel",
      )
    ) {
      const titleNode = programNode.querySelector("h3[title]")!;
      title = titleNode.textContent;

      const metadataNode = titleNode.nextElementSibling;
      type = metadataNode?.textContent.split("•")[0]?.match(/\d+h( \d+m)/)
        ? "movie"
        : "series";
      year =
        Number(metadataNode?.textContent.match(/\b(\d{4})\b/)?.[1]) ??
        undefined;
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
      ...super.extractProgramData(programNode, pContainer),
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

    if (
      programNode.matches(
        ".keen-slider__slide .card-and-title-wrapper .hover-panel",
      )
    ) {
      const titleNode = programNode.querySelector("h3[title]")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
