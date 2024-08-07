import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, extractProgramTitle } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return (
      href.startsWith("/movies") ||
      href.startsWith("/shows") ||
      href.startsWith("/trailer") ||
      (node.classList.contains("multipurpose-portrait-link") &&
        href.startsWith("https://www.sonyliv.com/dplnk?schema=sony://asset/"))
    );
  }

  static extractData(node) {
    const href = node.getAttribute("href");
    const data = {};

    data.title = extractProgramTitle(node.getAttribute("title"));
    data.type = href.startsWith("/movies")
      ? "movie"
      : href.startsWith("/shows")
      ? "series"
      : undefined;

    return data;
  }

  static insertIMDBNode(node, imdbNode) {
    if (node.parentNode.classList.contains("innerlistt")) {
      node.firstChild.style.marginBottom = "2em";
      node.firstChild.firstChild.appendChild(imdbNode);
    } else {
      node.parentNode.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(node) {
    if (node.parentNode.classList.contains("innerlistt")) {
      const candidate = node.firstChild.firstChild.lastChild;
      return candidate.classList.contains(IMDB_DATA_NODE_CLASS)
        ? candidate
        : null;
    }

    const candidate = node.parentNode.parentNode.lastChild;
    return candidate.classList.contains(IMDB_DATA_NODE_CLASS)
      ? candidate
      : null;
  }
}
