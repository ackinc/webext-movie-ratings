import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting } from "../common";
import "./ErrorReportingOptIn.css";

function ErrorReportingOptIn() {
  const [showDetails, setShowDetails] = useState(false);
  const [optedInToErrorReporting, setOptedInToErrorReporting] = useState(false);

  useEffect(() => {
    (async () => {
      const optedIn = await getSetting("errorReportingOptIn");
      setOptedInToErrorReporting(Boolean(optedIn));
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
    await setSetting("errorReportingOptIn", negated);
    setOptedInToErrorReporting(negated);
  }
}

export default ErrorReportingOptIn;
