// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
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
import PitchMissingRatingReportingPage from "./PitchMissingRatingReportingPage";
import DevControlPanel from "./DevControlPanel";
import Footer from "./Footer";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  const [curPage, setCurPage] = useState<PopupPage>(getDefaultPage());

  useEffect(() => {
    (async () => {
      if ((await getSetting("onboardingStatus")) !== "finished") {
        setCurPage("onboarding");
        return;
      }

      const [errorReportingOptedIn, pitchMissingRatingReportingPageSeen] =
        await Promise.all([
          getSetting("errorReportingOptIn"),
          getSetting("pitchMissingRatingReportingPageSeen"),
        ]);
      if (!errorReportingOptedIn && !pitchMissingRatingReportingPageSeen) {
        setCurPage("pitchMissingRatingReporting");
        return;
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
          {curPage === "pitchMissingRatingReporting" ? (
            <PitchMissingRatingReportingPage />
          ) : null}
          {curPage === "devControlPanel" && APP_ENV !== "production" ? (
            <DevControlPanel />
          ) : null}
        </main>

        {(["filters", "settings"] as PopupPage[]).includes(curPage) ? (
          <Footer curPage={curPage} />
        ) : null}
      </SetCurPageContext.Provider>
    </div>
  );
}

function getDefaultPage(): PopupPage {
  const lastSeen = localStorage.getItem("lastSeenPage") as PopupPage | null;
  return lastSeen ?? "filters";
}
