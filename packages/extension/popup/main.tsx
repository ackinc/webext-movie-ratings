// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
import { render, h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import SetCurPageContext from "./Contexts/SetCurPageContext";
import { type PopupPage } from "./common";
import { removeBadge, getSetting, type InAppNotification } from "../common";
import * as notificationsService from "../common/notificationsService";
import CloseIconButton from "@components/Buttons/CloseIconButton";
import Header from "./Header";
import OnboardingFlow from "./OnboardingFlow/OnboardingFlow";
import ProgramFilters from "./ProgramFilters";
import SettingsPage from "./SettingsPage";
import PitchErrorReportingPage from "./PitchErrorReportingPage";
import PitchMissingRatingReportingPage from "./PitchMissingRatingReportingPage";
import Footer from "./Footer";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  const [curPage, setCurPage] = useState<PopupPage>(getDefaultPage());
  const [notification, setNotification] = useState<InAppNotification | null>(
    null,
  );

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

      const [latestNotification] = (
        await notificationsService.getNotificationsByStatus(["unseen", "seen"])
      ).sort((a, b) => {
        if (a.status === "unseen" && b.status === "seen") return -1;
        if (a.status === "seen" && b.status === "unseen") return 1;
        return a.timestamp - b.timestamp;
      });
      if (!latestNotification) return;

      setNotification(latestNotification);
      if (latestNotification.status === "unseen") {
        setCurPage(latestNotification.targetPopupPage);
        removeBadge();
        await notificationsService.updateNotificationStatus(
          latestNotification.id,
          "seen",
        );
      }
      return;
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

        {notification && notification.targetPopupPage === curPage ? (
          <div className="notification">
            <p>{notification.message}</p>
            <CloseIconButton
              style={{ flexShrink: "0" }}
              onClick={async () => {
                await notificationsService.updateNotificationStatus(
                  notification.id,
                  "dismissed",
                );
                setNotification(null);
              }}
            />
          </div>
        ) : null}

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
