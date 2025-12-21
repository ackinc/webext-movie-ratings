import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";
import type { Program } from "../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(): boolean {
    return true;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    const metadataWrapperNode = programNode.querySelector(
      "div.titleCard--metadataWrapper"
    );
    const durationNode = programNode.querySelector("span.duration");

    const type = durationNode
      ? ["Seasons", "Episodes", "Series"].some((x) =>
          durationNode.textContent.includes(x)
        )
        ? "series"
        : "movie"
      : null;
    const year =
      type === "movie" && metadataWrapperNode
        ? metadataWrapperNode.querySelector("div.year")?.textContent
        : null;

    return {
      title: programNode.getAttribute("aria-label") ?? "",
      ...(type ? { type } : {}),
      // specifying year for series is causing many false negatives
      //   when querying omdbapi
      ...(year ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement
  ) {
    if (programNode.matches("a.slider-refocus")) {
      const ggp = programNode.parentNode!.parentNode!.parentNode!;
      if ((ggp.lastChild as HTMLElement).matches("div.progress")) {
        ggp.insertBefore(imdbNode, ggp.lastChild);
      } else {
        ggp.appendChild(imdbNode);
      }
    } else if (programNode.matches("div.titleCard--container")) {
      const metadataWrapper = programNode.querySelector(
        "div.titleCard--metadataWrapper"
      )!;
      metadataWrapper.insertBefore(imdbNode, metadataWrapper.lastChild);
    } else {
      console.error(
        "Error inserting IMDB node: program node not recognized",
        programNode
      );
    }
  }

  static override getIMDBNode(programNode: HTMLElement): HTMLElement | null {
    if (programNode.matches("a.slider-refocus")) {
      const ggp = programNode.parentNode!.parentNode!
        .parentNode! as HTMLElement;
      const ggplc = ggp.lastChild as HTMLElement;
      const maybeIMDBNode: HTMLElement = ggplc.matches("div.progress")
        ? (ggplc.previousElementSibling as HTMLElement)
        : ggplc;
      if (
        maybeIMDBNode &&
        maybeIMDBNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ) {
        return maybeIMDBNode;
      } else {
        return null;
      }
    }

    return programNode.querySelector(
      `div.titleCard--metadataWrapper > a.${IMDB_DATA_NODE_CLASS}`
    );
  }
}
