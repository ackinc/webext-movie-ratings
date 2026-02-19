import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    let title: string = "";
    if (programNode.matches("div.title-card-container")) {
      title = programNode.querySelector("a")?.getAttribute("aria-label") ?? "";
    } else {
      title = programNode.getAttribute("aria-label") ?? "";
    }

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
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      // specifying year for series is causing many false negatives
      //   when querying omdbapi
      ...(year ? { year } : {}),
    };
  }
}
