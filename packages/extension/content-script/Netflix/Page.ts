import AbstractPage from "../AbstractPage";
import ProgramNode from "./ProgramNode";
import { ErrorMessage } from "../../common";
import type { ProgramContainer } from "../../common/types";
import pageStyles from "./page.styles.css";

export default class NetflixPage extends AbstractPage {
  static override ProgramNode = ProgramNode;

  constructor() {
    super();

    this.stylesheets.page.replaceSync(pageStyles);
  }

  protected override getProgramContainerNodeSelectors(): string[] {
    return [
      "div.billboard",
      "div.lolomoRow:not(.lolomoPreview)",
      "div.titleGroup--wrapper",
      "div.moreLikeThis--wrapper",
      "div.gallery",
      'section[data-uia="search-gallery"]',

      // 2026-05-14
      'div:has(> section[data-uia="billboard"])',
      "section.carousel-row:not(#place-holder-carousel)",
      "div.previewModal--wrapper.mini-modal:has(> div.previewModal--container)",
      "div.previewModal--wrapper:not(.mini-modal):has(> div.previewModal--container)",
    ];
  }

  protected override getTitleFromProgramContainerNode(
    pContainerNode: HTMLElement,
  ): string {
    if (pContainerNode.matches("div.billboard")) {
      return "Billboard";
    }

    if (pContainerNode.matches("div.lolomoRow:not(.lolomoPreview)")) {
      return (
        pContainerNode.querySelector(":scope > h2 div.row-header-title")
          ?.textContent ??
        pContainerNode.querySelector(":scope > h2.rowTitle")!.textContent
      );
    }

    if (pContainerNode.matches("div.titleGroup--wrapper")) {
      return pContainerNode.querySelector(".titleGroup--header")!.textContent;
    }

    if (pContainerNode.matches("div.moreLikeThis--wrapper")) {
      return pContainerNode.querySelector(":scope > h3.moreLikeThis--header")!
        .textContent;
    }

    if (pContainerNode.matches("div.gallery")) {
      const pContainerParent = pContainerNode.parentNode as HTMLElement;

      if (pContainerParent.matches('div[data-uia="modal-content-wrapper"]')) {
        return pContainerNode.previousElementSibling!.textContent;
      } else if (location.href.includes("/browse/person")) {
        // netflix sometimes takes a while to add the title node to the DOM,
        //   and not using optional-chaining below was resulting in
        //   DataExtractionErrors
        return (
          pContainerNode.parentElement!.previousElementSibling!.querySelector(
            "div.sub-header div.personHeader span.title",
          )?.textContent ?? ""
        );
      } else if (location.href.includes("/browse/my-list")) {
        return (
          pContainerParent.previousElementSibling!.querySelector("div.title")
            ?.textContent ?? ""
        );
      } else {
        return pContainerParent.previousElementSibling!.querySelector(
          "div.aro-genre-details > span.genreTitle",
        )!.textContent;
      }
    }

    if (pContainerNode.matches('section[data-uia="search-gallery"]')) {
      return "Search results";
    }

    if (pContainerNode.matches('div:has(> section[data-uia="billboard"])')) {
      return "Billboard";
    }

    if (
      pContainerNode.matches("section.carousel-row:not(#place-holder-carousel)")
    ) {
      return (pContainerNode.firstChild as HTMLElement).querySelector("p")!
        .textContent;
    }

    if (
      pContainerNode.matches(
        "div.previewModal--wrapper.mini-modal:has(> div.previewModal--container)",
      )
    ) {
      return "Preview modal (mini)";
    }

    if (
      pContainerNode.matches(
        "div.previewModal--wrapper:not(.mini-modal):has(> div.previewModal--container)",
      )
    ) {
      return "Preview modal";
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }

  protected override isValidProgramContainer(
    pContainer: ProgramContainer,
  ): boolean {
    return Boolean(pContainer.title) && !pContainer.title.startsWith("WWE:");
  }

  protected override getProgramNodeSelectors({
    selector,
  }: Pick<ProgramContainer, "selector">): string[] {
    if (selector === "div.billboard") {
      return ["div.info.meta-layer"];
    }

    if (
      [
        "div.lolomoRow:not(.lolomoPreview)",
        "div.titleGroup--wrapper",
        "div.gallery",
      ].includes(selector)
    ) {
      return ["div.title-card-container", "div.titleCard--container"];
    }

    if (selector === "div.moreLikeThis--wrapper") {
      return ["div.titleCard--container"];
    }

    if (selector === 'section[data-uia="search-gallery"]') {
      return ['a[data-uia="search-gallery-video-card"][aria-label]'];
    }

    if (selector === 'div:has(> section[data-uia="billboard"])') {
      return ['section[data-uia="billboard"]'];
    }

    if (selector === "section.carousel-row:not(#place-holder-carousel)") {
      return [
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="standard-card"])',
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="progress-card"])',
        'div[data-uia="carousel-scroller"] div:has(> a[data-uia="ranked-card"])',
      ];
    }

    if (
      selector ===
      "div.previewModal--wrapper.mini-modal:has(> div.previewModal--container)"
    ) {
      return ["div.previewModal--container.mini-modal"];
    }

    if (
      selector ===
      "div.previewModal--wrapper:not(.mini-modal):has(> div.previewModal--container)"
    ) {
      return ["div.previewModal--container:not(.mini-modal)"];
    }

    throw new Error(ErrorMessage.unrecognizedProgramContainerNode);
  }
}
