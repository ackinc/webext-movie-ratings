import { useEffect } from "preact/hooks";
import { getSetting } from "../../common";
import ErrorReportingOptIn from "../ErrorReportingOptIn";
import "./PitchErrorReportingPage.css";

interface PageProps {
  onFinish: () => void;
}

export default function PitchErrorReportingOptInPage({ onFinish }: PageProps) {
  // if the user is already opted-in, there's nothing to do here
  useEffect(() => {
    (async () => {
      const alreadyOptedInToErrorReporting = await getSetting(
        "errorReportingOptIn",
      );
      if (alreadyOptedInToErrorReporting) onFinish();
    })();
  }, []);

  return (
    <div className="page pitch-error-reporting-page">
      <p>
        This extension collects <b>NO</b> data by default ...
      </p>

      <p>
        ... but you can opt-in to automatic error reporting below to notify the
        developer when the extension encounters an error.
      </p>

      <ErrorReportingOptIn
        style={{
          backgroundColor: "var(--main-bg-color)",
          borderRadius: "16px",
          padding: "8px 16px",
        }}
      />

      <p>
        Errors can happen for various reasons, including when an OTT website
        updates their design.
      </p>

      <p className="data-collection-details">
        Alongside the actual error details, the following information will be
        collected to help reproduce the error:
        <ul>
          <li>Device, OS, and browser</li>
          <li>Width and height of the browser</li>
          <li>URL of webpage where the error occurred</li>
        </ul>
      </p>

      <p>
        Opting-in helps the developer detect and fix issues faster, so please
        consider it.
      </p>
    </div>
  );
}
