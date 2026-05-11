import { useEffect, useState } from "preact/hooks";
import { type PopupPage } from "./common";
import { getSetting } from "../common";
import CloseIconButton from "./Buttons/CloseIconButton";
import SettingsIconButton from "./Buttons/SettingsIconButton";
import "./Header.css";

interface HeaderProps {
  curPage: PopupPage;
  setCurPage: (x: PopupPage) => void;
}

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
          : curPage === "onboarding"
            ? "Welcome!"
            : curPage === "filters"
              ? "Filter Programs"
              : curPage === "settings"
                ? "Settings"
                : curPage === "pitchErrorReporting"
                  ? "Opt-in to error reporting"
                  : curPage === "pitchMissingRatingReporting"
                    ? "Opt-in to error reporting"
                    : null}
      </h3>

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
  );
}
