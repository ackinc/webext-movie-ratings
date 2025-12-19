import AbstractPage from "../common/AbstractPage";
import ProgramNode from "./ProgramNode";
import { IMDB_DATA_NODE_CLASS, IMDB_STYLE_NODE_CLASS } from "../common";
import type { ProgramContainer, Program } from "../common/types";

export default class HotstarPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  override injectStyles() {
    super.injectStyles();

    const styleNode = document.querySelector(`style.${IMDB_STYLE_NODE_CLASS}`)!;
    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");
    styleNode.innerHTML = `
      div.swiper-slide > div:first-child {
        padding-bottom: 21px;
      }

      a.${IMDB_DATA_NODE_CLASS} {
        /* absolute positioning is needed to make this node 'extrude' outside the ancestor
             node that has the 'expand-onMouseEnter' event listener */
        position: absolute;
        color: #999999;
        display: block;
        font-family: ${pageFontFamily};
        font-size: 14px;
        font-weight: bold;
      }

      div[data-scale-down="true"] a.${IMDB_DATA_NODE_CLASS} {
        position: inherit;
        margin: 0 0 0 2px;
        color: var(--ON-SURFACE-ALT);
        font-size: 16px;
        font-weight: 500;
      }
    `;
  }

  override findProgramContainerNodes(): HTMLElement[] {
    return Array.from(document.querySelectorAll("div.tray-container"));
  }

  override getTitleFromProgramContainerNode(node: HTMLElement): string {
    if (
      (node.firstChild as HTMLElement)?.dataset["testid"] === "grid-container"
    ) {
      return (
        node.parentNode?.parentNode?.querySelector("div.headerSpace h4")
          ?.textContent ?? ""
      );
    }

    if (
      (node.parentNode?.parentNode?.parentNode as HTMLElement)?.dataset[
        "testid"
      ] === "scroll-section-More Like This"
    ) {
      return "More Like This";
    }

    return (
      (node.firstChild as HTMLElement)?.querySelector("h2")?.textContent ?? ""
    );
  }

  override isValidProgramContainer({ title }: ProgramContainer): boolean {
    return Boolean(
      title &&
      !["Popular Languages", "Popular Genres", "Popular Channels"].includes(
        title
      )
    );
  }

  override findProgramsInProgramContainer(
    pContainer: ProgramContainer
  ): Program[] {
    const { node } = pContainer;
    const ctor = this.constructor as typeof HotstarPage;

    const programNodes = (
      Array.from(
        node.querySelectorAll('div[data-testid="tray-card-default"]')
      ) as HTMLElement[]
    ).filter(ctor.ProgramNode.isMovieOrSeries);
    const programs = programNodes
      .map((node) => ({
        node,
        ...ctor.ProgramNode.extractData(node),
      }))
      // drop program nodes for which data extraction failed
      .filter(({ title, type }) => title && type);
    return programs;
  }
}
