import { useState } from "preact/hooks";
import cx from "classnames";
import { partition } from "siftutils";
import {
  browser,
  CssClasses,
  getIMDBLink,
  MessageType,
  type IMDBData,
  type Message,
  type Program,
  type SiftApiProgramMatching,
  type SWMessageResponse,
} from "@common";
import { SWError } from "@common/customErrors";
import { blockEvents, unblockEvents } from "@common/eventListenerBlocking";
import ExternalLinkIcon from "@common/components/Icons/ExternalLink";
import LoadingIcon from "@common/components/Icons/Loading";
import { showSuggestedMatchesModal } from "../suggestedMatchesModalService";
import { rmCircularRefsFromProgram } from "../utils";

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
          <ExternalLinkIcon className="external-link-icon" />
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
    // prevents on-hover program modals from disappearing due to a  loss
    //   of focus; this UX is especially egregious on AmazonPrimeVideo
    blockEvents();

    const payload = {
      program: rmCircularRefsFromProgram(program),
      containerTitle: program.container.title,
      imdbData,
      pageUrl: location.href,
    } as const;

    if (wasReportedIncorrect) {
      setImdbData({ ...imdbData, wasReportedIncorrect: false });
      await browser.runtime.sendMessage<Message, unknown>({
        type: MessageType.undoReportIncorrectProgramMatch,
        data: payload,
      });

      // calling this too early results in the on-hover program node
      //   disappearing on undo-button click in prime video
      setTimeout(unblockEvents, 250);
      return;
    }

    let stopBlockingEventsAtEnd = true;
    try {
      setImdbData({ ...imdbData, wasReportedIncorrect: true });

      setLoading(true);
      const response = await browser.runtime.sendMessage<
        Message,
        SWMessageResponse<SiftApiProgramMatching.IncorrectMatchReportResponse>
      >({ type: MessageType.reportIncorrectProgramMatch, data: payload });
      if ("error" in response) throw new SWError(response.error);

      const { id, token, suggestedMatches } = response.data;
      const [[matched], alts] = partition(
        suggestedMatches,
        (sm) => sm.imdbId === imdbData.imdbId,
      );
      if (alts.length === 0) return;

      // we don't want to stop blocking events until the user has finished
      //   interacting with the SuggestedMatchesModal, so the unblocking
      //   will happen elsewhere rather than here
      stopBlockingEventsAtEnd = false;
      showSuggestedMatchesModal(program, id, token, matched, alts);
    } finally {
      setLoading(false);
      if (stopBlockingEventsAtEnd) setTimeout(unblockEvents, 250);
    }
  }
}
