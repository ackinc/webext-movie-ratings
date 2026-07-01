import { h, render } from "preact";
import AbstractProgramNode from "./AbstractProgramNode";
import type {
  ProgramContainer,
  ProgramContainerData,
  Program,
  ProgramData,
  IMDBData,
  Message,
  Selector,
  SWMessageResponse,
  UrlPath,
  CachedIMDBData,
} from "../common/types";
import {
  browser,
  CssClasses,
  defaultProgramFilterSettings,
  getGeneralizedUrlPath,
  getSetting,
  ErrorMessage,
  ensureError,
  MessageType,
} from "../common";
import {
  cssStyleSheetFromText,
  getSelectorStatusForCurrentSite,
  getFopnCssRules,
  setSelectorStatusForCurrentSite,
} from "./utils";
import { DataExtractionError, SWError } from "../common/customErrors";
import { captureException } from "../common/errorReporter";
import { addSidecar, removeSidecar } from "./sidecar";
import ImdbDataNode from "./ImdbDataNode";
import { limitConcurrency } from "rate-limit-utils";
import imdbNodeStyles from "./imdbDataNode.styles.css";

export default class AbstractPage {
  static ProgramNode = AbstractProgramNode;

  inSelectProgramMode: boolean = false;
  stylesheets: Record<"page" | "imdbNode", CSSStyleSheet> = {
    imdbNode: cssStyleSheetFromText(imdbNodeStyles),
    // should be overridden/replaced in constructor of concrete subclasses
    page: new CSSStyleSheet(),
  };

  #ctor = this.constructor as typeof AbstractPage;

  // Caching these allows us to avoid a `findPrograms` call inside `cleanup`,
  //   which has the following benefits:
  // 1. It makes the cleanup operation faster, which is valuable because when
  //   the extension is updated, there is a race between the cleanup operation
  //   of the now-outdated ISOCS and the initialization of the new ISOCS
  // 2. During development, if cleanup calls findPrograms without the
  //   'swallowDataExtractionErrors' option set, deploying an update to fix
  //   a DataExtractionError will cause that very same DataExtractionError to be
  //   logged (spuriously) during the old ISOCS' cleanup operation, which can be
  //   confusing
  foundPrograms: Program[] = [];

  constructor() {
    this.checkIMDBDataAlreadyAdded = this.checkIMDBDataAlreadyAdded.bind(this);
    this.isValidProgramContainer = this.isValidProgramContainer.bind(this);
    this.isValidProgram = this.isValidProgram.bind(this);
  }

  async initialize() {
    await Promise.all([this.injectStyles(), this.#pruneOutdatedSelectors()]);
    return this;
  }

  cleanup() {
    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`);
    styleNode?.parentElement?.removeChild(styleNode);

    while (this.foundPrograms.length > 0) {
      const p = this.foundPrograms.pop()!;
      p.node.classList.remove(CssClasses.filteredOutProgramNode);
      this.#ctor.ProgramNode.removeIMDBNode(p.node);
    }

    if (this.inSelectProgramMode) this.toggleSelectProgramMode();
  }

  findPrograms({
    swallowDataExtractionErrors = false,
  }: { swallowDataExtractionErrors?: boolean } = {}): Program[] {
    const programContainerNodes = this.#findProgramContainerNodes();
    const programContainers = programContainerNodes
      .map(dataExtractionErrorHandlingWrapper(this.#createProgramContainer))
      .filter((x) => !!x)
      .filter(this.isValidProgramContainer);

    const programNodesPerPC = programContainers.map(
      this.#findProgramNodesInProgramContainer,
    );
    const programsPerPC = programNodesPerPC.map((nodes) =>
      nodes
        .map(dataExtractionErrorHandlingWrapper(this.#createProgram))
        .filter((x) => !!x)
        .filter(this.isValidProgram),
    );

    // logging a single message allows us to take advantage of the duplicate log message suppression
    //   feature built-in to browser consoles
    if (APP_ENV !== "production") {
      console.debug(
        `Found ${programContainers.length} / ${programContainerNodes.length} \
valid containers:\n\t${programContainers
          .map((pc, idx) => logPC(pc, programsPerPC[idx]!))
          .join("\n\t")}`,
      );
    }

    this.foundPrograms = programsPerPC.flat();
    return this.foundPrograms;

    function logPC(pc: ProgramContainer, programsInPc: Program[]) {
      const maxProgramTitles = 5;
      return `${pc.title} [sel: ${pc.selector}] [${programsInPc.length}]: ${
        programsInPc
          .slice(0, maxProgramTitles)
          .map((p) => p.title)
          .join(", ") + (programsInPc.length > maxProgramTitles ? " ..." : "")
      }`;
    }

    function dataExtractionErrorHandlingWrapper<
      T extends { node: HTMLElement; selector: string },
      R extends T,
    >(fn: (arg: T) => R) {
      return (arg: T) => {
        try {
          return fn(arg);
        } catch (e) {
          ensureError(e);

          const err = DataExtractionError.from(e, arg.node, arg.selector);
          if (!err.__fromCache) captureException(err);

          if (swallowDataExtractionErrors) return null;

          throw err;
        }
      };
    }
  }

  #createProgramContainer = (
    arg: Omit<ProgramContainer, keyof ProgramContainerData>,
  ): ProgramContainer => ({
    ...arg,
    title: this.getTitleFromProgramContainerNode(arg.node),
  });

  #createProgram = (arg: Omit<Program, keyof ProgramData>): Program => ({
    ...arg,
    ...this.#ctor.ProgramNode.extractProgramData(arg.node),
  });

  checkIMDBDataAlreadyAdded(program: Program): boolean {
    const imdbNode = this.#ctor.ProgramNode.getIMDBNode(program.node);

    return Boolean(
      imdbNode &&
      !(
        "expiry" in imdbNode.dataset &&
        +imdbNode.dataset["expiry"]! <= +new Date()
      ),
    );
  }

  addIMDBData(program: Program, data: IMDBData) {
    // remove existing node (no-op if doesn't exist)
    this.#ctor.ProgramNode.removeIMDBNode(program.node);

    const ratingNode = this.createIMDBDataNode(program, data);
    this.#ctor.ProgramNode.insertIMDBNode(program.node, ratingNode);
  }

  protected async injectStyles() {
    const filterSettings =
      (await getSetting("programFiltersSettings")) ??
      defaultProgramFilterSettings;

    const styleNode = document.createElement("style");
    styleNode.classList.add(CssClasses.styleNode);
    styleNode.textContent =
      [
        ...getFopnCssRules(filterSettings),
        ...Array.from(this.stylesheets.page.cssRules).map((r) => r.cssText),
      ].join("\n") + "\n";
    document.head.appendChild(styleNode);
  }

  #findProgramContainerNodes(): Omit<
    ProgramContainer,
    keyof ProgramContainerData
  >[] {
    const selectors = this.getProgramContainerNodeSelectors();
    const results = selectors.map((s) =>
      Array.from(document.querySelectorAll<HTMLElement>(s)),
    );

    this.#updateSelectorStatuses(selectors, results).catch((e) => {
      if (e.message?.startsWith("Extension context invalidated")) return;
      captureException(e);
    });

    return results
      .map((nodes, i) =>
        nodes.map((node) => ({ node, selector: selectors[i]! })),
      )
      .flat();
  }

  protected getProgramContainerNodeSelectors(): string[] {
    throw new Error("Not implemented");
  }

  protected getTitleFromProgramContainerNode(
    _pContainerNode: HTMLElement,
  ): string {
    throw new Error("Not implemented");
  }

  protected isValidProgramContainer(_pContainer: ProgramContainer): boolean {
    // on some sites, a pContainer is valid even if it doesn't have a title
    return true;
  }

  protected isValidProgram(program: Program): boolean {
    return !!program.title;
  }

  // NOTE: when implementing this in a subclass, ensure every selector appearing
  //   in getProgramContainerNodeSelectors is covered
  protected getProgramNodeSelectors(
    _pContainerLike: Pick<ProgramContainer, "selector">,
  ): string[] {
    throw new Error("Not implemented");
  }

  #findProgramNodesInProgramContainer = (
    pContainer: ProgramContainer,
  ): Omit<Program, keyof ProgramData>[] => {
    const selectors = this.getProgramNodeSelectors(pContainer);
    const results = selectors.map((sel) =>
      Array.from(pContainer.node.querySelectorAll<HTMLElement>(sel)).filter(
        this.#ctor.ProgramNode.isMovieOrSeries,
      ),
    );

    this.#updateSelectorStatuses(
      selectors.map((sel) => `${pContainer.selector} ${sel}`),
      results,
    ).catch((e) => {
      if (e.message?.startsWith("Extension context invalidated")) return;
      captureException(e);
    });

    return results
      .map((nodes, idx) =>
        nodes.map((node) => ({
          node,
          selector: `${pContainer.selector} ${selectors[idx]}`,
          container: pContainer,
        })),
      )
      .flat();
  };

  protected createIMDBDataNode(
    program: Program,
    data: IMDBData,
    className: string = "",
  ): HTMLElement {
    const node = document.createElement("div");

    node.classList.add(CssClasses.imdbDataNode);

    node.dataset["imdbId"] = data.imdbId;
    node.dataset["imdbRating"] = String(data.imdbRating);
    if ("expiry" in data) node.dataset["expiry"] = String(data.expiry);

    const shadowRoot = node.attachShadow({ mode: "open" });
    shadowRoot.adoptedStyleSheets = [
      this.stylesheets.imdbNode,
      this.stylesheets.page,
    ];
    render(h(ImdbDataNode, { className, program, imdbData: data }), shadowRoot);

    return node;
  }

  /* methods dealing with outdated-selector-detection */

  // this async method is called many times in the hot path of findPrograms
  //   without being awaited; concurrent executions will interfere with
  //   each other, since they will read from and write to the same storage
  //   area; limiting concurrency to 1 effectively makes it synchronous,
  //   but also allows the hot path to continue without waiting for it to
  //   complete, which should help with performance as perceived by the
  //   extension user
  #updateSelectorStatuses = limitConcurrency(
    async (selectors: string[], results: HTMLElement[][]) => {
      if (APP_ENV !== "testing") return;

      const outdatedSelectorDetectionEnabled = await getSetting(
        "outdatedSelectorDetectionEnabled",
      );
      if (!outdatedSelectorDetectionEnabled) return;

      const selectorStatusForSite = await getSelectorStatusForCurrentSite();
      const pathname = this.getGeneralizedUrlPath(window.location.href);
      if (!selectorStatusForSite[pathname])
        selectorStatusForSite[pathname] = {};
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
        } else /* selectorStatusForPathname[sel] === "active" */ {
          selectorStatusForPathname[sel] = "probablyOutOfDate";
          captureException(
            new Error(
              ErrorMessage.potentiallyOutOfDateSelector +
                ` on ${window.location.hostname}`,
            ),
            { tags: { pathname, selector: sel } },
          );
        }
      });

      await setSelectorStatusForCurrentSite(selectorStatusForSite);
    },
    1,
  );

  // selectors should only ever be abandoned for a particular location.pathname,
  //   not site-wide, since a selector that stops working for one page
  //   may still be active on another page of the same site
  protected getAbandonedSelectors(): Record<UrlPath, Selector[]> {
    return {};
  }

  async #pruneOutdatedSelectors() {
    const status = await getSelectorStatusForCurrentSite();
    const abandoned = this.getAbandonedSelectors();
    Object.entries(abandoned).forEach(([pathname, selectors]) =>
      selectors.forEach((s) => delete status[pathname]![s]),
    );
    await setSelectorStatusForCurrentSite(status);
  }

  protected getGeneralizedUrlPath(href: string): string {
    return getGeneralizedUrlPath(href);
  }

  /* methods dealing with the "select-program-mode" debugging tool */

  toggleSelectProgramMode() {
    if (this.inSelectProgramMode) {
      document.body.removeEventListener("click", this.#showProgramInfo, {
        capture: true,
      });
      document.body.removeEventListener(
        "keyup",
        this.#exitSelectProgramModeOnEsc,
        true,
      );

      this.#removeSelectProgramModeNotification();
      this.inSelectProgramMode = false;

      // IMPORTANT: sidecar must be mounted *after* this.inSelectProgramMode
      //   has been inverted
      addSidecar({ page: this });
    } else {
      removeSidecar();
      this.#addSelectProgramModeNotification();

      document.body.addEventListener(
        "keyup",
        this.#exitSelectProgramModeOnEsc,
        true,
      );
      document.body.addEventListener("click", this.#showProgramInfo, {
        capture: true,
      });
      this.inSelectProgramMode = true;
    }
  }

  #exitSelectProgramModeOnEsc = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code !== "Escape") return;
    this.toggleSelectProgramMode();
  };

  #addSelectProgramModeNotification = () => {
    document.body.appendChild(this.#createSelectProgramNodeNotification());
  };

  #removeSelectProgramModeNotification = () => {
    const elem = document.body.querySelector(
      ":scope > .sift-select-program-mode",
    );
    if (elem) document.body.removeChild(elem);
  };

  #createSelectProgramNodeNotification(): HTMLDivElement {
    const elem = document.createElement("div");
    elem.innerText = "Esc to exit ...";
    elem.classList.add("sift-select-program-mode");
    elem.style = `
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 1000;
      background-color: white;
      color: black;
      padding: 12px 24px;
    `;
    return elem;
  }

  #showProgramInfo = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const allProgramContainerSelectors =
      this.getProgramContainerNodeSelectors();
    const allProgramNodeSelectors = allProgramContainerSelectors.flatMap(
      (pcNodeSel) =>
        this.getProgramNodeSelectors({ selector: pcNodeSel }).map(
          (pNodeSel) => `${pcNodeSel} ${pNodeSel}`,
        ),
    );

    const { node: programNode, selector: matchingSelector } =
      findAncestor(e.target as Element, allProgramNodeSelectors) ?? {};
    if (!programNode) {
      console.log(`No program node found at that location`);
      return;
    }

    const program = this.#createProgram({
      container: this.#createProgramContainer(
        findAncestor(programNode, allProgramContainerSelectors)!,
      ),
      node: programNode,
      selector: matchingSelector!,
    });
    console.log(program);

    const response = await browser.runtime.sendMessage<
      Message,
      SWMessageResponse<CachedIMDBData>
    >({
      type: MessageType.fetchCachedIMDBRating,
      data: { program, pageUrl: location.href },
    });

    if ("error" in response) throw new SWError(response.error);
    console.log(response.data);

    function findAncestor(startEl: Element, selectors: string[]) {
      const node = startEl.closest<HTMLElement>(selectors.join(","));
      return node
        ? { node, selector: selectors.find((sel) => node.matches(sel))! }
        : null;
    }
  };
}
