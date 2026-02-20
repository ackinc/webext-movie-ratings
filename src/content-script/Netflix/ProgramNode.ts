import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";

    if (
      [
        "div.title-card-container",
        "div.titleCard--container",
        'a[data-uia="search-gallery-video-card"]',
      ].some((s) => programNode.matches(s))
    ) {
      title =
        programNode.querySelector("a")?.getAttribute("aria-label") ??
        programNode.getAttribute("aria-label") ??
        "";

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

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }
}
