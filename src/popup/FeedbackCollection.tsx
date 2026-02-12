import { useState } from "preact/hooks";
import CopyToClipboardButton from "./CopyToClipboardButton";
import "./FeedbackCollection.css";

const email = "anirudh.nimmagadda@gmail.com";

export default function FeedbackCollection() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`feedback-collection ${expanded ? "expanded" : ""}`}>
      <button
        className="btn-toggle-expand"
        onClick={() => setExpanded((x) => !x)}
      >
        {expanded ? "Close" : "Have feedback?"}
      </button>

      {expanded ? (
        <div className="instructions">
          <p>
            Please send an email to{" "}
            <span className="email">
              {email} <CopyToClipboardButton textToCopy={email} />
            </span>{" "}
          </p>

          <p>Thank you for helping make Sift better!</p>
        </div>
      ) : null}
    </div>
  );
}
