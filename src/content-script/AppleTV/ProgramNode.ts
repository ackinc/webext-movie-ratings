import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    return !!programNode;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    const title = programNode.getAttribute("aria-label") ?? "";
    return { title };
  }
}
