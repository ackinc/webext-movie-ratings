class AbstractProgramNode {
  // eslint-disable-next-line no-unused-vars
  static isMovieOrSeries(programNode) {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  static extractData(programNode) {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  static insertIMDBNode(programNode, imdbNode) {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  static getIMDBNode(programNode) {
    throw new Error("Not implemented");
  }
}

export default AbstractProgramNode;
