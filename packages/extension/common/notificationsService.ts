import * as storage from "./storage";
import type { InAppNotification, InAppNotificationStatus } from "./types";

export async function checkForNewNotifications(): Promise<InAppNotification[]> {
  // may get this via an API call in future
  const newNotifications: InAppNotification[] = [
    {
      id: "ADDED_HBOMAX_PEACOCKTV_ZEE5_MXPLAYER",
      message: "Sift now supports HBOMax, PeacockTV, Zee5, and MXPlayer!",
      targetPopupPage: "settings",
      status: "unseen",
      timestamp: 1779218228892,
    },
    {
      id: "ADDED_HULU",
      message: "Sift now supports Hulu!",
      targetPopupPage: "settings",
      status: "unseen",
      timestamp: 1779304615085,
    },
  ];

  if (newNotifications.length > 0) {
    await storeNotifications(newNotifications);
  }

  // TODO: prune old notifications

  return await getNotificationsByStatus(["unseen"]);
}

async function getAllNotifications(): Promise<InAppNotification[]> {
  const notifications =
    (await storage.get<InAppNotification[]>("notifications")) ?? [];
  return notifications;
}

export async function getNotificationsByStatus(
  targetStatuses: InAppNotificationStatus[],
): Promise<InAppNotification[]> {
  const notifications = await getAllNotifications();
  return notifications.filter(({ status }) => targetStatuses.includes(status));
}

async function storeNotifications(
  notifications: InAppNotification[],
): Promise<void> {
  const allStoredNotifications = await getAllNotifications();
  const allStoredNotificationIds = new Set(
    allStoredNotifications.map(({ id }) => id),
  );

  const notificationsToStore = notifications.filter(
    ({ id }) => !allStoredNotificationIds.has(id),
  );
  await storage.set(
    "notifications",
    allStoredNotifications.concat(notificationsToStore),
  );
}

export async function updateNotificationStatus(
  id: string,
  status: InAppNotificationStatus,
): Promise<void> {
  const allNotifications = await getAllNotifications();
  const thisNotification = allNotifications.find((n) => n.id === id);
  if (!thisNotification) throw new Error(`Invalid notification id: ${id}`);
  thisNotification.status = status;
  await storage.set("notifications", allNotifications);
}
