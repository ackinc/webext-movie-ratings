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
        width: "200px",
        padding: "16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.875rem",
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
  );

  async function toggleErrorReportingOptIn() {
    const negated = !optedInToErrorReporting;
    await setErrorReportingOptInState(negated);
    setOptedInToErrorReporting(negated);
  }
}
