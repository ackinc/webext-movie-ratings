import AbstractProgramNode from "../common/AbstractProgramNode";
import {
  extractProgramTitle,
  findAncestor,
  IMDB_DATA_NODE_CLASS,
} from "../common";
import type { Program } from "../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    return !!programNode;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    if (programNode.nodeName === "ARTICLE") {
      const type =
        programNode.dataset["cardEntityType"] === "Movie"
          ? "movie"
          : programNode.dataset["cardEntityType"] === "TV Show"
            ? "series"
            : null;
      return {
        title: extractProgramTitle(programNode.dataset["cardTitle"] ?? ""),
        ...(type ? { type } : {}),
      };
    } else if (programNode.nodeName === "A") {
      return { title: programNode.getAttribute("aria-label") ?? "" };
    }

    return { title: "" };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement
  ) {
    if (programNode.nodeName === "A") {
      const li = findAncestor(programNode, (node) => node.nodeName === "LI");
      (li as HTMLElement).appendChild(imdbNode);
    } else if (
      programNode.nextElementSibling?.nodeName === "ARTICLE" ||
      programNode.previousElementSibling?.nodeName === "ARTICLE"
    ) {
      programNode.appendChild(imdbNode);
    } else if (
      programNode.nodeName === "ARTICLE" &&
      programNode.previousElementSibling?.nodeName === "STRONG"
    ) {
      programNode.appendChild(imdbNode);
    } else {
      (programNode.parentNode as HTMLElement).appendChild(imdbNode);
    }
  }

  static override getIMDBNode(programNode: HTMLElement): HTMLElement | null {
    let maybeImdbNode: HTMLElement | null;

    if (programNode.nodeName === "A") {
      const li = findAncestor(programNode, (node) => node.nodeName === "LI");
      maybeImdbNode = (li?.lastChild as HTMLElement | undefined) ?? null;
    } else if (
      programNode.nextElementSibling?.nodeName === "ARTICLE" ||
      programNode.previousElementSibling?.nodeName === "ARTICLE"
    ) {
      maybeImdbNode = programNode.lastChild as HTMLElement;
    } else if (
      programNode.nodeName === "ARTICLE" &&
      programNode.previousElementSibling?.nodeName === "STRONG"
    ) {
      maybeImdbNode = programNode.lastChild as HTMLElement;
    } else {
      maybeImdbNode = programNode.nextElementSibling as HTMLElement;
    }

    return maybeImdbNode &&
      maybeImdbNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ? maybeImdbNode
      : null;
  }
}
