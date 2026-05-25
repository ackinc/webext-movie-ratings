import { useState } from "preact/hooks";
import { type PopupPage } from "@common";
import CopyToClipboardButton from "@common/components/Buttons/CopyToClipboardButton";
import "./FeedbackCollection.css";

const email = "anirudh.nimmagadda@gmail.com";

interface FeedbackCollectionProps {
  curPage: PopupPage;
}

export default function FeedbackCollection({
  curPage,
}: FeedbackCollectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="feedback-collection">
      <button
        className="btn-toggle-expand"
        onClick={() => setExpanded((x) => !x)}
      >
        {expanded
          ? `Back to ${curPage === "filters" ? "filters" : "settings"}`
          : "Have feedback?"}
      </button>

      {expanded ? (
        <div className="instructions-container">
          <div className="instructions">
            <p>
              Please send an email to{" "}
              <span className="email">
                {email} <CopyToClipboardButton textToCopy={email} />
              </span>{" "}
            </p>

            <p>Thank you for helping make Sift better!</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
