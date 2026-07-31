import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    if (programNode.matches("article[data-card-title]")) {
      const type =
        programNode.dataset["cardEntityType"] === "Movie"
          ? "movie"
          : programNode.dataset["cardEntityType"] === "TV Show"
            ? "series"
            : null;
      return {
        title: extractProgramTitle(programNode.dataset["cardTitle"]!),
        ...(type ? { type } : {}),
      };
    }

    if (programNode.matches('div[data-testid="standard-mini-details"]')) {
      const titleNode = programNode.querySelector(
        'h4[data-testid="title-art"]',
      )!;
      return { title: extractProgramTitle(titleNode.textContent) };
    }

    if (programNode.matches('article[data-testid="super-carousel-card"]')) {
      return {
        title: extractProgramTitle(
          programNode
            .querySelector("a.shared-poster-link")!
            .getAttribute("aria-label")!,
        ),
      };
    }

    // search results preview pane
    if (programNode.matches("article > a")) {
      return {
        title: extractProgramTitle(programNode.getAttribute("aria-label")!),
      };
    }

    if (programNode.matches('article[data-testid="top-hero-card"]')) {
      const titleNode = programNode.querySelector(
        'div[data-testid="title-metadata-main"] h2[data-testid="title-art"][aria-label]',
      )!;

      const synopsisNode = programNode.querySelector(
        'div[data-testid="hero-synopsis"',
      )!;
      const type = synopsisNode.textContent.trim().toLowerCase().startsWith("season")
        ? "series"
        : "movie";
      return {
        title: extractProgramTitle(titleNode.getAttribute("aria-label")!),
        ...(type ? { type } : {}),
      };
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (programNode.matches('div[data-testid="standard-mini-details"]')) {
      const titleNode = programNode.querySelector(
        'h4[data-testid="title-art"]',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('article[data-testid="top-hero-card"]')) {
      const titleNode = programNode.querySelector(
        'div[data-testid="title-metadata-main"] h2[data-testid="title-art"][aria-label]',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
