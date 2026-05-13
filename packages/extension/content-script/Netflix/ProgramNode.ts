import AbstractProgramNode from "../AbstractProgramNode";
import { ErrorMessage, extractProgramTitle } from "../../common";
import type { ProgramData } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override extractProgramData(programNode: HTMLElement): ProgramData {
    let title: string = "";
    let type: "movie" | "series" | null = null;
    let year: number | null = null;

    if (programNode.matches("div.billboard div.info.meta-layer")) {
      title = programNode
        .querySelector("div.titleWrapper img")!
        .getAttribute("alt")!;
    } else if (
      ["div.title-card-container"].some((s) => programNode.matches(s))
    ) {
      title = programNode.querySelector("a")!.getAttribute("aria-label")!;
    } else if (
      [
        "div.titleCard--container",
        'a[data-uia="search-gallery-video-card"][aria-label]',
      ].some((s) => programNode.matches(s))
    ) {
      title = programNode.getAttribute("aria-label")!;
    } else if (programNode.matches('section[data-uia="billboard"]')) {
      title = programNode
        .getAttribute("aria-label")!
        .replace("Featured Content:", "")
        .trim();

      const [yearNode, typeNode] = Array.from(
        programNode.querySelectorAll(
          'div[data-uia="billboard-title"] div[data-uia="attributes-elements"] > span',
        ),
      ).slice(1, 3);
      type = typeNode?.textContent
        ? ["Seasons", "Episodes", "Series"].some((x) =>
            typeNode.textContent.includes(x),
          )
          ? "series"
          : "movie"
        : null;
      year = yearNode?.textContent ? +yearNode.textContent : null;
    } else if (
      programNode.matches(
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="standard-card"])',
      )
    ) {
      title = (programNode.firstChild! as HTMLElement).getAttribute(
        "aria-label",
      )!;
    } else if (
      programNode.matches(
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="progress-card"])',
      )
    ) {
      title = (programNode.firstChild! as HTMLElement).getAttribute(
        "aria-label",
      )!;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramNode);
    }

    if (!type) {
      const durationNode = programNode.querySelector("span.duration");
      type = durationNode
        ? ["Seasons", "Episodes", "Series"].some((x) =>
            durationNode.textContent.includes(x),
          )
          ? "series"
          : "movie"
        : null;
    }
    if (!year) {
      const metadataWrapperNode = programNode.querySelector(
        "div.titleCard--metadataWrapper",
      );
      year =
        type === "movie" && metadataWrapperNode
          ? +metadataWrapperNode.querySelector("div.year")!.textContent
          : null;
    }

    return {
      title: extractProgramTitle(title),
      ...(type ? { type } : {}),
      // WARN: specifying year for series is causing many false negatives
      //   when querying omdbapi
      ...(year && Number.isInteger(year) ? { year } : {}),
    };
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches("div.billboard div.info.meta-layer")) {
      const titleNode = programNode.querySelector("div.billboard-title");
      titleNode!.insertAdjacentElement("afterend", imdbNode);

      return;
    }

    if (programNode.matches('section[data-uia="billboard"]')) {
      const attributesNode = programNode.querySelector(
        'div[data-uia="billboard-title"] div[data-uia="attributes-elements"]',
      )!;
      attributesNode.insertAdjacentElement("afterend", imdbNode);

      return;
    }

    programNode.appendChild(imdbNode);
  }
}
