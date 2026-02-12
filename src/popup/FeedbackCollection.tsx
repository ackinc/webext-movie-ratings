import { useState } from "preact/hooks";
import CopyToClipboardButton from "./CopyToClipboardButton";
import CloseButton from "./CloseButton";
import "./FeedbackCollection.css";

const email = "anirudh.nimmagadda@gmail.com";

export default function FeedbackCollection() {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className={`feedback-collection ${expanded ? "expanded" : ""}`}>
      {!expanded ? (
        <button className="btn-expand" onClick={() => setExpanded(true)}>
          Have feedback?
        </button>
      ) : (
        <>
          <CloseButton onClick={() => setExpanded(false)} />

          <div className="instructions">
            <p>
              Please send an email to{" "}
              <span className="email">
                {email} <CopyToClipboardButton textToCopy={email} />
              </span>{" "}
            </p>

            <p>Thanks for helping make Sift better!</p>
          </div>
        </>
      )}
    </div>
  );
}
