import AbstractProgramNode from "../common/AbstractProgramNode";
import {
  extractProgramTitle,
  findAncestor,
  IMDB_DATA_NODE_CLASS,
} from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(programNode) {
    return !!programNode;
  }

  static extractData(programNode) {
    if (programNode.nodeName === "ARTICLE") {
      const type =
        programNode.dataset.cardEntityType === "Movie"
          ? "movie"
          : programNode.dataset.cardEntityType === "TV Show"
          ? "series"
          : null;
      return {
        title: extractProgramTitle(programNode.dataset.cardTitle),
        type,
      };
    } else if (programNode.nodeName === "A") {
      return { title: programNode.getAttribute("aria-label") };
    }
  }

  static insertIMDBNode(programNode, imdbNode) {
    if (programNode.nodeName === "A") {
      const li = findAncestor(programNode, (node) => node.nodeName === "LI");
      li.appendChild(imdbNode);
    } else if (
      programNode.nextElementSibling?.nodeName === "ARTICLE" ||
      programNode.previousElementSibling?.nodeName === "ARTICLE"
    ) {
      programNode.appendChild(imdbNode);
    } else if (
      programNode.nodeName === "ARTICLE" &&
      programNode.previousElementSibling?.nodeName === "STRONG"
    ) {
      programNode.appendChild(imdbNode);
    } else {
      programNode.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(programNode) {
    let maybeImdbNode;

    if (programNode.nodeName === "A") {
      const li = findAncestor(programNode, (node) => node.nodeName === "LI");
      maybeImdbNode = li.lastChild;
    } else if (
      programNode.nextElementSibling?.nodeName === "ARTICLE" ||
      programNode.previousElementSibling?.nodeName === "ARTICLE"
    ) {
      maybeImdbNode = programNode.lastChild;
    } else if (
      programNode.nodeName === "ARTICLE" &&
      programNode.previousElementSibling?.nodeName === "STRONG"
    ) {
      maybeImdbNode = programNode.lastChild;
    } else {
      maybeImdbNode = programNode.nextElementSibling;
    }

    return maybeImdbNode &&
      maybeImdbNode.classList.contains(IMDB_DATA_NODE_CLASS)
      ? maybeImdbNode
      : null;
  }
}
