import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { CssClasses, ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import { climbDOMUntil } from "../utils";

export default class HuluPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();
  }

  protected override async injectStyles() {
    await super.injectStyles();

    const pageFontFamily = window
      .getComputedStyle(document.body)
      .getPropertyValue("font-family");

    const styleNode = document.querySelector(`style.${CssClasses.styleNode}`)!;
    styleNode.textContent += `
a.${CssClasses.imdbDataNode} {
  margin: 4px 0;
  color: #999999;
  display: block;
  font-family: ${pageFontFamily};
  font-size: 14px;
}

div.PortraitTile a.${CssClasses.imdbDataNode} {
  margin-top: 8px;
  color: white;
  font-weight: 400;
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    // live tv, live news, live sports
    if (location.pathname.startsWith("/live")) return [];

    if (location.pathname === "/hub/networks") return [];

    return [
      // home page
      "div.SimpleCollection",

      // tv shows page
      "div.PortraitCollection",

      // 'top 15 ...' page
      "div.GridCollection",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.SimpleCollection")) {
      return pContainerNode.querySelector(".SimpleCollection__title")!
        .textContent;
    }

    if (pContainerNode.matches("div.PortraitCollection")) {
      return pContainerNode.querySelector("a.PortraitCollection__title")!
        .textContent;
    }

    if (pContainerNode.matches("div.GridCollection")) {
      if (pContainerNode.parentElement?.matches("div.tab")) {
        const gp = pContainerNode.parentElement.parentElement!;
        const tabs = Array.from(gp.querySelectorAll("div.tab"));
        const curTabNum = tabs.indexOf(pContainerNode.parentElement!);

        const candidates = Array.from(
          climbDOMUntil(pContainerNode, (node) =>
            node.matches("div.tabs"),
          )?.querySelectorAll(".nav .nav-item") ?? [],
        ).map((node) => node.textContent);

        return candidates[curTabNum] ?? "";
      }
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (["episodes", "extras"].includes(pContainer.title.toLowerCase())) {
      return false;
    }

    return true;
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.SimpleCollection") {
      return ['div.Tile[data-automationid^="tile"]'];
    }

    if (selector === "div.PortraitCollection") {
      return ["div.PortraitTile"];
    }

    if (selector === "div.GridCollection") {
      return ['div.Tile[data-automationid^="tile"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
