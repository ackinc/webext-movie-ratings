import AbstractProgramNode from "../AbstractProgramNode";
import type { Program } from "../../common/types";

export default class ProgramNode extends AbstractProgramNode {
  static override isMovieOrSeries(node: HTMLElement): boolean {
    const disambiguatingNode = node.querySelector('div[data-testid="action"]');
    return ["Movie", "Show"].includes(
      disambiguatingNode?.getAttribute("aria-label")?.split(",").at(-1) ?? "",
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
}
