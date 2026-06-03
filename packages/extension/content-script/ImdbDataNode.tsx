import { useState } from "preact/hooks";
import { CssClasses, getIMDBLink, type IMDBData } from "@common";

interface ImdbDataNodeProps {
  imdbData: IMDBData;
}

export default function ImdbDataNode({ imdbData: data }: ImdbDataNodeProps) {
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
        href={getIMDBLink(data.imdbID)}
        target="_blank"
        onClick={(e) => e.stopPropagation()}
      >
        IMDb {data.imdbRating === "N/A" ? "" : data.imdbRating}
      </a>
      <button
        onClick={() => console.log("wut")}
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
