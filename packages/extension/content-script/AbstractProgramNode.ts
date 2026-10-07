import { CssClasses } from "../common";
import type { ProgramContainer, ProgramData } from "../common/types";

export default class AbstractProgramNode {
  static isMovieOrSeries(_programNode: HTMLElement): boolean {
    return true;
  }

  // ensure overriding implementations throw
  //   ErrorMessage.unrecognizedProgramNode if _programNode does
  //   not match any of the selectors returned by
  //   page.getProgramNodeSelectors
  static extractProgramData(
    _programNode: HTMLElement,
    pContainer: ProgramContainer,
  ): ProgramData {
    const pieces = [location.pathname, pContainer.title];

    const movieTells = ["movie", "oscar"].map(
      (x) => new RegExp(`\b${x}\b`, "i"),
    );
    const seriesTells = ["series", "show", "episode", "tv"].map(
      (x) => new RegExp(`\b${x}\b`, "i"),
    );

    const type: ProgramData["type"] | null = movieTells.some((t) =>
      pieces.some((p) => t.test(p)),
    )
      ? "movie"
      : seriesTells.some((t) => pieces.some((p) => t.test(p)))
        ? "series"
        : null;

    return {
      title: "", // to be filled by overriding methods in subclasses
      ...(type ? { type } : {}),
    };
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
