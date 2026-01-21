import { CssClasses } from "../common";
import type { Program } from "../common/types";

export default class AbstractProgramNode {
  static isMovieOrSeries(_programNode: HTMLElement): boolean {
    throw new Error("Not implemented");
  }

  static extractData(_programNode: HTMLElement): Omit<Program, "node"> {
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
