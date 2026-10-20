import { CssClasses, type IMDBData } from "@common";

export function getImdbDataFromNode(node: HTMLElement): IMDBData {
  if (!node.classList.contains(CssClasses.imdbDataNode)) {
    throw new Error("node is not an IMDB data node");
  }

  const { dataset } = node.shadowRoot!.querySelector<HTMLDivElement>(
    `.${CssClasses.imdbDataNodeContent}`,
  )!;
  return {
    imdbId: dataset["imdbId"]!,
    imdbRating:
      +dataset["imdbRating"]! ||
      (dataset["imdbRating"] as Exclude<IMDBData["imdbRating"], number>),
    ...("expiry" in dataset ? { expiry: +dataset["expiry"]! } : {}),
    ...("wasReportedIncorrect" in dataset
      ? { wasReportedIncorrect: dataset["wasReportedIncorrect"] === "true" }
      : {}),
  };
}
