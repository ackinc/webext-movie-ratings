import {
  browser,
  CssClasses,
  getIMDBLink,
  MessageType,
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
  return (
    <div className={CssClasses.imdbDataNodeContent}>
      <div className="headline">
        <a
          className="rating-page-link"
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
          onClick={() =>
            browser.runtime.sendMessage({
              type: MessageType.reportIncorrectProgramMatch,
              data: { program, imdbData: data, pageUrl: location.href },
            } satisfies Message)
          }
        >
          Wrong?
        </button>
      </div>
    </div>
  );
}
