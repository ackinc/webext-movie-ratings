import ErrorReportingOptIn from "./ErrorReportingOptIn";
import "./PitchErrorReportingPage.css";

export default function PitchErrorReportingOptInPage() {
  return (
    <div className="page pitch-error-reporting-page">
      <p>
        This extension collects <b>NO</b> data by default ...
      </p>

      <p>
        ... but you can opt-in to automatic error reporting below to notify the
        developer when the extension encounters an error.
      </p>

      <p>
        This includes cases where Sift is unable to find ratings for a
        particular movie/show.
      </p>

      <ErrorReportingOptIn
        style={{
          backgroundColor: "var(--main-bg-color)",
          borderRadius: "16px",
          padding: "8px 16px",
        }}
      />

      <p className="data-collection-details">
        Alongside the actual error details, the following information will be
        collected to help reproduce the error:
        <ul>
          <li>Device, OS, and browser</li>
          <li>Width and height of the browser</li>
          <li>URL of webpage where the error occurred</li>
        </ul>
      </p>
    </div>
  );
}
