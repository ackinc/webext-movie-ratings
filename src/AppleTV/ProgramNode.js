import { IMDB_DATA_NODE_CLASS } from "../common";

export default class ProgramNode {
  static isMovieOrSeries(programNode) {
    return !!programNode;
  }

  static extractData(programNode) {
    const title =
      programNode.getAttribute("aria-label") ||
      JSON.parse(
        programNode.dataset.metricsLocation ||
          programNode.dataset.metricsImpressions
      ).name;

    const dataMetricsClick = JSON.parse(programNode.dataset.metricsClick);

    const type =
      dataMetricsClick.contentType === "Show"
        ? "series"
        : dataMetricsClick.contentType === "Movie"
        ? "movie"
        : null;

    return { title, type };
  }

  static insertIMDBNode(programNode, imdbNode) {
    if (programNode.matches("a.ordinal-chart-lockup")) {
      programNode
        .querySelector("div.ordinal-chart__metadata")
        .appendChild(imdbNode);
    } else if (programNode.matches("a.notes-lockup")) {
      const x = programNode.querySelector("div.notes-lockup__right");
      x.insertBefore(imdbNode, x.lastElementChild);
    } else if (programNode.matches("a.search-card__link")) {
      programNode
        .querySelector("div.search-card__metadata")
        .appendChild(imdbNode);
    } else if (
      programNode.querySelector(".lockup-overlay__promo-text-wrapper")
    ) {
      programNode.parentNode.appendChild(imdbNode);
    } else if (programNode.querySelector("div.lockup-overlay")) {
      programNode.parentNode.appendChild(imdbNode);
    } else {
      programNode.appendChild(imdbNode);
    }
  }

  static getIMDBNode(programNode) {
    const maybeImdbNode = programNode.matches("a.ordinal-chart-lockup")
      ? programNode.querySelector("div.ordinal-chart__metadata")
          .lastElementChild
      : programNode.matches("a.notes-lockup")
      ? programNode.querySelector("div.notes-lockup__right").lastElementChild
          .previousElementSibling
      : programNode.matches("a.search-card__link")
      ? programNode.querySelector("div.search-card__metadata").lastElementChild
      : programNode.querySelector(".lockup-overlay__promo-text-wrapper")
      ? programNode.parentNode.lastElementChild
      : programNode.querySelector("div.lockup-overlay")
      ? programNode.parentNode.lastElementChild
      : programNode.lastElementChild;

    if (
      maybeImdbNode &&
      maybeImdbNode.classList.contains(IMDB_DATA_NODE_CLASS)
    ) {
      return maybeImdbNode;
    } else {
      return null;
    }
  }
}
