// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
import { render, h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import SetCurPageContext from "./Contexts/SetCurPageContext";
import { type PopupPage } from "./common";
import {
  removeBadge,
  getSetting,
  setSetting,
  type InAppNotification,
} from "../common";
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
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

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

      const [latestNotification, ...restNotifications] = (
        await notificationsService.getNotificationsByStatus(["unseen", "seen"])
      ).sort((a, b) => {
        if (a.status === "unseen" && b.status === "seen") return -1;
        if (a.status === "seen" && b.status === "unseen") return 1;
        return b.timestamp - a.timestamp;
      });
      if (!latestNotification) return;

      setNotifications([latestNotification, ...restNotifications]);
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

        <div className="notifications-container">
          {notifications
            .filter((notification) => curPage === notification.targetPopupPage)
            .map((notification) => (
              <div key={notification.id} className="notification">
                <p>{notification.message}</p>
                <CloseIconButton
                  style={{ flexShrink: "0" }}
                  onClick={async () => {
                    await notificationsService.updateNotificationStatus(
                      notification.id,
                      "dismissed",
                    );
                    setNotifications((ns) =>
                      ns.filter(({ id }) => id !== notification.id),
                    );
                  }}
                />
              </div>
            ))}
        </div>

        <main>
          {curPage === "onboarding" ? (
            <OnboardingFlow onFinish={handleOnboardingFinished} />
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

  async function handleOnboardingFinished() {
    await Promise.all(
      ["ADDED_HBOMAX_PEACOCKTV_ZEE5_MXPLAYER", "ADDED_HULU"].map((nId) =>
        notificationsService.updateNotificationStatus(nId, "dismissed"),
      ),
    );
    await setSetting("pitchMissingRatingReportingPageSeen", true);

    removeBadge();
    setCurPage("filters");
  }
}

function getDefaultPage(): PopupPage {
  const lastSeen = localStorage.getItem("lastSeenPage") as PopupPage | null;
  return lastSeen ?? "filters";
}
