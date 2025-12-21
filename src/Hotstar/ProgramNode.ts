import AbstractProgramNode from "../common/AbstractProgramNode";
import { IMDB_DATA_NODE_CLASS } from "../common";
import type { Program } from "../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(node: HTMLElement): boolean {
    const disambiguatingNode = node.querySelector('div[data-testid="action"]');
    return ["Movie", "Show"].includes(
      disambiguatingNode?.getAttribute("aria-label")?.split(",").at(-1) ?? ""
    );
  }

  static override extractData(node: HTMLElement): Omit<Program, "node"> {
    const disambiguatingNode = node.querySelector('div[data-testid="action"]');
    const isMovie =
      disambiguatingNode?.getAttribute("aria-label")?.split(",").at(-1) ===
      "Movie";

    const label =
      disambiguatingNode?.querySelector("article img")?.getAttribute("alt") ??
      "";
    if (!label) {
      // console.warn("No label found for node", node);
    }

    return {
      title: label,
      type: isMovie ? "movie" : "series",
    };
  }

  static override insertIMDBNode(node: HTMLElement, imdbNode: HTMLElement) {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      metadataNode.insertBefore(
        imdbNode,
        (metadataNode.lastChild as HTMLElement).previousElementSibling
      );
    } else if (node.nextElementSibling) {
      (node.parentNode as HTMLElement).insertBefore(
        imdbNode,
        node.nextElementSibling
      );
    } else {
      (node.parentNode as HTMLElement).appendChild(imdbNode);
    }
  }

  static override getIMDBNode(node: HTMLElement): HTMLElement | null {
    const metadataNode = this.getMetadataNode(node);
    if (metadataNode) {
      return metadataNode.querySelector(`a.${IMDB_DATA_NODE_CLASS}`);
    }

    const maybeImdbDataNode = node.nextElementSibling as HTMLElement;
    if (
      maybeImdbDataNode &&
      maybeImdbDataNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbDataNode;
    }

    return null;
  }

  static getMetadataNode(node: HTMLElement): HTMLElement | null {
    return (node.firstChild as HTMLElement).querySelector(
      ':scope > div[data-scale-down="true"]'
    );
  }
}
