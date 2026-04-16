import FeedbackCollection from "./FeedbackCollection";
import type { PopupPage } from "./common";
import { webStoreLink } from "../common/constants";
import "./Footer.css";

interface FooterProps {
  curPage: PopupPage;
}

export default function Footer({ curPage }: FooterProps) {
  return (
    <div className="footer">
      <FeedbackCollection curPage={curPage} />

      <a href={webStoreLink} className="rate-us-cta" target="_blank">
        Rate us!
      </a>
    </div>
  );
}
