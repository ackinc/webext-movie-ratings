export default class AbstractProgramNode {
  static isMovieOrSeries(_programNode: HTMLElement): boolean {
    throw new Error("Not implemented");
  }

  static extractData(_programNode: HTMLElement) {
    throw new Error("Not implemented");
  }

  static insertIMDBNode(_programNode: HTMLElement, _imdbNode: HTMLElement) {
    throw new Error("Not implemented");
  }

  static getIMDBNode(_programNode: HTMLElement): HTMLElement {
    throw new Error("Not implemented");
  }
}
