import { useEffect, useState } from "preact/hooks";
import { getSetting, setSetting, SettingsKey } from "../common";

function ErrorReportingOptIn() {
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
    <div
      className="error-reporting-opt-in-container"
      style={{ marginBottom: "1rem" }}
    >
      <div
        style={{
          marginBottom: "1rem",
          borderRadius: "2rem",
          padding: "1rem",
          backgroundColor: "#f5c618",
          color: "#454545",
          fontSize: "0.75rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        <p style={{ fontWeight: "bold" }}>ⓘ Opt-in to error reporting?</p>
        <p>
          With your permission, we can collect the following information when an
          error occurs in the extension.
        </p>
        <ul style={{ paddingLeft: "1rem" }}>
          <li>Device, OS, and browser</li>
          <li>Dimensions of the browser</li>
          <li>Error details</li>
        </ul>
        <p>
          This will help us deliver fixes faster when updates to an OTT
          website's design causes the extension to break.
        </p>
      </div>

      <div
        style={{
          padding: "0 1rem",
          display: "flex",
          alignItems: "center",
          gap: "0.25rem",
        }}
      >
        <input
          type="checkbox"
          id="optInToErrorReporting"
          name="optIn"
          checked={optedInToErrorReporting}
          onChange={toggleErrorReportingOptIn}
        />
        <label for="optInToErrorReporting">Opt-in to error reporting?</label>
      </div>
    </div>
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setSetting(SettingsKey.errorReportingOptIn, negated);
    setOptedInToErrorReporting(negated);
  }
}

export default ErrorReportingOptIn;
