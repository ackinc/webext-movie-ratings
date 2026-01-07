import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";
import type { Program } from "../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(_programNode: HTMLElement): boolean {
    return true;
  }

  static override extractData(programNode: HTMLElement): Omit<Program, "node"> {
    if (programNode.matches('div[data-t="carousel-card-wrapper"]')) {
      const title =
        programNode.querySelector('h3[data-t="title"]')?.textContent ??
        // the carousel-card-wrapper nodes in the pre-login page
        //   don't have the data-t attr on the title h3
        programNode.querySelector("h3")?.textContent ??
        "";
      return { title };
    }

    if (programNode.matches('div[data-t^="episode-card"]')) {
      const title = programNode.querySelector("small")?.textContent ?? "";
      return { title };
    }

    if (programNode.matches('div[data-t^="watch-list-card"]')) {
      const title = programNode.querySelector("h3")?.textContent ?? "";
      return { title };
    }

    if (programNode.matches("div.browse-card")) {
      const title =
        programNode.querySelector('h3[data-t="title"]')?.textContent ?? "";
      return { title };
    }

    if (programNode.matches('div[data-t="series-card"]')) {
      // for styling purposes, we insert the imdb node *into* the title
      //   node; this means we can't just take the textContent of the h2,
      //   for that would contain the imdb node's text as well
      const title =
        programNode.querySelector("h2")?.firstElementChild?.textContent ?? "";
      return { title };
    }

    return { title: "" };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement
  ) {
    if (programNode.matches('div[data-t="carousel-card-wrapper"]')) {
      const titleNode =
        programNode.querySelector('h3[data-t="title"]') ??
        programNode.querySelector("h3");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
    }

    if (programNode.matches("div.browse-card")) {
      const titleNode = programNode.querySelector('h3[data-t="title"]');
      titleNode?.insertAdjacentElement("afterend", imdbNode);
    }

    if (programNode.matches('div[data-t="series-card"]')) {
      const titleNode = programNode.querySelector("h2");
      if (titleNode) {
        titleNode.insertAdjacentElement("beforeend", imdbNode);
        titleNode.style.display = "flex";
        titleNode.style.gap = "1rem";
      }
    }
  }

  static override getIMDBNode(programNode: HTMLElement): HTMLElement | null {
    let maybeImdbNode: HTMLElement | null = null;

    if (programNode.matches('div[data-t="carousel-card-wrapper"]')) {
      maybeImdbNode = programNode.querySelector(`.${IMDB_DATA_NODE_CLASS}`);
    }

    if (programNode.matches("div.browse-card")) {
      maybeImdbNode = programNode.querySelector(`.${IMDB_DATA_NODE_CLASS}`);
    }

    if (programNode.matches('div[data-t="series-card"]')) {
      maybeImdbNode = programNode.querySelector(`.${IMDB_DATA_NODE_CLASS}`);
    }

    return maybeImdbNode &&
      maybeImdbNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ? maybeImdbNode
      : null;
  }
}
