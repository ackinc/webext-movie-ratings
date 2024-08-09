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

    const label = node.getAttribute("aria-label");
    data.title = this.#extractProgramTitle(label);
    data.type = isMovie ? "movie" : "series";

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
    let title = extractProgramTitle(str.replace(/(Movie|Show)$/, ""));

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
