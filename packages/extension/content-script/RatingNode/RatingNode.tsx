import { useState } from "preact/hooks";
import cx from "classnames";
import {
  browser,
  CssClasses,
  getIMDBLink,
  MessageType,
  pick,
  type IMDBData,
  type Message,
  type Program,
} from "@common";
import ExternalLinkIcon from "@common/components/Icons/ExternalLink";

interface RatingNodeProps {
  imdbData: IMDBData;
  program: Program;
}

export default function RatingNode({
  program,
  imdbData: initialImdbData,
}: RatingNodeProps) {
  const [imdbData, setImdbData] = useState<IMDBData>(initialImdbData);
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
        <button
          className="maybe-wrong-button"
          onClick={handleMaybeWrongButtonClick}
        >
          {wasReportedIncorrect ? "Undo" : "Wrong?"}
        </button>
      </div>
    </div>
  );

  async function handleMaybeWrongButtonClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    await browser.runtime.sendMessage({
      type: wasReportedIncorrect
        ? MessageType.undoReportIncorrectProgramMatch
        : MessageType.reportIncorrectProgramMatch,
      data: {
        program: pick(program, ["title", "type", "year", "selector"]),
        imdbData,
        pageUrl: location.href,
      },
    } satisfies Message);
    setImdbData((data) => ({
      ...data,
      wasReportedIncorrect: !data.wasReportedIncorrect,
    }));
  }
}
