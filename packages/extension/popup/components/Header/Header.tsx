import { useEffect, useState } from "preact/hooks";
import { type PopupPage } from "@common";
import { getSetting } from "@common";
import CloseIconButton from "@common/components/Buttons/CloseIconButton";
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
    <>
      <div className="header">
        <div className="logo-container">
          <img src={"/images/logo128.png"} alt="Sift logo" />
        </div>

        <h3>
          {showingNewFeature
            ? "New feature alert!"
            : popupPageToHeadline[curPage]}
        </h3>

        {!["filters", "settings"].includes(curPage) ? (
          <div className="nav-controls">
            {curPage === "pitchErrorReporting" ? (
              <CloseIconButton onClick={() => setCurPage("settings")} />
            ) : curPage === "pitchMissingRatingReporting" ? (
              <CloseIconButton onClick={() => setCurPage("filters")} />
            ) : curPage === "feedbackForm" ? (
              <CloseIconButton onClick={() => setCurPage("filters")} />
            ) : null}
          </div>
        ) : null}
      </div>

      {["filters", "settings"].includes(curPage) ? (
        <nav className="popup-tabs" aria-label="Popup pages">
          <button
            className={curPage === "filters" ? "active" : ""}
            aria-current={curPage === "filters" ? "page" : undefined}
            onClick={() => setCurPage("filters")}
          >
            Filters
          </button>
          <button
            className={curPage === "settings" ? "active" : ""}
            aria-current={curPage === "settings" ? "page" : undefined}
            onClick={() => setCurPage("settings")}
          >
            Settings
          </button>
        </nav>
      ) : null}
    </>
  );
}
