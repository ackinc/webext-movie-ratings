import { useEffect } from "preact/hooks";

import { removeBadge, setSetting } from "@common";
import ErrorReportingOptIn from "@popup/components/ErrorReportingOptIn/ErrorReportingOptIn";
import "./PitchMissingRatingReportingPage.css";

export default function PitchErrorReportingOptInPage() {
  useEffect(() => {
    setSetting("pitchMissingRatingReportingPageSeen", true);
    removeBadge();
  }, []);

  return (
    <div className="page pitch-missing-rating-reporting-page">
      {/* <p style={{ fontWeight: "bold" }}>New feature alert!</p> */}

      <p>
        As you browse your favourite streaming websites, Sift can now
        automatically collect information on programs for which we were unable
        to display a rating.
      </p>

      <p>
        We'll attempt to match these programs to an entry in the IMDB database
        via a separate process.
      </p>

      <p>To opt-in to this feature, please check the box below.</p>

      <ErrorReportingOptIn
        style={{
          backgroundColor: "var(--main-bg-color)",
          borderRadius: "16px",
          padding: "8px 16px",
        }}
      />
    </div>
  );
}
