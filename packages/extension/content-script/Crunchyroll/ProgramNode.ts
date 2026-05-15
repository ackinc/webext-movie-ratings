import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    if (programNode.matches('div[data-t="carousel-card-wrapper"]')) {
      const title = programNode.querySelector("h3")!.textContent;
      return { title };
    }

    if (
      programNode.matches(
        'div[class^="browse-card-hover"][data-t="hover-component"]',
      )
    ) {
      const hrefNode = programNode.querySelector('a[data-t="hover-link"]')!;
      const title = hrefNode.getAttribute("aria-label")!;
      const type = hrefNode.getAttribute("href")?.startsWith("/series")
        ? "series"
        : "movie";
      return { title, type };
    }

    if (programNode.matches('div[data-t^="episode-card"]')) {
      const title = programNode.querySelector("small")!.textContent;
      return { title };
    }

    if (
      programNode.matches(
        'div[class^="playable-card-hover"][data-t="hover-component"]',
      )
    ) {
      const hrefNode = programNode.querySelector(
        'a[class^="playable-card-hover"][data-t="series-title"]',
      )!;
      const title = extractProgramTitle(hrefNode.textContent);
      return { title };
    }

    if (programNode.matches('div[data-t^="watch-list-card"]')) {
      const title = programNode.querySelector("h3")!.textContent;
      return { title };
    }

    if (
      [
        'div[data-t="release-episode-card-stack"]',
        'div[data-t="release-episode-card"]',
        'div[data-t="release-episode-card-stack-hover"]',
      ].some((sel) => programNode.matches(sel))
    ) {
      const title = extractProgramTitle(
        programNode.querySelector("h4")!.textContent,
      );
      return { title };
    }

    if (programNode.matches('div[data-t="single-show-card"]')) {
      const title = programNode.querySelector("h2")!.textContent;
      return { title };
    }

    if (programNode.matches("div.browse-card")) {
      const title =
        programNode.querySelector('h3[data-t="title"]')!.textContent;
      return { title };
    }

    if (programNode.matches('div[data-t="series-card"]')) {
      // for styling purposes, we insert the imdb node *into* the title
      //   node; this means we can't just take the textContent of the h2,
      //   for that would contain the imdb node's text as well
      const title =
        programNode.querySelector("h2")!.firstElementChild!.textContent;
      return { title };
    }

    if (programNode.matches('div[data-t="search-series-card"]')) {
      const title = programNode.querySelector("h2")!.textContent;
      return { title };
    }

    if (programNode.matches('div[data-t="search-movie-card"]')) {
      const title = programNode.querySelector("h2")!.textContent;
      return { title };
    }

    if (programNode.matches('div[data-t="search-episode-card"]')) {
      const title = programNode.querySelector(
        'small[data-t="series-title"]',
      )!.textContent;
      return { title };
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
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

    if (
      programNode.matches(
        'div[class^="browse-card-hover"][data-t="hover-component"]',
      )
    ) {
      const titleNode = programNode.querySelector('h3[data-t="title"]')!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-t^="episode-card"]')) {
      const titleNode = programNode.lastElementChild!.querySelector("small");
      titleNode?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (
      programNode.matches(
        'div[class^="playable-card-hover"][data-t="hover-component"]',
      )
    ) {
      const hrefNode = programNode.querySelector(
        'a[class^="playable-card-hover"][data-t="series-title"]',
      )!;
      hrefNode.insertAdjacentElement("afterend", imdbNode);
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
