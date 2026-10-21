import cx from "classnames";
import { useEffect } from "preact/hooks";
import { type IndexedImdbTitle } from "siftcore";
import {
  browser,
  CssClasses,
  MessageType,
  type Message,
  type Program,
} from "@common";
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

  // NOTE_POSITIONING_SUGGESTED_MATCHES_MODAL
  // When the user dismisses this modal- by clicking on the backdrop, or
  //   selecting one of the options in the suggested matches list, their
  //   pointer should ideally be hovering somewhere over the corresponding
  //   program-node
  // If this is not the case, the UX can be poor if the program-node in
  //   question is a "hover-node" (i.e. program-node with additional details
  //   about the program that only shows up when the user is hovering over a
  //   regular, non-hover program-node). And by poor UX, I mean the hover-node
  //   disappears, causing the user to have to move the mouse to bring up the
  //   hover-node again

  const { clientHeight: ch, clientWidth: cw } = document.documentElement;
  const rect = ratingNode.getBoundingClientRect();
  const bottom = rect.y >= MAX_HEIGHT ? ch - rect.y : null;
  const top = bottom === null ? rect.bottom : null;
  const left = rect.x + MAX_WIDTH <= cw ? rect.x : null;
  const right = left === null ? cw - rect.right : null;

  return (
    <div
      className={cx("modal-container", "modal-suggested-matches", className)}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        hideSuggestedMatchesModal();
      }}
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
    if (sm.imdbId) {
      await browser.runtime.sendMessage<Message>({
        type: MessageType.userSelectedASuggestedMatchForProgram,
        data: {
          program,
          pageUrl: location.href,
          imdbData: { imdbId: sm.imdbId, imdbRating: sm.rating ?? "N/A" },
          ...(token ? { serverSideRowId: id, token } : null),
        },
      });
    } else {
      await browser.runtime.sendMessage<Message>({
        type: MessageType.userRejectedSuggestedMatchesForProgram,
        data: {
          program,
          pageUrl: location.href,
          imdbData: null,
          ...(token ? { serverSideRowId: id, token } : null),
        },
      });
    }

    hideSuggestedMatchesModal();
  }
}
