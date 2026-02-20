import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage } from "../../common";
import type { Program, ProgramData } from "../../common";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: Program["type"] | undefined = location.pathname.includes(
      "/movie/",
    )
      ? "movie"
      : location.pathname.includes("/show/")
        ? "series"
        : undefined;

    if (programNode.matches("ul > li button.epic-showcase-item")) {
      title = programNode.getAttribute("aria-label") ?? "";
    } else if (["ul > li a.lockup"].some((s) => programNode.matches(s))) {
      title =
        programNode.querySelector("div.content img")?.getAttribute("alt") ?? "";

      const href = programNode.getAttribute("href");

      if (!title) {
        const hrefParts = href?.split("/") ?? [];
        const titleIdx =
          Math.max(hrefParts.indexOf("movie"), hrefParts.indexOf("show")) + 1;
        title = hrefParts[titleIdx]?.replace(/-/g, " ") ?? "";
      }

      if (!type) {
        type = href?.includes("/movie/")
          ? "movie"
          : href?.includes("/show/")
            ? "series"
            : undefined;
      }
    } else if (["ul > li div.lockup"].some((s) => programNode.matches(s))) {
      title =
        programNode.querySelector("div.content img")?.getAttribute("alt") ?? "";
    } else if (programNode.matches("div.search-hint-lockup")) {
      title =
        programNode.querySelector(
          'div[data-testid="search-hint-lockup-title"] > span',
        )?.textContent ?? "";
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return { title, ...(type ? { type } : {}) };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ): void {
    if (programNode.matches("div.search-hint-lockup")) {
      const titleNode = programNode.querySelector(
        'div[data-testid="search-hint-lockup-title"] > span',
      );
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("a.search-card.lockup")) {
      const titleNode = programNode.querySelector("p.search-card-title");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    programNode.appendChild(imdbNode);
  }
}
