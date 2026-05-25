import { webStoreLink, type PopupPage } from "@common";
import "./Footer.css";

interface FooterProps {
  curPage: PopupPage;
  setCurPage: (pg: PopupPage) => void;
}

export default function Footer({ curPage, setCurPage }: FooterProps) {
  if (!["filters", "settings"].includes(curPage)) return null;

  return (
    <div className="footer">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setCurPage("feedbackForm");
        }}
      >
        Have feedback?
      </a>

      <a href={webStoreLink} className="rate-us-cta" target="_blank">
        Rate us!
      </a>
    </div>
  );
}
