// @ts-expect-error `h` and `Fragment` need to be imported here, even
//   though they are unused
import { render, h, Fragment } from "preact";
import { useEffect, useState } from "preact/hooks";
import SetCurPageContext from "./contexts/SetCurPageContext";
import {
  removeBadge,
  getSetting,
  setSetting,
  type InAppNotification,
  type PopupPage,
} from "@common";
import * as notificationsService from "@common/notificationsService";
import Header from "./components/Header/Header";
import OnboardingFlow from "./pages/OnboardingFlow/OnboardingFlow";
import ProgramFilters from "./pages/ProgramFiltersPage/ProgramFilters";
import SettingsPage from "./pages/SettingsPage/SettingsPage";
import Notifications from "./components/Notifications/Notifications";
import PitchErrorReportingPage from "./pages/PitchErrorReportingPage/PitchErrorReportingPage";
import PitchMissingRatingReportingPage from "./pages/PitchMissingRatingReportingPage/PitchMissingRatingReportingPage";
import Footer from "./components/Footer/Footer";
import "./main.css";

const root = document.querySelector<HTMLDivElement>("div#root")!;
render(<App />, root);

function App() {
  const [curPage, setCurPage] = useState<PopupPage>(getDefaultPage());
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);

  // determine what page the user should see first
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

      // show whichever page the user has unseen notifications for
      const [latestNotification, ...restNotifications] =
        await notificationsService.getNotificationsBy(
          { status: ["unseen", "seen"] },
          notificationsService.cmpNotifications,
          { limitPerPage: 3 },
        );
      if (!latestNotification) return;

      setNotifications([latestNotification, ...restNotifications]);
      if (latestNotification.status === "unseen") {
        setCurPage(latestNotification.targetPopupPage);
        removeBadge();
      }
      return;
    })();
  }, []);

  // Save the page the user is currently on so it can be restored
  //   the next time they open the popup
  useEffect(() => {
    localStorage.setItem("lastSeenPage", curPage);
  }, [curPage]);

  // update status of displayed notifications
  useEffect(() => {
    (async () => {
      const idsOfNotifsToUpdate = notifications
        .filter((n) => n.targetPopupPage === curPage && n.status === "unseen")
        .map((n) => n.id);
      if (idsOfNotifsToUpdate.length === 0) return;
      await notificationsService.updateNotificationStatus(
        idsOfNotifsToUpdate,
        "seen",
      );
      setNotifications(
        notifications.map((n) => ({
          ...n,
          status: idsOfNotifsToUpdate.includes(n.id) ? "seen" : n.status,
        })),
      );
    })();
  }, [curPage, notifications]);

  const curPageNotifs = notifications.filter(
    (notification) => curPage === notification.targetPopupPage,
  );

  return (
    <div className="app">
      <SetCurPageContext.Provider value={setCurPage}>
        <Header curPage={curPage} setCurPage={setCurPage} />

        {curPageNotifs.length > 0 ? (
          <Notifications
            notifications={curPageNotifs}
            onDismissNotification={handleNotificationDismissed}
          />
        ) : null}

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

        <Footer curPage={curPage} setCurPage={setCurPage} />
      </SetCurPageContext.Provider>
    </div>
  );

  async function handleOnboardingFinished() {
    // these don't need to be shown to a user who has just completed
    //   onboarding
    await notificationsService.updateNotificationStatus(
      ["ADDED_HBOMAX_PEACOCKTV_ZEE5_MXPLAYER", "ADDED_HULU"],
      "dismissed",
    );
    await setSetting("pitchMissingRatingReportingPageSeen", true);

    removeBadge();
    setCurPage("filters");
  }

  async function handleNotificationDismissed(nId: string) {
    await notificationsService.updateNotificationStatus([nId], "dismissed");
    setNotifications((ns) => ns.filter(({ id }) => id !== nId));
  }
}

function getDefaultPage(): PopupPage {
  const lastSeen = localStorage.getItem("lastSeenPage") as PopupPage | null;
  return lastSeen ?? "filters";
}
