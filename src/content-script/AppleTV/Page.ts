import AbstractPage from "../AbstractPage";
import { CssClasses, ErrorMessages } from "../../common";
import type { ProgramContainer } from "../../common/types";
import ProgramNode from "./ProgramNode";

export default class AppleTvPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override async injectStyles() {
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

  override getProgramContainerNodeSelectors(): string[] {
    // user is on MLS (sports) page
    if (location.pathname.includes("/channel/mls")) return [];

    return [
      'div.section[data-testid="section-container"]',
      "ul.search-suggestions",
    ];
  }

  override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (
      pContainerNode.matches('div.section[data-testid="section-container"]')
    ) {
      return (
        pContainerNode.querySelector("div.header h2 span.dir-wrapper")
          ?.textContent ?? ""
      );
    }

    return pContainerNode.getAttribute("aria-label") ?? "";
  }

  override isValidProgramContainer(pContainer: ProgramContainer): boolean {
    if (["/movie/", "/show/"].some((x) => location.pathname.includes(x)))
      return pContainer.title === "Related";

    if (["/person/"].some((x) => location.pathname.includes(x)))
      return pContainer.title !== "Guest Appearances";

    return Boolean(pContainer.title);
  }

  override getProgramNodeSelectors(pContainer: ProgramContainer): string[] {
    const { node } = pContainer;
    if (
      ['div.section[data-testid="section-container"]'].some((sel) =>
        node.matches(sel),
      )
    ) {
      return [
        "ul > li button.epic-showcase-item",
        "ul > li a.lockup,ul > li div.lockup",
      ];
    }

    if (["ul.search-suggestions"].some((sel) => node.matches(sel))) {
      return ["div.search-hint-lockup"];
    }

    throw new Error(ErrorMessages.unrecognizedProgramContainer);
  }
}
