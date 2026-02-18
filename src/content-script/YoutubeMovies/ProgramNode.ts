import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";
import { ErrorMessages } from "common";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(_programNode: HTMLElement): boolean {
    return true;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    if (programNode.matches("ytd-grid-movie-renderer")) {
      const titleNode = programNode.querySelector("span#video-title");
      return {
        title: titleNode?.textContent.trim() ?? "",
      };
    }

    throw new Error(ErrorMessages.unrecognizedProgramNode);
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

    throw new Error(ErrorMessages.unrecognizedProgramNode);
  }
}
