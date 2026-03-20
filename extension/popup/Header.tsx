import { type CurPage } from "./common";
import CloseButton from "./CloseButton";
import SettingsIcon from "../../images/settings.svg";
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
        <CloseButton onClick={() => setCurPage("filters")} />
      ) : curPage === "filters" ? (
        <button className="btn" onClick={() => setCurPage("settings")}>
          <img src={SettingsIcon} />
        </button>
      ) : null}
    </div>
  );
}
