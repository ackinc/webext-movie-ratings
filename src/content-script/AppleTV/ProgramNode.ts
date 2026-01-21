import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    return !!programNode;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    let title: string = "";

    if (programNode.matches("ul > li a")) {
      title = programNode.getAttribute("aria-label") ?? "";
    } else if (programNode.matches("div.search-hint-lockup")) {
      title =
        programNode.querySelector(
          'div[data-testid="search-hint-lockup-title"] > span',
        )?.textContent ?? "";
    }

    let type: Program["type"];
    if (location.pathname.includes("/movie/")) {
      type = "movie";
    } else if (location.pathname.includes("/show/")) {
      type = "series";
    }

    return { title, ...(type ? { type } : {}) };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (programNode.matches("div.search-hint-lockup")) {
      const titleNode = programNode.querySelector(
        'div[data-testid="search-hint-lockup-title"] > span',
      );
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("a.search-card.lockup")) {
      const titleNode = programNode.querySelector("p.search-card-title");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    programNode.appendChild(imdbNode);
  }
}
