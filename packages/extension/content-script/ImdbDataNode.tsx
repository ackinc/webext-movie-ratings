import { useState } from "preact/hooks";
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

interface ImdbDataNodeProps {
  imdbData: IMDBData;
  program: Program;
}

export default function ImdbDataNode({
  program,
  imdbData: data,
}: ImdbDataNodeProps) {
  const [wasReportedIncorrect, setWasReportedIncorrect] = useState(
    Boolean(data.wasReportedIncorrect),
  );

  return (
    <div className={CssClasses.imdbDataNodeContent}>
      <div
        className="headline"
        style={{
          visibility:
            APP_ENV === "production" &&
            typeof data.imdbRating === "string" &&
            ["N/F", "N/M"].includes(data.imdbRating)
              ? "hidden"
              : "visible",
        }}
      >
        <a
          className={`rating-page-link ${wasReportedIncorrect ? "rating-reported-incorrect" : ""}`}
          href={getIMDBLink(data.imdbId)}
          target="_blank"
          onClick={(e) => e.stopPropagation()}
        >
          IMDb{" "}
          {typeof data.imdbRating === "number"
            ? data.imdbRating.toFixed(1)
            : data.imdbRating}
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

  async function handleMaybeWrongButtonClick() {
    await browser.runtime.sendMessage({
      type: wasReportedIncorrect
        ? MessageType.undoReportIncorrectProgramMatch
        : MessageType.reportIncorrectProgramMatch,
      data: {
        program: pick(program, ["title", "type", "year", "selector"]),
        imdbData: data,
        pageUrl: location.href,
      },
    } satisfies Message);
    setWasReportedIncorrect((x) => !x);
  }
}
