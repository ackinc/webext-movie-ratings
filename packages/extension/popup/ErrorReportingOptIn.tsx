import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting } from "../common";
import "./ErrorReportingOptIn.css";
import CheckboxInput from "./Inputs/CheckboxInput";

interface ErrorReportingOptInProps {
  onClickShowDetails?: () => void;
  style?: Record<string, string>;
}

function ErrorReportingOptIn({
  onClickShowDetails,
  style,
}: ErrorReportingOptInProps) {
  const [optedInToErrorReporting, setOptedInToErrorReporting] = useState(false);

  useEffect(() => {
    (async () => {
      const optedIn = await getSetting("errorReportingOptIn");
      setOptedInToErrorReporting(Boolean(optedIn));
    })();
  }, []);

  return (
    <form className="error-reporting-form" style={{ ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <CheckboxInput
          name="errorReportingOptIn"
          label="Opt-in to error reporting"
          checked={optedInToErrorReporting}
          onChange={toggleErrorReportingOptIn}
        />

        {onClickShowDetails ? (
          <button
            className="show-details-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClickShowDetails();
            }}
          >
            More
          </button>
        ) : null}
      </div>
    </form>
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setSetting("errorReportingOptIn", negated);
    setOptedInToErrorReporting(negated);
  }
}

export default ErrorReportingOptIn;
