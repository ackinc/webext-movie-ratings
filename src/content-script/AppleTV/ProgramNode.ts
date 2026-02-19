import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    let title: string = "";

    if (programNode.matches("ul > li a.lockup,ul > li div.lockup")) {
      title =
        programNode.querySelector("div.content img")?.getAttribute("alt") ?? "";

      if (!title && programNode.matches("ul > li a.lockup")) {
        const href = programNode.getAttribute("href");
        const hrefParts = href?.split("/") ?? [];
        const titleIdx =
          Math.max(hrefParts.indexOf("movie"), hrefParts.indexOf("show")) + 1;
        title = hrefParts[titleIdx]?.replace(/-/g, " ") ?? "";
      }
    } else if (programNode.matches("ul > li button.epic-showcase-item")) {
      title = programNode.getAttribute("aria-label") ?? "";
    } else if (programNode.matches("div.search-hint-lockup")) {
      title =
        programNode.querySelector(
          'div[data-testid="search-hint-lockup-title"] > span',
        )?.textContent ?? "";
    }

    let type: Program["type"];
    if (location.pathname.includes("/movie/")) {
      type = "movie";
    } else if (location.pathname.includes("/show/")) {
      type = "series";
    } else if (programNode.matches("ul > li a.lockup")) {
      const href = programNode.getAttribute("href");
      type = href?.includes("/movie/")
        ? "movie"
        : href?.includes("/show/")
          ? "series"
          : undefined;
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
