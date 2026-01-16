import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting, SettingsKey } from "../common";
import "./ErrorReportingOptIn.css";

function ErrorReportingOptIn() {
  const [showDetails, setShowDetails] = useState(false);
  const [optedInToErrorReporting, setOptedInToErrorReporting] = useState(false);

  useEffect(() => {
    (async () => {
      const optedIn = Boolean(
        await getSetting(SettingsKey.errorReportingOptIn)
      );
      setOptedInToErrorReporting(optedIn);
    })();
  }, []);

  return (
    <div className="error-reporting-container">
      <div className="error-reporting-control">
        <input
          type="checkbox"
          id="optInToErrorReporting"
          name="optIn"
          checked={optedInToErrorReporting}
          onChange={toggleErrorReportingOptIn}
        />
        <label for="optInToErrorReporting">Opt-in to error reporting</label>
        <button
          className="toggle-info-btn"
          onClick={() => setShowDetails((x) => !x)}
        >
          ?
        </button>
      </div>

      {showDetails ? (
        <div className="error-reporting-details">
          <p>
            With your permission, we can collect the following information when
            an error occurs in the extension.
          </p>
          <ul>
            <li>Device, OS, and browser</li>
            <li>Dimensions of the browser</li>
            <li>Error details</li>
          </ul>
          <p>
            This will help us deliver fixes faster when updates to an OTT
            website's design causes the extension to break.
          </p>
        </div>
      ) : null}
    </div>
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setSetting(SettingsKey.errorReportingOptIn, negated);
    setOptedInToErrorReporting(negated);
  }
}

export default ErrorReportingOptIn;
