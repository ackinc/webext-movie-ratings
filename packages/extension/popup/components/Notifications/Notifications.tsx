import type { InAppNotification } from "@common";
import CloseIconButton from "@common/components/Buttons/CloseIconButton";
import "./Notifications.css";

interface NotificationsProps {
  notifications: InAppNotification[];
  onDismissNotification: (nId: string) => void;
}

export default function Notifications({
  notifications,
  onDismissNotification,
}: NotificationsProps) {
  return (
    <div className="notifications-container">
      {notifications.map((n) => (
        <div key={n.notificationId} className="notification">
          {/* TODO: markdown support (embedded links) */}
          <p>{n.content}</p>
          <CloseIconButton
            style={{ width: "20px", height: "20px", flexShrink: "0" }}
            onClick={() => onDismissNotification(n.notificationId)}
          />
        </div>
      ))}
    </div>
  );
}
