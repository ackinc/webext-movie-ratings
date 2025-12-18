import AbstractPage from "../common/AbstractPage";
import { IMDB_STYLE_NODE_CLASS, IMDB_DATA_NODE_CLASS } from "../common";
import ProgramNode from "./ProgramNode";

export default class AppleTvPage extends AbstractPage {
  static ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`);
    styleNode.innerHTML = `
      a.${IMDB_DATA_NODE_CLASS} {
        color: var(--systemSecondary);
        margin-left: 4px;
      }
    `;
  }

  findProgramContainerNodes() {
    // user is on MLS (sports) page
    if (location.pathname.includes("/channel/mls")) return [];

    const selectors = ['div.section[aria-label]:not([aria-label=""])'];
    return Array.from(document.querySelectorAll(selectors.join(", ")));
  }

  getTitleFromProgramContainerNode(pContainerNode) {
    return pContainerNode.getAttribute("aria-label") ?? null;
  }

  isValidProgramContainer(pContainer) {
    if (["/movie/", "/show/"].some((x) => location.pathname.includes(x)))
      return pContainer.title === "Related";

    return true;
  }

  findProgramsInProgramContainer(pContainer) {
    const programNodes = Array.from(
      pContainer.node.querySelectorAll("ul > li a")
    );

    const programs = programNodes
      .map((node) => ({
        node,
        ...this.constructor.ProgramNode.extractData(node),
      }))
      .filter(({ title }) => !!title);

    return programs;
  }
}
