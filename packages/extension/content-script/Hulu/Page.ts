import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";

export default class HuluPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    // live tv, live news, live sports
    if (["/live", "/hub/news"].some((x) => location.pathname.startsWith(x)))
      return [];

    if (location.pathname === "/hub/networks") return [];

    return [
      // home page
      "div.StandardSliderCollectionSimple",

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

      // collection page, single-program page
      "div.AllUpGrid",

      // on hovering over a program tile
      'div[data-testid="preview-panel-container"]',

      // my-stuff
      "div.MyStuff__collection",

      // single program page
      "div.MastheadAndBanner",

      // search page
      'div[data-testid="search-results-tray"]',
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.StandardSliderCollectionSimple")) {
      return pContainerNode.querySelector(
        'h2[data-testid="CollectionHeader__title"]',
      )!.textContent;
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
          pContainerNode
            .closest("div.tabs")
            ?.querySelectorAll(".nav .nav-item") ?? [],
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

    if (pContainerNode.matches("div.AllUpGrid")) {
      const apexNode = pContainerNode.closest('div[data-testid="l2-content"]')!;

      // single-program page
      const activeSubnavButton = apexNode.querySelector(
        "div.Subnav button.Subnav__item.active",
      );
      if (activeSubnavButton) return activeSubnavButton.textContent;

      // collection page
      return apexNode.querySelector(
        'div [data-testid="simple-modal-nav-title"]',
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

    if (pContainerNode.matches('div[data-testid="search-results-tray"]')) {
      return pContainerNode.querySelector(
        'h2[data-testid="CollectionHeader__title"]',
      )!.textContent;
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
    if (selector === "div.StandardSliderCollectionSimple") {
      return [
        'div[data-testid="seh-tile-container"]',
        'div[data-testid="medium-emphasis-vertical-tile"]',
      ];
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

    if (selector === "div.AllUpGrid") {
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

    if (selector === 'div[data-testid="search-results-tray"]') {
      return [
        'div[data-testid="seh-tile-container"]',
        'figure[data-testid$="-standard-tile"]',
      ];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
