import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches('div.Tile[data-automationid^="tile"]')) {
      const titleNode =
        programNode.querySelector("a.Tile__title-link") ??
        // streaming library (url: /content?tab=premium)
        programNode.querySelector("h3.Tile__title")!;
      title = titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        "span.Tile__description",
      )!;
      const typeAndYear = typeAndYearNode.textContent.split("•").at(-1);
      type = typeAndYear?.includes("Movie")
        ? "movie"
        : typeAndYear?.includes("Series")
          ? "series"
          : null;
      const yearRegexpMatch = typeAndYear?.match(/\((\d{4})\)$/);
      year = yearRegexpMatch ? +yearRegexpMatch[1]! : null;
    } else if (programNode.matches("div.PortraitTile")) {
      const titleNode =
        programNode.querySelector("div.PortraitTile__title img") ??
        programNode.querySelector("div.PortraitTile__title span")!;
      title = titleNode.getAttribute("aria-label") ?? titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        "span.PortraitTile__joined-tags",
      )!;
      const typeAndYear = typeAndYearNode.textContent.split("•").at(-1);
      type = typeAndYear?.includes("Movie")
        ? "movie"
        : typeAndYear?.includes("Series")
          ? "series"
          : null;
      const yearRegexpMatch = typeAndYear?.match(/\((\d{4})\)$/);
      year = yearRegexpMatch ? +yearRegexpMatch[1]! : null;
    } else if (programNode.matches("div.DetailEntityMasthead__entity")) {
      const titleNode = programNode.querySelector(
        "span.DetailEntityMasthead__title__text",
      )!;
      title = titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        "div.DetailEntityMetadata__tag-group",
      )!;
      const typeAndYear = typeAndYearNode.textContent.split("•").at(-1);
      type = typeAndYear?.includes("Movie")
        ? "movie"
        : typeAndYear?.includes("Series")
          ? "series"
          : null;
      const yearRegexpMatch = typeAndYear?.match(/\((\d{4})\)$/);
      year = yearRegexpMatch ? +yearRegexpMatch[1]! : null;
    } else if (programNode.matches('div[data-testid="high-emphasis-tile"')) {
      const titleNode = programNode.querySelector(
        'a[data-testid="high-emphasis-tile-title-button"] img',
      )!;
      title = titleNode.getAttribute("alt")!.replace(/^Cover art for /i, "");
    } else if (
      programNode.matches('div[data-testid="medium-emphasis-vertical-tile"]')
    ) {
      const titleNode = programNode.querySelector(
        'a[data-testid="browse-action"]',
      )!;
      title = titleNode
        .getAttribute("aria-label")!
        .replace(/, Item \d+ of many$/i, "");

      const yearNode = programNode.querySelector(
        'div[data-testid="medium-emphasis-vertical-tile-content"] p',
      )!;
      year = /\d{4}$/.test(yearNode.textContent)
        ? +yearNode.textContent.slice(-4)
        : null;
    } else if (programNode.matches('div[data-testid="seh-tile-container"]')) {
      const titleNode = (programNode.querySelector(
        'a[data-testid="browse-action"]',
      ) ??
        programNode.querySelector(
          'button[data-testid="standard-emphasis-tile-thumbnail"]',
        ))!;
      title = titleNode
        .getAttribute("aria-label")!
        .replace(/, Item \d+ of many$/g, "");
    } else if (programNode.matches('div[data-testid="preview-panel"]')) {
      title = programNode.getAttribute("aria-label")!;

      const typeAndYearNode = Array.from(
        programNode.querySelectorAll(
          'div[data-testid="preview-panel-info-panel"] > div',
        ),
      ).find((node) => node.textContent.includes("•"));
      type = typeAndYearNode?.textContent.includes("mins") ? "movie" : "series";
      year = +(typeAndYearNode?.textContent.match(/\D(\d{4})\D/)?.[1] ?? "");
    } else if (programNode.matches('div[data-testid="my-stuff-tile"]')) {
      const titleNode = programNode.querySelector("a.Tile__title")!;
      title = titleNode.textContent;
    } else if (programNode.matches('div[data-testid="masthead-content"]')) {
      const titleNode = (programNode.querySelector(
        'div[data-testid="masthead-title-container"] img',
      ) ??
        programNode.querySelector(
          'div[data-testid="masthead-title-container"] div[data-testid="masthead-title-text"]',
        ))!;
      title = titleNode.getAttribute("alt") ?? titleNode.textContent;

      const typeAndYearNode = programNode.querySelector(
        'ul[data-testid="masthead-metadata"]',
      )!;
      const typeNode = Array.from(typeAndYearNode.children).find((node) =>
        ["movie", "series", "season", "episode"].some((x) =>
          node.textContent.toLowerCase().includes(x),
        ),
      );
      type = !typeNode
        ? null
        : typeNode.textContent.toLowerCase().includes("movie")
          ? "movie"
          : "series";
      const yearNode = Array.from(typeAndYearNode.children).find((node) =>
        /^\d{4}$/.test(node.textContent),
      );
      year = !yearNode ? null : +yearNode.textContent;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      ...(year && Number.isInteger(year) ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches('div.Tile[data-automationid^="tile"]')) {
      const titleNode =
        programNode.querySelector("a.Tile__title-link") ??
        // streaming library (url: /content?tab=premium)
        programNode.querySelector("h3.Tile__title")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div.PortraitTile")) {
      const titleNode =
        programNode.querySelector("div.PortraitTile__title img") ??
        programNode.querySelector("div.PortraitTile__title span")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div.DetailEntityMasthead__entity")) {
      const tagGroupNode = programNode.querySelector(
        "div.DetailEntityMetadata__tag-group",
      )!;
      tagGroupNode.parentElement!.insertAdjacentElement(
        "beforebegin",
        imdbNode,
      );
      return;
    }

    if (programNode.matches('div[data-testid="high-emphasis-tile"')) {
      const descriptionNode = programNode.querySelector(
        'div[data-testid="high-emphasis-tile-description"]',
      )!;
      descriptionNode.insertAdjacentElement("beforebegin", imdbNode);
      return;
    }

    if (
      programNode.matches('div[data-testid="medium-emphasis-vertical-tile"]')
    ) {
      const yearNode = programNode.querySelector(
        'div[data-testid="medium-emphasis-vertical-tile-content"] p',
      )!;
      yearNode.insertAdjacentElement("beforebegin", imdbNode);
      return;
    }

    if (programNode.matches('div[data-testid="seh-tile-container"]')) {
      if (programNode.querySelector("figcaption")) {
        const titleNode = programNode.querySelector(
          'div[data-testid="seh-tile-content-title"]',
        )!;
        titleNode.insertAdjacentElement("afterend", imdbNode);
      } else {
        super.insertIMDBNode(programNode, imdbNode);
      }
      return;
    }

    if (programNode.matches('div[data-testid="preview-panel"]')) {
      const typeAndYearNode = Array.from(
        programNode.querySelectorAll(
          'div[data-testid="preview-panel-info-panel"] > div',
        ),
      ).find((node) => node.textContent.includes("•"));
      typeAndYearNode?.insertAdjacentElement("beforebegin", imdbNode);
      return;
    }

    if (programNode.matches('div[data-testid="my-stuff-tile"]')) {
      const titleNode = programNode.querySelector("a.Tile__title")!;
      titleNode.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches('div[data-testid="masthead-content"]')) {
      const typeAndYearNode = programNode.querySelector(
        'ul[data-testid="masthead-metadata"]',
      )!;
      typeAndYearNode.insertAdjacentElement("afterbegin", imdbNode);
      return;
    }

    super.insertIMDBNode(programNode, imdbNode);
  }
}
