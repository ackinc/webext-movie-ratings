import { render } from "preact";
import { CssClasses, type IndexedImdbTitle, type Program } from "@common";
import SuggestedMatchesModal from "./SuggestedMatchesModal";
import smModalStyles from "./suggestedMatchesModal.styles.css";
import { cssStyleSheetFromText } from "../utils";

const classname = "suggested-matches-modal";
const stylesheet = cssStyleSheetFromText(smModalStyles);

export function showSuggestedMatchesModal(
  program: Program,
  id: number,
  token: string | undefined,
  matchedImdbTitle: IndexedImdbTitle | undefined,
  suggestedAlternatives: IndexedImdbTitle[],
) {
  const portal = document.querySelector(`.${CssClasses.portal}`)!;
  const shadowRoot = portal.shadowRoot!;
  if (shadowRoot.adoptedStyleSheets.indexOf(stylesheet) === -1) {
    shadowRoot.adoptedStyleSheets.push(stylesheet);
  }

  render(
    <SuggestedMatchesModal
      className={classname}
      program={program}
      id={id}
      token={token}
      matchedImdbTitle={matchedImdbTitle}
      suggestedAlternatives={suggestedAlternatives}
    />,
    portal.shadowRoot!,
  );
}

export function hideSuggestedMatchesModal() {
  const portal = document.querySelector(`.${CssClasses.portal}`)!;
  const container = portal.shadowRoot!.querySelector(`.${classname}`);
  if (container) {
    // simply removing the container with `container.parentNode.removeChild`
    //   causes problems the next time showSuggestedMatchesModal is called
    render(null, portal.shadowRoot!);
  }
}
