import type { Program } from "./types";

export default class AbstractProgramNode {
  static isMovieOrSeries(_programNode: HTMLElement): boolean {
    throw new Error("Not implemented");
  }

  static extractData(_programNode: HTMLElement): Omit<Program, "node"> {
    throw new Error("Not implemented");
  }

  static insertIMDBNode(_programNode: HTMLElement, _imdbNode: HTMLElement) {
    throw new Error("Not implemented");
  }

  static getIMDBNode(_programNode: HTMLElement): HTMLElement | null {
    throw new Error("Not implemented");
  }
}
