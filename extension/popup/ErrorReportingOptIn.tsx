import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting } from "../common";
import "./ErrorReportingOptIn.css";
import ErrorReportingOptInFormControl from "./ErrorReportingOptInFormControl";

interface ErrorReportingOptInProps {
  allowShowDetails?: boolean;
  style?: Record<string, string>;
}
const defaultProps = {
  allowShowDetails: true,
};

function ErrorReportingOptIn({
  allowShowDetails,
  style,
}: ErrorReportingOptInProps = defaultProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [optedInToErrorReporting, setOptedInToErrorReporting] = useState(false);

  useEffect(() => {
    (async () => {
      const optedIn = await getSetting("errorReportingOptIn");
      setOptedInToErrorReporting(Boolean(optedIn));
    })();
  }, []);

  return (
    <form className="error-reporting-form" style={{ ...style }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <ErrorReportingOptInFormControl
          enabled={optedInToErrorReporting}
          onToggle={toggleErrorReportingOptIn}
        />
        {allowShowDetails ? (
          <button
            className="toggle-info-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDetails((x) => !x);
            }}
          >
            ?
          </button>
        ) : null}
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
    </form>
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setSetting("errorReportingOptIn", negated);
    setOptedInToErrorReporting(negated);
  }
}

export default ErrorReportingOptIn;
