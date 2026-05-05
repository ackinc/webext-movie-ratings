import { CssClasses } from "../common";
import type { ProgramData } from "../common/types";

export default class AbstractProgramNode {
  static isMovieOrSeries(_programNode: HTMLElement): boolean {
    return true;
  }

  // ensure implementations throw ErrorMessage.unrecognizedProgramNode if
  //   _programNode does not match any of the selectors returned by
  //   page.getProgramNodeSelectors
  static extractProgramData(_programNode: HTMLElement): ProgramData {
    throw new Error("Not implemented");
  }

  static insertIMDBNode(programNode: HTMLElement, imdbNode: HTMLElement) {
    programNode.appendChild(imdbNode);
  }

  static getIMDBNode(programNode: HTMLElement): HTMLElement | null {
    return programNode.querySelector(`.${CssClasses.imdbDataNode}`);
  }

  static removeIMDBNode(programNode: HTMLElement): void {
    const imdbNode = this.getIMDBNode(programNode);
    if (imdbNode) imdbNode.parentElement!.removeChild(imdbNode);
  }
}
