import { useState } from "preact/hooks";
import cx from "classnames";
import { partition } from "siftutils";
import {
  browser,
  CssClasses,
  getIMDBLink,
  MessageType,
  pick,
  type IMDBData,
  type Message,
  type Program,
  type SiftApiProgramMatching,
} from "@common";
import ExternalLinkIcon from "@common/components/Icons/ExternalLink";
import LoadingIcon from "@common/components/Icons/Loading";
import { showSuggestedMatchesModal } from "../suggestedMatchesModalService";
import { requestIMDBData } from "../utils";

interface RatingNodeProps {
  imdbData: IMDBData;
  program: Program;
}

export default function RatingNode({
  program,
  imdbData: initialImdbData,
}: RatingNodeProps) {
  const [imdbData, setImdbData] = useState<IMDBData>(initialImdbData);
  const [loading, setLoading] = useState(false);

  const { wasReportedIncorrect } = imdbData;

  return (
    <div
      className={cx(CssClasses.imdbDataNodeContent)}
      // acts as a hook for page- and location-specific styling
      // of these nodes
      data-program-selector={program.selector}
      // used when applying rating filters and when checking for
      //   expiry of displayed rating data
      data-imdb-id={imdbData.imdbId}
      data-imdb-rating={String(imdbData.imdbRating)}
      {...("expiry" in imdbData
        ? { "data-expiry": String(imdbData.expiry) }
        : {})}
      {...("wasReportedIncorrect" in imdbData
        ? {
            "data-was-reported-incorrect": String(
              imdbData.wasReportedIncorrect,
            ),
          }
        : {})}
    >
      <div
        className="headline"
        style={{
          visibility:
            APP_ENV === "production" &&
            typeof imdbData.imdbRating === "string" &&
            ["N/F", "N/M"].includes(imdbData.imdbRating)
              ? "hidden"
              : "visible",
        }}
      >
        <a
          className={`rating-page-link ${wasReportedIncorrect ? "rating-reported-incorrect" : ""}`}
          href={getIMDBLink(imdbData.imdbId)}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
        >
          IMDb{" "}
          {typeof imdbData.imdbRating === "number"
            ? imdbData.imdbRating.toFixed(1)
            : imdbData.imdbRating}
          <ExternalLinkIcon />
        </a>
        {loading ? (
          <LoadingIcon className="loading-icon" />
        ) : (
          <button
            className="maybe-wrong-button"
            onClick={handleMaybeWrongButtonClick}
          >
            {wasReportedIncorrect ? "Undo" : "Wrong?"}
          </button>
        )}
      </div>
    </div>
  );

  async function handleMaybeWrongButtonClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const payload = {
      program: pick(program, ["title", "type", "year", "selector"]),
      containerTitle: program.container.title,
      imdbData,
      pageUrl: location.href,
    } as const;

    if (wasReportedIncorrect) {
      await browser.runtime.sendMessage<Message, unknown>({
        type: MessageType.undoReportIncorrectProgramMatch,
        data: payload,
      });
      refreshImdbData();
      return;
    }

    try {
      setLoading(true);

      const { data } = await browser.runtime.sendMessage<
        Message,
        { data: SiftApiProgramMatching.IncorrectMatchReportResponse }
      >({ type: MessageType.reportIncorrectProgramMatch, data: payload });

      const { id, token, suggestedMatches } = data;
      const [[matchedImdbTitle], suggestedAlternatives] = partition(
        suggestedMatches,
        (sm) => sm.imdbId === imdbData.imdbId,
      );
      if (suggestedAlternatives.length > 0) {
        showSuggestedMatchesModal(
          program,
          id,
          token,
          matchedImdbTitle,
          suggestedAlternatives,
        );
      }
    } finally {
      setLoading(false);
      refreshImdbData();
    }
  }

  async function refreshImdbData() {
    setImdbData(await requestIMDBData(program));
  }
}
