import cx from "classnames";
import { useEffect } from "preact/hooks";
import { type IndexedImdbTitle } from "siftcore";
import { CssClasses, type Program } from "@common";
import siftLogoIcon from "@images/logo48.png";
import MatchesList from "./SuggestedMatchesList";
import { hideSuggestedMatchesModal } from ".";
import * as siftApiService from "@common/siftApiService";

interface SuggestedMatchesModalProps {
  className?: string;
  id: number;
  token: string | undefined;
  program: Program;
  matchedImdbTitle: IndexedImdbTitle | undefined;
  suggestedAlternatives: IndexedImdbTitle[];
}

// the max space the modal-content can take up; used to ensure we render
//   the modal-content at a position where none of it is overflowing the
//   current viewport
// WARN: keep these values synced with their equivalents in the css file
const MAX_WIDTH = 360;
const MAX_HEIGHT = 320;

// displayed at the bottom of the list of alternative matches
const optionNoneOfTheAbove = {
  id: "null-placeholder",
  imdbId: "",
  title: "[None of the above]",
  type: "movie",
  year: null,
  rating: null,
} as const;

export default function SuggestedMatchesModal({
  className,
  id,
  token,
  program,
  matchedImdbTitle,
  suggestedAlternatives,
}: SuggestedMatchesModalProps) {
  // disable scrolling of the original page while the modal is being displayed
  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    const { paddingRight, overflowY } = document.body.style;
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.body.style.overflowY = "hidden";

    return () => {
      document.body.style.paddingRight = paddingRight;
      document.body.style.overflowY = overflowY;
    };
  }, []);

  const ratingNode = program.node.querySelector(`.${CssClasses.imdbDataNode}`)!;

  const rect = ratingNode.getBoundingClientRect();
  const top =
    rect.bottom + MAX_HEIGHT <= document.documentElement.clientHeight
      ? rect.bottom
      : null;
  const bottom =
    top === null ? document.documentElement.clientHeight - rect.top : null;
  const left =
    rect.x + MAX_WIDTH <= document.documentElement.clientWidth ? rect.x : null;
  const right =
    left === null ? document.documentElement.clientWidth - rect.right : null;

  return (
    <div
      className={cx("modal-container", "modal-suggested-matches", className)}
      onClick={hideSuggestedMatchesModal}
    >
      <div
        className="modal-content"
        style={{
          position: "fixed",
          ...(top ? { top } : {}),
          ...(bottom ? { bottom } : {}),
          ...(left ? { left } : {}),
          ...(right ? { right } : {}),
        }}
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
            suggestions={suggestedAlternatives.concat([optionNoneOfTheAbove])}
            onSelectSuggestion={handleSelection}
          />
        </div>
      </div>
    </div>
  );

  async function handleSelection(sm: IndexedImdbTitle) {
    console.log(`User selected`, sm);

    // TODO
    //   update ratings cache
    //   trigger findProgramsAndRefreshRatings

    hideSuggestedMatchesModal();

    if (sm.imdbId && token) {
      siftApiService
        .updateIncorrectMatchReport({
          id,
          token,
          suggestedImdbId: sm.imdbId,
        })
        .catch(() => {});
    }
  }
}
