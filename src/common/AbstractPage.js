import AbstractProgramNode from "./AbstractProgramNode";
import { IMDB_STYLE_NODE_CLASS, IMDB_DATA_NODE_CLASS, getIMDBLink } from ".";

export default class AbstractPage {
  static ProgramNode = AbstractProgramNode;

  constructor() {
    this.checkIMDBDataAlreadyAdded = this.checkIMDBDataAlreadyAdded.bind(this);
    this.findProgramsInProgramContainer =
      this.findProgramsInProgramContainer.bind(this);
    this.isValidProgramContainer = this.isValidProgramContainer.bind(this);
  }

  async initialize() {
    this.injectStyles();
  }

  findPrograms() {
    const programContainerNodes = this.findProgramContainerNodes();
    const programContainers = programContainerNodes
      .map((node) => ({
        title: this.getTitleFromProgramContainerNode(node),
        node,
      }))
      .filter(this.isValidProgramContainer);
    const programs = programContainers
      .map(this.findProgramsInProgramContainer)
      .flat();
    return programs;
  }

  checkIMDBDataAlreadyAdded(program) {
    return !!this.constructor.ProgramNode.getIMDBNode(program.node);
  }

  addIMDBData(program, data) {
    if (this.checkIMDBDataAlreadyAdded(program)) return;
    const ratingNode = this.createIMDBDataNode(data);
    this.constructor.ProgramNode.insertIMDBNode(program.node, ratingNode);
  }

  injectStyles() {
    const styleNode = document.createElement("style");
    styleNode.classList.add(IMDB_STYLE_NODE_CLASS);
    document.head.appendChild(styleNode);
  }

  findProgramContainerNodes() {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  getTitleFromProgramContainerNode(pContainerNode) {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  isValidProgramContainer(pContainer) {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  findProgramsInProgramContainer(pContainer) {
    throw new Error("Not implemented");
  }

  createIMDBDataNode(data) {
    const node = document.createElement("a");
    node.classList.add(IMDB_DATA_NODE_CLASS);
    if (data.imdbRating !== "N/F") {
      node.setAttribute("href", getIMDBLink(data.imdbID));
      node.setAttribute("target", "_blank");
    }
    if (["N/F"].includes(data.imdbRating)) {
      node.style.visibility = "hidden";
    }
    node.innerText = `IMDb ${data.imdbRating === "N/A" ? "" : data.imdbRating}`;
    node.addEventListener("click", (e) => e.stopPropagation());
    return node;
  }
}
