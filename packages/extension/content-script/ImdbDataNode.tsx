import { useState } from "preact/hooks";
import {
  browser,
  CssClasses,
  getIMDBLink,
  MessageType,
  type IMDBData,
  type Message,
  type Program,
} from "@common";

interface ImdbDataNodeProps {
  imdbData: IMDBData;
  program: Program;
}

export default function ImdbDataNode({
  program,
  imdbData: data,
}: ImdbDataNodeProps) {
  const [expanded, setExpanded] = useState(false);

  const showNode = data.imdbRating !== "N/F";

  return (
    <div
      className={CssClasses.imdbDataNodeContent}
      onMouseEnter={() => showNode && setExpanded(true)}
      onMouseLeave={() => showNode && setExpanded(false)}
      style={{
        display: "flex",
        gap: "16px",
        visibility: showNode ? "visibile" : "hidden",
      }}
    >
      <a
        href={getIMDBLink(data.imdbId)}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
      >
        IMDb {data.imdbRating === "N/A" ? "" : data.imdbRating}
      </a>
      <button
        onClick={() =>
          browser.runtime.sendMessage({
            type: MessageType.reportIncorrectProgramMatch,
            data: { program, imdbData: data, pageUrl: location.href },
          } satisfies Message)
        }
        style={{
          margin: 0,
          border: 0,
          padding: 0,
          backgroundColor: "transparent",
          color: "white",
          visibility: expanded ? "visible" : "hidden",
        }}
      >
        Wrong?
      </button>
    </div>
  );
}
