// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import ErrorReportingOptIn from "./ErrorReportingOptIn";
import ProgramFilters from "./ProgramFilters";
import FeedbackCollection from "./FeedbackCollection";
import "./main.css";

const root = document.querySelector("div#root");
render(<App />, root);

function App() {
  return (
    <div className="app">
      <ErrorReportingOptIn />
      <ProgramFilters />
      <FeedbackCollection />
    </div>
  );
}
