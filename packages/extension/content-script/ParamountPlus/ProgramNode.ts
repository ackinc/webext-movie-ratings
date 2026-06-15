import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches("a.link[aria-label]")) {
      const titleNode = programNode.querySelector("img")!;
      title = titleNode.getAttribute("alt")!;
    } else if (programNode.matches("div.ch-bottom-components")) {
      const titleNode = programNode
        .closest("a.ch-expanded-container")!
        .querySelector("div.media-manager-container img")!;
      title = titleNode.getAttribute("alt")!;
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
    if (programNode.matches("div.ch-bottom-components")) {
      const metadataNode = programNode.querySelector("div.ch-info-wrapper")!;
      metadataNode.insertAdjacentElement("beforeend", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
