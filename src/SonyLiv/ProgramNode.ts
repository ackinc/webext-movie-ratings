import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, extractProgramTitle } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    if (node.matches("a.trending-tray-link")) {
      // we can't say for sure, so always return true
      return true;
    }

    const href = node.getAttribute("href");
    return ["/movies", "/shows", "/trailer"].some((x) => href.startsWith(x));
  }

  static extractData(node) {
    const data = {};

    data.title = extractProgramTitle(
      node.getAttribute("title") ||
        node.querySelector("div.album-cover-container > img[title]")?.title ||
        ""
    );

    const href = node.getAttribute("href");
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
