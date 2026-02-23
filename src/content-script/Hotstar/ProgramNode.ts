import AbstractProgramNode from "../AbstractProgramNode";
import type { Program, ProgramData } from "../../common/types";
import { ErrorMessage } from "../../common";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    const disambiguatingNode = programNode.querySelector(
      'div[data-testid="action"]',
    );

    if (disambiguatingNode?.getAttribute("aria-label")) {
      return /,(Movie|Show)$/.test(
        disambiguatingNode.getAttribute("aria-label")!,
      );
    } else {
      const href = disambiguatingNode?.firstElementChild?.getAttribute("href");
      return Boolean(
        href && ["/movies/", "/shows/"].some((x) => href.includes(x)),
      );
    }
  }

  static override extractProgramData(programNode: HTMLElement): ProgramData {
    if (programNode.matches('div[data-testid="tray-card-default"]')) {
      const disambiguatingNode = programNode.querySelector(
        'div[data-testid="action"]',
      )!;

      const title = disambiguatingNode
        .querySelector("article img")!
        .getAttribute("alt")!;

      let type: Program["type"];
      if (disambiguatingNode.getAttribute("aria-label")) {
        const ariaLabel = disambiguatingNode.getAttribute("aria-label")!;
        type = ariaLabel.endsWith("Movie") ? "movie" : "series";
      } else {
        const href =
          disambiguatingNode.firstElementChild!.getAttribute("href")!;
        type = href.includes("/movies/") ? "movie" : "series";
      }

      return { title, type };
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (
      programNode.matches(
        'div[data-testid="tray-card-default"]:has(div[data-testid="action"]:not([aria-label]))',
      )
    ) {
      const titleNode = programNode.querySelector(
        'a span[title]:not([title=""])',
      )!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    programNode.appendChild(imdbNode);
  }
}
