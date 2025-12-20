import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";
import type { Program } from "../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    return !!programNode;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    const title = programNode.getAttribute("aria-label") ?? "";
    return { title };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement
  ) {
    programNode.appendChild(imdbNode);
  }

  static override getIMDBNode(programNode: HTMLElement): HTMLElement | null {
    return programNode.querySelector(`a.${IMDB_DATA_NODE_CLASS}`);
  }
}
