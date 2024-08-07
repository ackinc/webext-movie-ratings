import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS, extractProgramTitle } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/movies") || href.startsWith("/tv-shows");
  }

  static extractData(node) {
    const isMovie = node.getAttribute("href").startsWith("/movies");
    const data = {};

    const ariaLabelParts = node
      .getAttribute("aria-label")
      .match(
        /^(.+?)(\((\d+)\).*)?(:|-)\s(Watch|Stay Tuned|All Seasons, Episodes|A Thrilling New Series)/
      );

    if (!ariaLabelParts) {
      // console.error(`Error extracting data from program node`, node);
      return data;
    }

    data.title = this.#extractProgramTitle(ariaLabelParts[1]);
    data.type = isMovie ? "movie" : "series";

    // the year data on JioCinema seems super unreliable, so we won't use it
    // examples:
    //   "Welcome (2022)"" should be "Welcome (2007)"
    // data.year = ariaLabelParts[3] ? +ariaLabelParts[3] : undefined;

    return data;
  }

  static insertIMDBNode(node, imdbNode) {
    if (node.nextElementSibling) {
      node.parentNode.insertBefore(imdbNode, node.nextElementSibling);
    } else {
      node.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(node) {
    const maybeImdbDataNode = node.nextElementSibling;
    if (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbDataNode;
    }

    return null;
  }

  static #extractProgramTitle(str) {
    let title = extractProgramTitle(str);

    // page-specific exceptional cases
    const exceptionalCases = {
      "Watch Chernobyl": "Chernobyl",
      "Watch The Newsroom": "The Newsroom",
      "Enjoy Pokemon": "Pokemon",
      "Harry Potter And The Philosopher's Stone":
        "Harry Potter And the Sorcerer's Stone",
      "The Family Star": "Family Star",
      "Happy Bhag Jayegi": "Happy Bhaag Jayegi",
      "Gangs Of Wasseypur 1": "Gangs Of Wasseypur",
      "Nagashaurya's Aswathama": "Aswathama",
    };

    return exceptionalCases[title] ?? title;
  }
}
