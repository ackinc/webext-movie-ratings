import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(): boolean {
    return true;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    const metadataWrapperNode = programNode.querySelector(
      "div.titleCard--metadataWrapper",
    );
    const durationNode = programNode.querySelector("span.duration");

    const type = durationNode
      ? ["Seasons", "Episodes", "Series"].some((x) =>
          durationNode.textContent.includes(x),
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
}
