import AbstractPage from "../AbstractPage";
import { ErrorMessage } from "../../common";
import type { Program, ProgramContainer } from "../../common/types";
import ProgramNode from "./ProgramNode";
import pageStyles from "./page.styles.css";
import { cssStyleSheetFromText } from "../utils";

export default class AppleTvPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheet = cssStyleSheetFromText(pageStyles);
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
      pContainerNode.matches(
        'div.section[data-testid="section-container"]:has(div.header)',
      )
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

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (["/movie/", "/show/"].some((x) => location.pathname.includes(x)))
      return pContainer.title === "Related";

    if (["/person/"].some((x) => location.pathname.includes(x)))
      return pContainer.title !== "Guest Appearances";

    return Boolean(
      pContainer.title && !pContainer.title.startsWith("Live Sports"),
    );
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (
      ['div.section[data-testid="section-container"]:has(div.header)'].includes(
        selector,
      )
    ) {
      return [
        "ul > li button.epic-showcase-item",
        "ul > li a.lockup",
        "ul > li div.lockup",
      ];
    }

    if (["ul.search-suggestions"].includes(selector)) {
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

  protected override getGeneralizedUrlPath(href: string): string {
    let retval = super.getGeneralizedUrlPath(href);

    if (
      ["/us/show/", "/us/movie/", "/us/person/", "/us/collection/"].some((x) =>
        retval.startsWith(x),
      )
    ) {
      retval = retval.split("/").slice(0, 3).join("/") + "/:n";
    }

    return retval;
  }
}
