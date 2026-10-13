import cx from "classnames";
import { useEffect } from "preact/hooks";
import { type IndexedImdbTitle } from "siftcore";
import { CssClasses, type Program } from "@common";
import siftLogoIcon from "@images/logo48.png";
import MatchesList from "./SuggestedMatchesList";
import { hideSuggestedMatchesModal } from ".";

interface SuggestedMatchesModalProps {
  className?: string;
  id: number;
  token: string | undefined;
  program: Program;
  matchedImdbTitle: IndexedImdbTitle | undefined;
  suggestedAlternatives: IndexedImdbTitle[];
}

export default function SuggestedMatchesModal({
  className,
  program,
  matchedImdbTitle,
  suggestedAlternatives,
}: SuggestedMatchesModalProps) {
  // disable scrolling of the original page while the modal is being displayed
  // unfortunately with the method we've chosen, the user can still scroll by
  //   interacting with the scrollbar
  // the alternative: setting document.body's width to 100vh and overflow-y to
  //   'hidden' would prevent all scrolling, but would require additional logic
  //   to prevent the page layout shifting from an already-present scrollbar
  //   disappearing
  useEffect(() => {
    const navigationKeys = [
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "End",
      "Home",
      "PageDown",
      "PageUp",
    ];
    function preventDefault(e: MouseEvent | TouchEvent) {
      e.preventDefault();
    }
    function preventScrollWithKeyboard(e: KeyboardEvent) {
      if (navigationKeys.includes(e.key)) e.preventDefault();
    }
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });
    window.addEventListener("keydown", preventScrollWithKeyboard, {
      passive: false,
    });
    return () => {
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("keydown", preventScrollWithKeyboard);
    };
  }, []);

  const ratingNode = program.node.querySelector(`.${CssClasses.imdbDataNode}`)!;

  const rect = ratingNode.getBoundingClientRect();
  const left = rect.x;
  const top = rect.y + rect.height;

  return (
    <div
      className={cx("modal-container", "modal-suggested-matches", className)}
      onClick={hideSuggestedMatchesModal}
    >
      <div
        className="modal-content"
        style={{ position: "fixed", top, left }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="header">
          <div>
            <img src={siftLogoIcon} alt="Sift logo" />
          </div>
          <h1>Whoops!</h1>
        </div>

        {matchedImdbTitle ? (
          <div className="current-match">
            <p>We matched this title to</p>
            <MatchesList suggestions={[matchedImdbTitle!]} />
          </div>
        ) : null}

        <div className="alternative-matches">
          <p>
            Would one of these {matchedImdbTitle ? "others" : "titles"} be the
            correct match?
          </p>
          <MatchesList
            suggestions={suggestedAlternatives}
            onSelectSuggestion={(sm: IndexedImdbTitle) => {
              console.log(`User selected`, sm);
            }}
          />
        </div>
      </div>
    </div>
  );
}
