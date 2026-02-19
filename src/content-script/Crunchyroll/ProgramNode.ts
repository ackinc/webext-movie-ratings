import AbstractProgramNode from "../AbstractProgramNode";
import { extractProgramTitle } from "../../common";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
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

    if (programNode.matches('div[data-t^="release-episode-card"]')) {
      const title = extractProgramTitle(
        programNode.querySelector("h4")?.textContent ?? "",
      );
      return { title };
    }

    if (programNode.matches('div[data-t="single-show-card"]')) {
      const title = programNode.querySelector("h2")?.textContent ?? "";
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

    if (programNode.matches('div[data-t="search-series-card"]')) {
      const title = programNode.querySelector("h2")?.textContent ?? "";
      return { title };
    }

    if (programNode.matches('div[data-t="search-movie-card"]')) {
      const title = programNode.querySelector("h2")?.textContent ?? "";
      return { title };
    }

    if (programNode.matches('div[data-t="search-episode-card"]')) {
      const title =
        programNode.querySelector('small[data-t="series-title"]')
          ?.textContent ?? "";
      return { title };
    }

    return { title: "" };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches('div[data-t="carousel-card-wrapper"]')) {
      const titleNode =
        programNode.querySelector('h3[data-t="title"]') ??
        programNode.querySelector("h3");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t^="episode-card"]')) {
      const titleNode = programNode.lastElementChild!.querySelector("small");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t^="watch-list-card"]')) {
      const titleNode = programNode.querySelector("h3");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t^="release-episode-card"]')) {
      const titleNode = programNode.querySelector("h4");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t="single-show-card"]')) {
      const titleNode = programNode.querySelector("h2");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div.browse-card")) {
      const titleNode = programNode.querySelector('h3[data-t="title"]');
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t="series-card"]')) {
      const titleNode = programNode.querySelector("h2");
      titleNode?.insertAdjacentElement("beforeend", imdbNode);
      return;
    }

    if (
      programNode.matches(
        'div[data-t="search-series-card"],div[data-t="search-movie-card"]',
      )
    ) {
      const titleNode = programNode.querySelector("h2");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t="search-episode-card"]')) {
      const titleNode = programNode.querySelector(
        'small[data-t="series-title"]',
      );
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }
  }
}
