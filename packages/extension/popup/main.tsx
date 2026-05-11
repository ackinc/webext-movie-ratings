// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { render, h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import SetCurPageContext from "./Contexts/SetCurPageContext";
import { type PopupPage } from "./common";
import { removeBadge, getSetting } from "../common";
import Header from "./Header";
import OnboardingFlow from "./OnboardingFlow/OnboardingFlow";
import ProgramFilters from "./ProgramFilters";
import SettingsPage from "./SettingsPage";
import PitchErrorReportingPage from "./PitchErrorReportingPage";
import Footer from "./Footer";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  const [curPage, setCurPage] = useState<PopupPage>(
    (localStorage.getItem("lastSeenPage") as PopupPage | null) ?? "filters",
  );

  useEffect(() => {
    (async () => {
      if ((await getSetting("onboardingStatus")) !== "finished") {
        setCurPage("onboarding");
      }
    })();
  }, []);

  // Save the page the user is currently on so it can be restored
  //   the next time they open the popup
  useEffect(() => {
    localStorage.setItem("lastSeenPage", curPage);
  }, [curPage]);

  return (
    <div className="app">
      <SetCurPageContext.Provider value={setCurPage}>
        <Header curPage={curPage} setCurPage={setCurPage} />

        <main>
          {curPage === "onboarding" ? (
            <OnboardingFlow
              onFinish={() => {
                removeBadge();
                setCurPage("filters");
              }}
            />
          ) : null}
          {curPage === "filters" ? <ProgramFilters /> : null}
          {curPage === "settings" ? <SettingsPage /> : null}
          {curPage === "pitchErrorReporting" ? (
            <PitchErrorReportingPage />
          ) : null}
        </main>

        {curPage !== "onboarding" ? <Footer curPage={curPage} /> : null}
      </SetCurPageContext.Provider>
    </div>
  );
}
