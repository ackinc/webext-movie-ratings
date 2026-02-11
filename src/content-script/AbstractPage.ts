import AbstractProgramNode from "./AbstractProgramNode";
import type { ProgramContainer, Program, IMDBData } from "../common/types";
import {
  CssClasses,
  defaultProgramFilterSettings,
  downloadBlob,
  getIMDBLink,
  getSetting,
  omit,
  type ProgramFilterSettings,
  SettingsKey,
} from "../common";
import { makeFilteredOutProgramNodeStylesClause } from "./utils";

export default class AbstractPage {
  static ProgramNode = AbstractProgramNode;

  constructor() {
    this.checkIMDBDataAlreadyAdded = this.checkIMDBDataAlreadyAdded.bind(this);
    this.findProgramsInProgramContainer =
      this.findProgramsInProgramContainer.bind(this);
    this.isValidProgramContainer = this.isValidProgramContainer.bind(this);
  }

  async initialize() {
    await this.injectStyles();
    this.addDownloadCatalogButton();
  }

  cleanup() {
    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`);
    styleNode?.parentElement?.removeChild(styleNode);

    const dlCatalogBtn = document.querySelector(
      `button.${CssClasses.downloadCatalogBtn}`,
    );
    dlCatalogBtn?.parentElement?.removeChild(dlCatalogBtn);

    const programs = this.findPrograms();
    programs.forEach((p) => {
      p.node.classList.remove(CssClasses.filteredOutProgramNode);
      (this.constructor as typeof AbstractPage).ProgramNode.removeIMDBNode(
        p.node,
      );
    });
  }

  addDownloadCatalogButton() {
    const btn = document.createElement("button");
    btn.innerText = "Download catalog";
    btn.classList.add(CssClasses.downloadCatalogBtn);
    btn.addEventListener("click", () => {
      const programs = this.findPrograms().map((p) => omit(p, ["node"]));
      const dataStr = Array.from(new Set(programs.map((p) => p["title"])))
        .sort()
        .join("\n");
      const blob = new Blob([dataStr], { type: "text/plain" });
      downloadBlob(blob, "catalog.txt");
    });

    document.body.appendChild(btn);
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
        `Found ${programContainers.length} / ${programContainerNodes.length} \
valid containers:\n\t${programContainers
          .map((pc, idx) => logPC(pc, programs[idx]!))
          .join("\n\t")}`,
      );
    }

    // WARN
    // if there is a valid program container with 0 programs, there might have been a
    //   website markup change

    return programs.flat();

    function logPC(pc: ProgramContainer, programsInPc: Program[]) {
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
      program.node,
    );
  }

  addIMDBData(program: Program, data: IMDBData) {
    const ratingNode = this.createIMDBDataNode(data);
    (this.constructor as typeof AbstractPage).ProgramNode.insertIMDBNode(
      program.node,
      ratingNode,
    );
  }

  async injectStyles() {
    const filterSettings =
      ((await getSetting(SettingsKey.programFiltersSettings)) as
        | ProgramFilterSettings
        | undefined) ?? defaultProgramFilterSettings;

    const styleNode = document.createElement("style");
    styleNode.classList.add(CssClasses.styleNode);
    styleNode.innerHTML = `
      .${CssClasses.downloadCatalogBtn} {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 1000;
        height: 40px;
        background-color: white;
        padding: 4px 16px;
        color: black;
      }

      ${makeFilteredOutProgramNodeStylesClause(filterSettings)}
    `;
    document.head.appendChild(styleNode);
  }

  findProgramContainerNodes(): HTMLElement[] {
    throw new Error("Not implemented");
  }

  getTitleFromProgramContainerNode(_pContainerNode: HTMLElement): string {
    throw new Error("Not implemented");
  }

  isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    throw new Error("Not implemented");
  }

  findProgramsInProgramContainer(_pContainer: ProgramContainer): Program[] {
    throw new Error("Not implemented");
  }

  createIMDBDataNode(data: IMDBData): HTMLElement {
    const node = document.createElement("a");
    node.classList.add(CssClasses.imdbDataNode);
    node.dataset["imdbID"] = data.imdbID;
    node.dataset["imdbRating"] = data.imdbRating;
    if (data.imdbRating !== "N/F") {
      node.setAttribute("href", getIMDBLink(data.imdbID));
      node.setAttribute("target", "_blank");
    }
    if (["N/F"].includes(data.imdbRating)) {
      node.style.visibility = "hidden";
      node.style.display = "none";
    }
    node.innerText = `IMDb ${data.imdbRating === "N/A" ? "" : data.imdbRating}`;
    node.addEventListener("click", (e) => e.stopPropagation());
    return node;
  }
}
