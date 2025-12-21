import AbstractPage from "../common/AbstractPage";
import { IMDB_STYLE_NODE_CLASS, IMDB_DATA_NODE_CLASS } from "../common";
import type { ProgramContainer, Program } from "../common/types";
import ProgramNode from "./ProgramNode";

export default class AppleTvPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`)!;
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: var(--systemSecondary);
        margin-left: 4px;
      }
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    // user is on MLS (sports) page
    if (location.pathname.includes("/channel/mls")) return [];

    const selectors = ['div.section[aria-label]:not([aria-label=""])'];
    return Array.from(document.querySelectorAll(selectors.join(", ")));
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement
  ): string {
    return pContainerNode.getAttribute("aria-label") ?? "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    if (["/movie/", "/show/"].some((x) => location.pathname.includes(x)))
      return pContainer.title === "Related";

    return true;
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const programNodes: HTMLElement[] = Array.from(
      pContainer.node.querySelectorAll("ul > li a")
    );

    const ctor = this.constructor as typeof AppleTvPage;
    const programs: Program[] = programNodes
      .map((node) => {
        const extractedData = ctor.ProgramNode.extractData(node);
        let type: Program["type"];
        if (location.pathname.includes("/movie/")) {
          type = "movie";
        } else if (location.pathname.includes("/show/")) {
          type = "series";
        }

        return {
          node,
          ...(type ? { type } : {}),
          ...extractedData,
        };
      })
      .filter(({ title }) => !!title);

    return programs;
  }
}
