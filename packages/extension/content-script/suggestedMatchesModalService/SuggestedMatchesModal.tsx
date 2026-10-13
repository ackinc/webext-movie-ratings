import cx from "classnames";
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
