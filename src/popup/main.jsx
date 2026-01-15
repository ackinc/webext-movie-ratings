// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import ErrorReportingOptIn from "./ErrorReportingOptIn";
import ProgramFilters from "./ProgramFilters";

const root = document.querySelector("div#root");
render(<App />, root);

function App() {
  return (
    <div
      style={{
        width: "320px",
        padding: "16px",
        fontSize: "0.875rem",
      }}
    >
      <ErrorReportingOptIn />
      <ProgramFilters />
    </div>
  );
}
