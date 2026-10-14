import { type IndexedImdbTitle } from "siftcore";
import IconButton from "@common/components/Buttons/IconButton";
import ExternalLinkIcon from "@common/components/Icons/ExternalLink";
import CheckmarkOnCircle from "@common/components/Icons/CheckmarkOnCircle";

export default function MatchesList({
  suggestions,
  onSelectSuggestion,
}: {
  suggestions: IndexedImdbTitle[];
  onSelectSuggestion?: (sm: IndexedImdbTitle) => void;
}) {
  return (
    <ul className="match-suggestions">
      {suggestions.map((sm) => (
        <li key={sm.imdbId}>
          <div className="suggestion-details">
            <span className="suggestion-action">
              {onSelectSuggestion ? (
                <IconButton
                  className="btn-select-suggestion"
                  onClick={() => onSelectSuggestion(sm)}
                  variant="outlined"
                >
                  <CheckmarkOnCircle className="icon-select" />
                </IconButton>
              ) : null}
            </span>

            <span className="suggestion-title">{sm.title}</span>

            <span className="suggestion-metadata">
              {[sm.year, sm.type].filter((x) => x).join(" ")}
            </span>
          </div>

          <a
            href={`https://imdb.com/title/${sm.imdbId}`}
            target="_blank"
            className="suggestion-imdb-link"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            IMDB {sm.rating === null ? "N/A" : sm.rating.toFixed(1)}
            <ExternalLinkIcon className="icon-external-link" />
          </a>
        </li>
      ))}
    </ul>
  );
}
