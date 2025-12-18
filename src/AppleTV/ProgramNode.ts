import { IMDB_DATA_NODE_CLASS } from "../common";

export default class ProgramNode {
  static isMovieOrSeries(programNode) {
    return !!programNode;
  }

  static extractData(programNode) {
    const title = programNode.getAttribute("aria-label");
    return { title, type: null };
  }

  static insertIMDBNode(programNode, imdbNode) {
    programNode.appendChild(imdbNode);
  }

  static getIMDBNode(programNode) {
    return programNode.querySelector(`a.${IMDB_DATA_NODE_CLASS}`);
  }
}
