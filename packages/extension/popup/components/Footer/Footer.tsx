import FeedbackCollection from "../FeedbackCollection/FeedbackCollection";
import type { PopupPage } from "@common";
import { webStoreLink } from "@common";
import "./Footer.css";

interface FooterProps {
  curPage: PopupPage;
}

export default function Footer({ curPage, setCurPage }: FooterProps) {
  if (!["filters", "settings"].includes(curPage)) return null;

  return (
    <div className="footer">
      <FeedbackCollection curPage={curPage} />

      <a href={webStoreLink} className="rate-us-cta" target="_blank">
        Rate us!
      </a>
    </div>
  );
}
