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

    if (programNode.matches('main[id="hero-banner"]')) {
      const titleNode = programNode.querySelector('img[id="hero-title"][alt]')!;
      title = titleNode.getAttribute("alt")!;

      const metadataNode = programNode.querySelector(
        'div[id="hero-metadata-container"]',
      )!;
      const metadata = Array.from(metadataNode.querySelectorAll("span"))
        .map((node) => node.textContent)
        .filter((text) => !!text);
      year = Number(metadata.find((x) => /\d{4}/.test(x))) || null;

      const tmp = metadata
        .find((x) => /movie|series|show/i.test(x))
        ?.toLowerCase();
      type = !tmp ? null : tmp === "movie" ? "movie" : "series";
    } else if (programNode.matches(".card-and-title-wrapper")) {
      const titleNode = programNode.querySelector(".hover-panel h3[title]")!;
      title = titleNode.textContent;

      const metadataNode = titleNode.nextElementSibling;
      type = metadataNode?.textContent.split("•")[0]?.match(/\d+h( \d+m)/)
        ? "movie"
        : "series";
      year =
        Number(metadataNode?.textContent.match(/\b(\d{4})\b/)?.[1]) ??
        undefined;
    } else if (programNode.matches(".card-and-title-wrapper .hover-panel")) {
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
    if (programNode.matches('main[id="hero-banner"]')) {
      const metadataNode = programNode.querySelector(
        'div[id="hero-metadata-container"]',
      );
      metadataNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches(".card-and-title-wrapper .hover-panel")) {
      const titleNode = programNode.querySelector("h3[title]")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
