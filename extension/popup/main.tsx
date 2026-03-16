// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import { useState } from "preact/hooks";
import { type CurPage } from "./common";
import Header from "./Header";
import ProgramFilters from "./ProgramFilters";
import SettingsPage from "./SettingsPage";
import FeedbackCollection from "./FeedbackCollection";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  const [curPage, setCurPage] = useState<CurPage>("settings");

  return (
    <div className="app">
      <Header curPage={curPage} setCurPage={setCurPage} />

      {curPage === "filters" ? <ProgramFilters /> : null}
      {curPage === "settings" ? <SettingsPage /> : null}

      <FeedbackCollection />
    </div>
  );
}
