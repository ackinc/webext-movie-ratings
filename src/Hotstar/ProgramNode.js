import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";

export default class ProgramNode extends AbstractProgramNode {
  static isMovieOrSeries(node) {
    const disambiguatingNode = node.querySelector('div[data-testid="action"]');
    return ["Movie", "Show"].includes(
      disambiguatingNode?.getAttribute("aria-label")?.split(",").at(-1)
    );
  }

  static extractData(node) {
    const disambiguatingNode = node.querySelector('div[data-testid="action"]');
    const isMovie =
      disambiguatingNode.getAttribute("aria-label").split(",").at(-1) ===
      "Movie";

    const label = disambiguatingNode
      .querySelector("article img")
      .getAttribute("alt");
    if (!label) {
      // console.warn("No label found for node", node);
    }

    return {
      title: label,
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
