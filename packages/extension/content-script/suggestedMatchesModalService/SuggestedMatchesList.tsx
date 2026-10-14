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
        <MatchesListItem
          key={sm.id}
          suggestedMatch={sm}
          {...(onSelectSuggestion ? { onSelectSuggestion } : {})}
        />
      ))}
    </ul>
  );
}

function MatchesListItem({
  suggestedMatch: sm,
  onSelectSuggestion,
  ...restProps
}: {
  suggestedMatch: IndexedImdbTitle;
  onSelectSuggestion?: (sm: IndexedImdbTitle) => void;
}) {
  return (
    <li {...restProps}>
      <div
        className="suggestion-details"
        onClick={() => onSelectSuggestion && onSelectSuggestion(sm)}
      >
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
          {sm.imdbId ? [sm.year, sm.type].filter((x) => x).join(" ") : ""}
        </span>
      </div>

      {sm.imdbId ? (
        <a
          href={`https://imdb.com/title/${sm.imdbId}`}
          target="_blank"
          className="suggestion-imdb-link"
          onClick={(e) => e.stopPropagation()}
        >
          IMDB {typeof sm.rating === "number" ? sm.rating.toFixed(1) : ""}
          <ExternalLinkIcon className="icon-external-link" />
        </a>
      ) : null}
    </li>
  );
}
