import showdown from "showdown";
import { renderTemplate } from "siftutils";
import type { InAppNotification } from "@common";
import * as constants from "@common/constants";
import CloseIconButton from "@common/components/Buttons/CloseIconButton";
import "./Notifications.css";

interface NotificationsProps {
  notifications: InAppNotification[];
  onDismissNotification: (nId: string) => void;
}

const mdConverter = new showdown.Converter({ openLinksInNewWindow: true });
const md2Html = (md: string) => mdConverter.makeHtml(md);
const supportedReplacements = Object.fromEntries(
  Object.entries(constants).filter(([, v]) => typeof v === "string"),
);

export default function Notifications({
  notifications,
  onDismissNotification,
}: NotificationsProps) {
  return (
    <div className="notifications-container">
      {notifications.map((n) => {
        // main use-case is to change web store link destination depending
        //   on browser
        const content = renderTemplate(n.content, supportedReplacements);
        return (
          <div key={n.notificationId} className="notification">
            <div dangerouslySetInnerHTML={{ __html: md2Html(content) }} />
            <CloseIconButton
              style={{ width: "20px", height: "20px", flexShrink: "0" }}
              onClick={() => onDismissNotification(n.notificationId)}
            />
          </div>
        );
      })}
    </div>
  );
}
