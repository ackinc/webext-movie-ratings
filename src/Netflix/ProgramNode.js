import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries() {
    return true;
  }

  static extractData(programNode) {
    const metadataWrapperNode = programNode.querySelector(
      "div.titleCard--metadataWrapper"
    );
    const durationNode = programNode.querySelector("span.duration");

    const type = durationNode
      ? ["Seasons", "Episodes", "Series"].some((x) =>
          durationNode.textContent.includes(x)
        )
        ? "series"
        : "movie"
      : null;

    return {
      title: programNode.getAttribute("aria-label"),
      type,
      // specifying year for series is causing many false negatives
      //   when querying omdbapi
      year:
        type === "movie" && metadataWrapperNode
          ? metadataWrapperNode.querySelector("div.year").textContent
          : null,
    };
  }

  static insertIMDBNode(programNode, imdbNode) {
    if (programNode.matches("a.slider-refocus")) {
      const ggp = programNode.parentNode.parentNode.parentNode;
      if (ggp.lastChild.matches("div.progress")) {
        ggp.insertBefore(imdbNode, ggp.lastChild);
      } else {
        ggp.appendChild(imdbNode);
      }
    } else if (programNode.matches("div.titleCard--container")) {
      const metadataWrapper = programNode.querySelector(
        "div.titleCard--metadataWrapper"
      );
      metadataWrapper.insertBefore(imdbNode, metadataWrapper.lastChild);
    } else {
      console.error(
        "Error inserting IMDB node: program node not recognized",
        programNode
      );
    }
  }

  static getIMDBNode(programNode) {
    if (programNode.matches("a.slider-refocus")) {
      const ggp = programNode.parentNode.parentNode.parentNode;
      const maybeIMDBNode = ggp.lastChild.matches("div.progress")
        ? ggp.lastChild.previousElementSibling
        : ggp.lastChild;
      if (
        maybeIMDBNode &&
        maybeIMDBNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ) {
        return maybeIMDBNode;
      } else {
        return null;
      }
    }

    return programNode.querySelector(
      `div.titleCard--metadataWrapper > a.${IMDB_DATA_NODE_CLASS}`
    );
  }
}
