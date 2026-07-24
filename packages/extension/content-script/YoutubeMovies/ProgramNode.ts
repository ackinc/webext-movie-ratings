import AbstractProgramNode from "../AbstractProgramNode";
import type { ProgramData } from "../../common/types";
import { ErrorMessage, extractProgramTitle } from "../../common";
import { captureException } from "../../common/errorReporter";
import { DataExtractionError } from "../../common/customErrors";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(programNode: HTMLElement): boolean {
    if (programNode.matches("ytd-grid-movie-renderer")) return true;

    if (programNode.matches("yt-lockup-view-model")) {
      const hasBuyOrRentBadge = Array.from(
        programNode.querySelectorAll(
          "div.ytLockupMetadataViewModelMetadata yt-badge-view-model",
        ),
      ).some((badgeNode) => badgeNode.textContent === "Buy or rent");
      return hasBuyOrRentBadge;
    }

    if (programNode.matches("div#above-the-fold.ytd-watch-metadata")) {
      const channelName = programNode
        .querySelector("ytd-channel-name yt-formatted-string.ytd-channel-name")!
        .textContent.trim();
      return channelName.startsWith("YouTube Movies");
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }

  static override extractProgramData(programNode: HTMLElement): ProgramData {
    if (programNode.matches("ytd-grid-movie-renderer")) {
      const titleNode = programNode.querySelector("span#video-title")!;
      return { title: extractProgramTitle(titleNode.textContent) };
    }

    if (programNode.matches("yt-lockup-view-model")) {
      const titleNode = programNode.querySelector("h3[title]")!;
      const title = extractProgramTitle(titleNode.textContent);

      let year: number | null = null;
      const yearNode = programNode.querySelector(
        "div.ytLockupMetadataViewModelMetadata span.ytContentMetadataViewModelMetadataText",
      )!;
      if (yearNode && /\d{4}$/.test(yearNode.textContent.trim())) {
        year = +yearNode.textContent.slice(-4);
      } else {
        captureException(
          DataExtractionError.from(
            new Error(ErrorMessage.unexpectedDataExtractionFailure),
            // attributing this error to the parent of the programNode
            //   instead of the programNode directly because we don't
            //   want or need one-error-per-program to be captured
            programNode.parentElement!,
            "yt-lockup-view-model",
          ),
          { tags: { attribute: "year" } },
        );
      }

      return { title, ...(year ? { year } : {}) };
    }

    if (programNode.matches("div#above-the-fold.ytd-watch-metadata")) {
      const titleNode = programNode.querySelector("div#title h1")!;
      const title = titleNode.textContent;

      const yearNode = Array.from(
        programNode.querySelectorAll(
          "ytd-metadata-row-container-renderer ytd-metadata-row-renderer",
        ),
      )
        .find(
          (node) =>
            node.querySelector("#title")!.textContent === "Release date",
        )
        ?.querySelector("#content")?.firstElementChild;
      const year =
        yearNode && /^\d{4}$/.test(yearNode.textContent)
          ? +yearNode.textContent
          : NaN;

      return { title, ...(Number.isInteger(year) ? { year } : {}) };
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }

  static override insertIMDBNode(
    programNode: HTMLElement,
    imdbNode: HTMLElement,
  ) {
    if (programNode.matches("ytd-grid-movie-renderer")) {
      const badgesContainer = programNode.querySelector(
        ":scope > ytd-badge-supported-renderer",
      );
      badgesContainer?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("yt-lockup-view-model")) {
      const badgesContainer = programNode.querySelector(
        "yt-content-metadata-view-model > div:nth-child(2)",
      )!;
      badgesContainer?.insertAdjacentElement("afterend", imdbNode);
      return;
    }

    if (programNode.matches("div#above-the-fold.ytd-watch-metadata")) {
      const titleNode = programNode.querySelector("div#title h1")!;
      titleNode.nextElementSibling!.appendChild(imdbNode);
      return;
    }

    throw new Error(ErrorMessage.unrecognizedProgramNode);
  }
}
