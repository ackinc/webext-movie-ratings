import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches("div.banner-card")) {
      const titleNode = programNode.querySelector(
        "div.bc-meta-row div.bc-title",
      )!;
      title = titleNode.querySelector("img")!.getAttribute("alt")!;
    } else if (programNode.matches("div.portrait-container")) {
      const linkNode = programNode.querySelector<HTMLElement>("a[data-to]");

      if (linkNode?.dataset["to"]?.startsWith("/detail")) {
        title = "";
      } else if (linkNode?.dataset["to"]?.startsWith("/movie")) {
        title =
          linkNode
            .getAttribute("data-to")!
            .split("/")[2]
            ?.match(/watch-(.+?)-movie-online/)?.[1]
            ?.replace(/-/g, " ") ?? "";
      } else if (linkNode?.dataset["to"]?.startsWith("/show")) {
        title =
          linkNode
            .getAttribute("data-to")!
            .split("/")[2]
            ?.replace(/^watch-/, "")
            .replace(/-/g, " ") ?? "";
      } else {
        throw new Error(ErrorMessage.unrecognizedProgramNode);
      }
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      ...(year && Number.isInteger(year) ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches("div.banner-card")) {
      const titleNode = programNode.querySelector(
        "div.bc-meta-row div.bc-title",
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
