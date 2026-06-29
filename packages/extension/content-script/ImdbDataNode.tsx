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
          onClick={handleMaybeWrongButtonClick}
        >
          Wrong?
        </button>
      </div>
    </div>
  );

  function handleMaybeWrongButtonClick() {
    console.log("Maybe wrong button clicked for", program, data, location.href);
    browser.runtime.sendMessage({
      type: MessageType.reportIncorrectProgramMatch,
      data: {
        program: pick(program, ["title", "type", "year", "selector"]),
        imdbData: data,
        pageUrl: location.href,
      },
    } satisfies Message);
  }
}
