import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessage } from "../../common";
import type { Program, ProgramContainer, IMDBData } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class AppleTvPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
    await super.injectStyles();

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.innerHTML += `
a.${CssClasses.imdbDataNode} {
  color: var(--systemSecondary);
  margin-left: 4px;
}

ul > li button.epic-showcase-item .${CssClasses.imdbDataNode} {
  position: absolute;
  bottom: 10px;
  left: 12px;
  z-index: 1;
  margin: 0;
  color: white;
}

div.search-hint-lockup div[data-testid="search-hint-lockup-title"] {
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

div.search-hint-lockup div[data-testid="search-hint-lockup-title"] .${CssClasses.imdbDataNode} {
  flex-shrink: 0;
}

a.search-card.lockup .${CssClasses.imdbDataNode} {
  margin-left: 0;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    // user is on MLS (sports) page
    if (
      ["/channel/mls", "/channel/formula-1/"].some((x) =>
        location.pathname.includes(x),
      )
    )
      return [];

    return [
      'div.section[data-testid="section-container"]:has(div.header)',
      "ul.search-suggestions",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    let title: string;

    if (
      pContainerNode.matches('div.section[data-testid="section-container"]')
    ) {
      title = pContainerNode.querySelector(
        "div.header h2 span.dir-wrapper",
      )!.textContent;
    } else if (pContainerNode.matches("ul.search-suggestions")) {
      title = pContainerNode.getAttribute("aria-label")!;
    } else {
      throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
    }

    return title.trim();
  }

  protected override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    if (["/movie/", "/show/"].some((x) => location.pathname.includes(x)))
      return pContainer.title === "Related";

    if (["/person/"].some((x) => location.pathname.includes(x)))
      return pContainer.title !== "Guest Appearances";

    return Boolean(
      pContainer.title && !pContainer.title.startsWith("Live Sports"),
    );
  }

  protected override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;
    if (
      ['div.section[data-testid="section-container"]'].some((sel) =>
        node.matches(sel),
      )
    ) {
      return [
        "ul > li button.epic-showcase-item",
        "ul > li a.lockup",
        "ul > li div.lockup",
      ];
    }

    if (["ul.search-suggestions"].some((sel) => node.matches(sel))) {
      return ["div.search-hint-lockup"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  override checkIMDBDataAlreadyAdded(program: Program): boolean {
    if (program.node.matches("ul.search-suggestions div.search-hint-lockup")) {
      // search hints are updated in place; the html elems don't change as what's
      //   typed in the search bar changes; we may be looking at ratings that were
      //   added as hints for the previous contents of the search input
      return false;
    }

    return super.checkIMDBDataAlreadyAdded(program);
  }

  override addIMDBData(program: Program, data: IMDBData) {
    // see note about SEARCH_RESULTS_PREVIEW_PANE
    const isInSearchResultsPreviewPane = program.node.matches(
      "ul.search-suggestions div.search-hint-lockup",
    );
    if (isInSearchResultsPreviewPane) {
      (this.constructor as typeof AbstractPage).ProgramNode.removeIMDBNode(
        program.node,
      );
    }

    super.addIMDBData(program, data);
  }

  protected override getGeneralizedUrlPath(href: string): string {
    const retval = super.getGeneralizedUrlPath(href);

    const url = new URL(retval);
    if (
      ["/us/show/", "/us/movie/", "/us/person/", "/us/collection/"].some((x) =>
        url.pathname.startsWith(x),
      )
    ) {
      url.pathname = url.pathname.split("/").slice(0, 3).join("/") + "/:n";
    }

    return url.href;
  }
}
