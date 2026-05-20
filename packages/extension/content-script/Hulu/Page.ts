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

div.DetailEntityMasthead .${CssClasses.filteredOutProgramNode} {
  opacity: 1;
}

div.DetailEntityMasthead a.${CssClasses.imdbDataNode} {
  color: white;
}

div[data-testid="high-emphasis-tile"]  a.${CssClasses.imdbDataNode} {
  color: white;
  font-size: 18px;
}

div[data-testid="medium-emphasis-vertical-tile"] a.${CssClasses.imdbDataNode} {
  color: white;
  margin: 0;
  font-size: 12px;
}

div[data-testid="preview-panel"] a.${CssClasses.imdbDataNode} {
  color: white;
  display: inline;
}

div[data-testid="preview-panel"] a.${CssClasses.imdbDataNode}::after {
  content: ' • '
}

div.MastheadAndBanner a.${CssClasses.imdbDataNode} {
  display: inline;
  color: white;
  font-size: 12px;
}

div.MastheadAndBanner a.${CssClasses.imdbDataNode}::after {
  content: ' • ';
}
    `;
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    // live tv, live news, live sports
    if (["/live", "/hub/news"].some((x) => location.pathname.startsWith(x)))
      return [];

    if (location.pathname === "/hub/networks") return [];

    return [
      // home page
      "div.SimpleCollection",

      // tv shows page
      "div.PortraitCollection",

      // 'top 15 ...' page
      "div.GridCollection",

      // top of single-program page
      "div.DetailEntityMasthead",

      // post login home page
      'div[data-testid="masthead-collection-high-emphasis-tile"]',
      'div[data-testid="standard-collection-medium-emphasis-vertical-tile"]',
      'div[data-testid="standard-collection-simple-horizontal-tile"]',
      'div[data-testid="standard-collection-standard-emphasis-tile"]',
      'div[data-testid="branded-discover-collection-simple-horizontal-tile"]',

      // collection page
      'div[data-testid="l2-content"]',

      // on hovering over a program tile
      'div[data-testid="preview-panel-container"]',

      // my-stuff
      "div.MyStuff__collection",

      // single program page
      "div.MastheadAndBanner",
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

    if (pContainerNode.matches("div.DetailEntityMasthead")) {
      return "Billboard";
    }

    if (
      pContainerNode.matches(
        'div[data-testid="masthead-collection-high-emphasis-tile"]',
      )
    ) {
      return "Billboard";
    }

    if (
      [
        'div[data-testid="standard-collection-medium-emphasis-vertical-tile"]',
        'div[data-testid="standard-collection-simple-horizontal-tile"]',
        'div[data-testid="standard-collection-standard-emphasis-tile"]',
      ].some((sel) => pContainerNode.matches(sel))
    ) {
      return pContainerNode.querySelector(
        'h2[data-testid="CollectionHeader__title"]',
      )!.textContent;
    }

    if (
      pContainerNode.matches(
        'div[data-testid="branded-discover-collection-simple-horizontal-tile"]',
      )
    ) {
      return pContainerNode
        .querySelector('img[class*="BrandedDiscoverCollection_titleHeader"]')!
        .getAttribute("alt")!;
    }

    if (pContainerNode.matches('div[data-testid="l2-content"]')) {
      return pContainerNode.querySelector(
        'div[data-testid="simple-modal-nav-title"]',
      )!.textContent;
    }

    if (pContainerNode.matches('div[data-testid="preview-panel-container"]')) {
      return "Preview";
    }

    if (pContainerNode.matches("div.MyStuff__collection")) {
      return pContainerNode.querySelector(
        'h2[data-testid="my-stuff-collection-title"]',
      )!.textContent;
    }

    if (pContainerNode.matches("div.MastheadAndBanner")) {
      return "Single-program page Masthead";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    if (!Boolean(pContainer.title)) return false;

    if (
      [
        "all tv networks",
        "episodes",
        "extras",
        "genres",
        "networks for you",
      ].includes(pContainer.title.toLowerCase())
    ) {
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

    if (selector === "div.DetailEntityMasthead") {
      return ["div.DetailEntityMasthead__entity"];
    }

    if (
      selector === 'div[data-testid="masthead-collection-high-emphasis-tile"]'
    ) {
      return ['div[data-testid="high-emphasis-tile"'];
    }

    if (
      [
        'div[data-testid="standard-collection-medium-emphasis-vertical-tile"]',
        'div[data-testid="standard-collection-simple-horizontal-tile"]',
        'div[data-testid="standard-collection-standard-emphasis-tile"]',
      ].includes(selector)
    ) {
      return [
        'div[data-testid="medium-emphasis-vertical-tile"]',
        'div[data-testid="seh-tile-container"]',
      ];
    }

    if (
      selector ===
      'div[data-testid="branded-discover-collection-simple-horizontal-tile"]'
    ) {
      return ['div[data-testid="seh-tile-container"]'];
    }

    if (selector === 'div[data-testid="l2-content"]') {
      return ['div[data-testid="seh-tile-container"]'];
    }

    if (selector === 'div[data-testid="preview-panel-container"]') {
      return ['div[data-testid="preview-panel"]'];
    }

    if (selector === "div.MyStuff__collection") {
      return ['div[data-testid="my-stuff-tile"]'];
    }

    if (selector === "div.MastheadAndBanner") {
      return ['div[data-testid="masthead-content"]'];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
