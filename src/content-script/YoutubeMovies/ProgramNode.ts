import AbstractProgramNode from "../AbstractProgramNode";
import type { ProgramData } from "../../common/types";
import { ErrorMessage } from "../../common";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    if (programNode.matches("ytd-grid-movie-renderer")) {
      const titleNode = programNode.querySelector("span#video-title");
      return {
        title: titleNode?.textContent.trim() ?? "",
      };
    }

    if (programNode.matches("ytd-compact-movie-renderer")) {
      const titleNode = programNode.querySelector("h3#movie-title");
      return {
        title: titleNode?.textContent.trim() ?? "",
      };
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches("ytd-grid-movie-renderer")) {
      const badgesContainer = programNode.querySelector(
        ":scope > ytd-badge-supported-renderer",
      );
      badgesContainer?.appendChild(imdbNode);
      return;
    }

    if (programNode.matches("ytd-compact-movie-renderer")) {
      const badgesContainer = programNode.querySelector(
        "div.details > a > ytd-badge-supported-renderer",
      )!;
      badgesContainer.appendChild(imdbNode);
      return;
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }
}
