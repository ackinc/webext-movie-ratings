import { useEffect, useState } from "preact/hooks";
import { type PopupPage } from "@common";
import { getSetting } from "@common";
import CloseIconButton from "@common/components/Buttons/CloseIconButton";
import SettingsIconButton from "@common/components/Buttons/SettingsIconButton";
import "./Header.css";

interface HeaderProps {
  curPage: PopupPage;
  setCurPage: (x: PopupPage) => void;
}

const popupPageToHeadline: Record<PopupPage, string> = {
  onboarding: "Welcome!",
  filters: "Filter Programs",
  settings: "Settings",
  pitchErrorReporting: "Opt-in to error reporting",
  pitchMissingRatingReporting: "Opt-in to error reporting",
  feedbackForm: "Send us your feedback!",
};

export default function Header({ curPage, setCurPage }: HeaderProps) {
  const [showingNewFeature, setShowingNewFeature] = useState(false);

  useEffect(() => {
    (async () => {
      const pitchMissingRatingReportingPageSeen = await getSetting(
        "pitchMissingRatingReportingPageSeen",
      );
      if (
        curPage === "pitchMissingRatingReporting" &&
        !pitchMissingRatingReportingPageSeen
      ) {
        setShowingNewFeature(true);
        return;
      }

      setShowingNewFeature(false);
    })();
  }, [curPage]);

  return (
    <div className="header">
      <div className="logo-container">
        <img src={"/images/logo128.png"} alt="Sift logo" />
      </div>

      <h3>
        {showingNewFeature
          ? "New feature alert!"
          : popupPageToHeadline[curPage]}
      </h3>

      <div className="nav-controls">
        {curPage === "settings" ? (
          <CloseIconButton onClick={() => setCurPage("filters")} />
        ) : curPage === "filters" ? (
          <SettingsIconButton onClick={() => setCurPage("settings")} />
        ) : curPage === "pitchErrorReporting" ? (
          <CloseIconButton onClick={() => setCurPage("settings")} />
        ) : curPage === "pitchMissingRatingReporting" ? (
          <CloseIconButton onClick={() => setCurPage("filters")} />
        ) : null}
      </div>
    </div>
  );
}
