import { type PopupPage } from "./common";
import CloseIconButton from "./Buttons/CloseIconButton";
import SettingsIconButton from "./Buttons/SettingsIconButton";
import "./Header.css";

interface HeaderProps {
  curPage: PopupPage;
  setCurPage: (x: PopupPage) => void;
}

export default function Header({ curPage, setCurPage }: HeaderProps) {
  return (
    <div className="header">
      <div className="logo-container">
        <img src={"/images/logo128.png"} alt="Sift logo" />
      </div>

      <h3>
        {curPage === "onboarding"
          ? "Welcome!"
          : curPage === "filters"
            ? "Filter Programs"
            : curPage === "settings"
              ? "Settings"
              : curPage === "pitchErrorReporting"
                ? "Opt-in to error reporting"
                : curPage === "pitchMissingRatingReporting"
                  ? "New feature alert!"
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
