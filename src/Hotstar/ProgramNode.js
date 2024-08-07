import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const href = node.getAttribute("href");
    return href.startsWith("/in/movies") || href.startsWith("/in/shows");
  }

  static extractData(node) {
    const href = node.getAttribute("href");
    const isMovie = href.startsWith("/in/movies");

    const label = node.getAttribute("aria-label");
    if (!label) {
      // console.warn("No label found for node", node);
    }

    return {
      title: label?.replace(/,\s*?(Movie|Show),?.*$/, "").trim(),
      type: isMovie ? "movie" : "series",
    };
  }

  static insertIMDBNode(node, imdbNode) {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      metadataNode.insertBefore(
        imdbNode,
        metadataNode.lastChild.previousElementSibling
      );
    } else if (node.nextElementSibling) {
      node.parentNode.insertBefore(imdbNode, node.nextElementSibling);
    } else {
      node.parentNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(node) {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      return metadataNode.querySelector(`a.${IMDB_DATA_NODE_CLASS}`);
    }

    const maybeImdbDataNode = node.nextElementSibling;
    if (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbDataNode;
    }

    return null;
  }

  static getMetadataNode(node) {
    return node.firstChild.querySelector(
      ':scope > div[data-scale-down="true"]'
    );
  }
}
