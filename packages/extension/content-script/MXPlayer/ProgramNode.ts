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
    } else if (
      ["div.portrait-container", "div.landscape-container"].some((sel) =>
        programNode.matches(sel),
      )
    ) {
      if (programNode.querySelector("div.is-loader")) {
        title = "";
      }

      const linkNode = programNode.querySelector<HTMLElement>("a[data-to]");

      if (programNode.querySelector("div.is-loader")) {
        title = "";
      } else if (
        ["/detail", "/shorts"].some((x) =>
          linkNode?.dataset["to"]?.startsWith(x),
        )
      ) {
        title = "";
      } else if (linkNode?.dataset["to"]?.startsWith("/movie")) {
        title =
          linkNode
            .getAttribute("data-to")!
            .split("/")[2]
            ?.match(/watch-(.+?)-online/)?.[1]
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
    } else if (programNode.matches("div.hover-card-container")) {
      const titleNode = programNode.querySelector("div.hc-info h3")!;
      title = titleNode.textContent;
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

    if (programNode.matches("div.hover-card-container")) {
      const titleNode = programNode.querySelector("div.hc-info h3")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
