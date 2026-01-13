// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import {
  getErrorReportingOptInState,
  setErrorReportingOptInState,
} from "../common";

const root = document.querySelector("div#root");
render(<App />, root);

function App() {
  const [optedInToErrorReporting, setOptedInToErrorReporting] = useState(false);

  useEffect(() => {
    (async () => {
      const optedIn = await getErrorReportingOptInState();
      setOptedInToErrorReporting(optedIn);
    })();
  }, []);

  return (
    <div
      style={{
        width: "320px",
        padding: "16px",
        fontSize: "0.875rem",
      }}
    >
      <div
        style={{
          marginBottom: "1rem",
          borderRadius: "2rem",
          padding: "1rem",
          backgroundColor: "#e1bf2b",
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
        <p>This will help us deliver fixes faster.</p>
      </div>

      <div
        style={{
          padding: "0 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <label for="optInToErrorReporting">Opt-in to error reporting?</label>
        <input
          type="checkbox"
          id="optInToErrorReporting"
          name="optIn"
          checked={optedInToErrorReporting}
          onChange={toggleErrorReportingOptIn}
        />
      </div>
    </div>
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setErrorReportingOptInState(negated);
    setOptedInToErrorReporting(negated);
  }
}
