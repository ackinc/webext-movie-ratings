import AbstractProgramNode from "./AbstractProgramNode";
import type {
  ProgramContainer,
  Program,
  IMDBData,
  Selector,
  UrlPath,
} from "../common/types";
import {
  CssClasses,
  defaultProgramFilterSettings,
  getGeneralizedUrlPath,
  getIMDBLink,
  getSetting,
  type ProgramFilterSettings,
  SettingsKey,
  selectorFailureThreshold,
} from "../common";
import {
  getSelectorStatusForCurrentSite,
  makeFilteredOutProgramNodeStylesClause,
  setSelectorStatusForCurrentSite,
} from "./utils";
import { captureException } from "../common/errorReporter";
import { limitConcurrency } from "rate-limit-utils";

export default class AbstractPage {
  static ProgramNode = AbstractProgramNode;
  #isMarkedForCleanup: boolean = false;

  constructor() {
    this.checkIMDBDataAlreadyAdded = this.checkIMDBDataAlreadyAdded.bind(this);
    this.findProgramNodesInProgramContainer =
      this.findProgramNodesInProgramContainer.bind(this);
    this.isValidProgramContainer = this.isValidProgramContainer.bind(this);
    this.isValidProgramNode = this.isValidProgramNode.bind(this);
    this.isValidProgram = this.isValidProgram.bind(this);

    // we want callers to be able to call this method without awaiting it as it may
    //   cause performance issues since it is called many times in the hot path
    //   of findProgramContainerNodes and findProgramNodesInProgramContainer
    this.updateSelectorStatuses = limitConcurrency(
      this.updateSelectorStatuses.bind(this),
      1,
    );
  }

  async initialize() {
    await Promise.all([this.injectStyles(), this.pruneOutdatedSelectors()]);
  }

  cleanup() {
    this.#isMarkedForCleanup = true;

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`);
    styleNode?.parentElement?.removeChild(styleNode);

    const programs = this.findPrograms();
    programs.forEach((p) => {
      p.node.classList.remove(CssClasses.filteredOutProgramNode);
      (this.constructor as typeof AbstractPage).ProgramNode.removeIMDBNode(
        p.node,
      );
    });
  }

  findPrograms(): Program[] {
    const programContainerNodes = this.findProgramContainerNodes();
    const programContainers = programContainerNodes
      .map(([node, selector]) => ({
        title: this.getTitleFromProgramContainerNode(node),
        node,
        selector,
      }))
      .filter(this.isValidProgramContainer);

    const programNodesPerPC = programContainers.map(
      this.findProgramNodesInProgramContainer,
    );
    const ctor = this.constructor as typeof AbstractPage;
    const programsPerPC = programNodesPerPC.map((nodes) =>
      nodes
        .map((node) => ({ node, ...ctor.ProgramNode.extractData(node) }))
        .filter(this.isValidProgram),
    );

    // logging a single message allows us to take advantage of the duplicate log message suppression
    //   feature built-in to browser consoles
    if (BUILDTIME_ENV.DEBUG_MODE) {
      console.debug(
        `Found ${programContainers.length} / ${programContainerNodes.length} \
valid containers:\n\t${programContainers
          .map((pc, idx) => logPC(pc, programsPerPC[idx]!))
          .join("\n\t")}`,
      );
    }

    // WARN
    // if there is a valid program container with 0 programs, there might have been a
    //   website markup change

    return programsPerPC.flat();

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
    styleNode.innerHTML =
      makeFilteredOutProgramNodeStylesClause(filterSettings);
    document.head.appendChild(styleNode);
  }

  findProgramContainerNodes(): [HTMLElement, Selector][] {
    const selectors = this.getProgramContainerNodeSelectors();
    const results = selectors.map((s) =>
      Array.from(document.querySelectorAll<HTMLElement>(s)),
    );

    if (!this.#isMarkedForCleanup) {
      this.updateSelectorStatuses(selectors, results);
    }

    return results
      .map((nodes, i) =>
        nodes.map((node) => [node, selectors[i]] as [HTMLElement, Selector]),
      )
      .flat();
  }

  getProgramContainerNodeSelectors(): string[] {
    throw new Error("Not implemented");
  }

  getTitleFromProgramContainerNode(_pContainerNode: HTMLElement): string {
    throw new Error("Not implemented");
  }

  isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    throw new Error("Not implemented");
  }

  isValidProgramNode(_pNode: HTMLElement): boolean {
    return true;
  }

  isValidProgram(program: Program): boolean {
    return !!program.title;
  }

  // NOTE: when implementing this in a subclass, ensure every selector appearing
  //   in getProgramContainerNodeSelectors is covered
  getProgramNodeSelectors(_pContainer: ProgramContainer): string[] {
    throw new Error("Not implemented");
  }

  findProgramNodesInProgramContainer(
    pContainer: ProgramContainer,
  ): HTMLElement[] {
    const selectors = this.getProgramNodeSelectors(pContainer);
    const results = selectors.map((sel) =>
      Array.from(pContainer.node.querySelectorAll<HTMLElement>(sel)),
    );

    if (!this.#isMarkedForCleanup) {
      this.updateSelectorStatuses(
        selectors.map((sel) => `${pContainer.selector} ${sel}`),
        results,
      );
    }

    return results.flat().filter(this.isValidProgramNode);
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

  async updateSelectorStatuses(selectors: string[], results: HTMLElement[][]) {
    const selectorStatusForSite = await getSelectorStatusForCurrentSite();
    const pathname = getGeneralizedUrlPath(window.location.href);
    if (!selectorStatusForSite[pathname]) selectorStatusForSite[pathname] = {};
    const selectorStatusForPathname = selectorStatusForSite[pathname];

    selectors.forEach((sel, i) => {
      const nodes = results[i]!;
      if (nodes.length > 0) {
        selectorStatusForPathname[sel] = "active";
      } else if (!(sel in selectorStatusForPathname)) {
        // no nodes were found for this selector, and none were expected
        //   anyway
      } else if (selectorStatusForPathname[sel] === "probablyOutOfDate") {
        // no nodes were found for this selector, but it is already marked
        //   out-of-date, so nothing to do
      } else if (selectorStatusForPathname[sel] === "active") {
        // start the failure count
        selectorStatusForPathname[sel] = 1;
      } else if (selectorStatusForPathname[sel]! < selectorFailureThreshold) {
        ++selectorStatusForPathname[sel]!;
      } else {
        selectorStatusForPathname[sel] = "probablyOutOfDate";

        // failure threshold has been reached; an error should be captured
        captureException(
          new Error(
            `Potentially out of date selector: ${JSON.stringify({ pathname, selector: sel })}`,
          ),
        );
      }
    });

    await setSelectorStatusForCurrentSite(selectorStatusForSite);
  }

  // selectors should only ever be abandoned for a particular pathname,
  //   not site-wide, since a selector that stops working for one page
  //   may still be active on another page of the same site
  getAbandonedSelectors(): Record<UrlPath, Selector[]> {
    return {};
  }

  async pruneOutdatedSelectors() {
    const status = await getSelectorStatusForCurrentSite();
    const abandoned = this.getAbandonedSelectors();
    Object.entries(abandoned).forEach(([pathname, selectors]) =>
      selectors.forEach((s) => delete status[pathname]![s]),
    );
    await setSelectorStatusForCurrentSite(status);
  }
}
