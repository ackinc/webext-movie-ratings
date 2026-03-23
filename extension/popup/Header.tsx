import { type CurPage } from "./common";
import CloseIconButton from "./Buttons/CloseIconButton";
import SettingsIconButton from "./Buttons/SettingsIconButton";
import "./Header.css";

interface HeaderProps {
  curPage: CurPage;
  setCurPage: (x: CurPage) => void;
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
              : null}
      </h3>

      {curPage === "settings" ? (
        <CloseIconButton onClick={() => setCurPage("filters")} />
      ) : curPage === "filters" ? (
        <SettingsIconButton onClick={() => setCurPage("settings")} />
      ) : null}
    </div>
  );
}
