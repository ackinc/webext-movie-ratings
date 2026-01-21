import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    return !!programNode;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    if (programNode.matches("article[data-card-title]")) {
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
    }

    if (programNode.matches('article[data-testid="super-carousel-card"]')) {
      return {
        title: extractProgramTitle(
          programNode
            .querySelector("a.shared-poster-link")
            ?.getAttribute("aria-label") ?? "",
        ),
      };
    }

    // search results preview pane
    if (programNode.matches("article > a")) {
      return {
        title: extractProgramTitle(
          programNode.getAttribute("aria-label") ?? "",
        ),
      };
    }

    return { title: "" };
  }
}
