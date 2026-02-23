import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";

    if (programNode.matches("div.billboard div.info.meta-layer")) {
      title = programNode
        .querySelector("div.titleWrapper img")!
        .getAttribute("alt")!;
    } else if (
      ["div.title-card-container"].some((s) => programNode.matches(s))
    ) {
      title = programNode.querySelector("a")!.getAttribute("aria-label")!;
    } else if (
      [
        "div.titleCard--container",
        'a[data-uia="search-gallery-video-card"][aria-label]',
      ].some((s) => programNode.matches(s))
    ) {
      title = programNode.getAttribute("aria-label")!;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
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
        ? metadataWrapperNode.querySelector("div.year")!.textContent
        : null;

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      // specifying year for series is causing many false negatives
      //   when querying omdbapi
      ...(year ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches("div.billboard div.info.meta-layer")) {
      const titleNode = programNode.querySelector("div.billboard-title");
      titleNode!.insertAdjacentElement("afterend", imdbNode);

      return;
    }

    programNode.appendChild(imdbNode);
  }
}
