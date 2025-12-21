import AbstractProgramNode from "./AbstractProgramNode";
import type { ProgramContainer, Program, IMDBData } from "./types";
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

  findPrograms(): Program[] {
    const programContainerNodes = this.findProgramContainerNodes();
    const programContainers = programContainerNodes
      .map((node) => ({
        title: this.getTitleFromProgramContainerNode(node),
        node,
      }))
      .filter(this.isValidProgramContainer);
    const programs = programContainers.map(this.findProgramsInProgramContainer);

    // logging a single message allows us to take advantage of the duplicate log message suppression
    //   feature built-in to browser consoles
    if (BUILDTIME_ENV.DEBUG_MODE) {
      console.debug(
        `Found ${programContainers.length} containers:\n\t${programContainers.map((_pc, idx) => logPC(idx)).join("\n\t")}`
      );
    }

    return programs.flat();

    function logPC(idx: number) {
      const pc: ProgramContainer = programContainers[idx]!;
      const programsInPc: Program[] = programs[idx]!;
      const maxProgramTitles = 5;
      return `${pc.title} [${programsInPc.length}]: ${
        programsInPc
          .slice(0, maxProgramTitles)
          .map((p) => p.title)
          .join(", ") + (programsInPc.length > maxProgramTitles ? " ..." : "")
      }`;
    }
  }

  checkIMDBDataAlreadyAdded(program: Program): boolean {
    return !!(this.constructor as typeof AbstractPage).ProgramNode.getIMDBNode(
      program.node
    );
  }

  addIMDBData(program: Program, data: IMDBData) {
    const ratingNode = this.createIMDBDataNode(data);
    (this.constructor as typeof AbstractPage).ProgramNode.insertIMDBNode(
      program.node,
      ratingNode
    );
  }

  injectStyles() {
    const styleNode = document.createElement("style");
    styleNode.classList.add(IMDB_STYLE_NODE_CLASS);
    document.head.appendChild(styleNode);
  }

  findProgramContainerNodes(): HTMLElement[] {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  getTitleFromProgramContainerNode(_pContainerNode: HTMLElement): string {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line no-unused-vars
  findProgramsInProgramContainer(_pContainer: ProgramContainer): Program[] {
    throw new Error("Not implemented");
  }

  createIMDBDataNode(data: IMDBData): HTMLElement {
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
