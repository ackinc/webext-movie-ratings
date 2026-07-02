import type { Notification as SiftNotification } from "sifttypes";
import * as siftApiService from "./siftApiService";
import * as storage from "./storage";
import type { InAppNotification, InAppNotificationStatus } from "./types";

export async function checkForNewNotifications(): Promise<InAppNotification[]> {
  const lastReceivedNotif = await getLatestNotification();
  const newNotifications: Required<SiftNotification>[] =
    await siftApiService.getNotifications(
      lastReceivedNotif ? new Date(lastReceivedNotif.timestamp) : new Date(),
    );

  if (newNotifications.length > 0) {
    await storeNotifications(newNotifications);
  }

  // TODO: prune old notifications

  return await getNotificationsBy({ status: ["unseen"] });
}

async function getAllNotifications(): Promise<InAppNotification[]> {
  const notifications =
    (await storage.get<InAppNotification[]>("notifications")) ?? [];
  return notifications;
}

async function getLatestNotification(): Promise<InAppNotification | undefined> {
  return (
    await getNotificationsBy({}, (a, b) => b.timestamp - a.timestamp, {
      limit: 1,
    })
  )[0];
}

export async function getNotificationsBy(
  filters: {
    status?: InAppNotificationStatus[];
    targetPage?: InAppNotification["targetPage"][];
  },
  orderFn = cmpNotificationsByStatusAndTimestamp,
  limits: { limit?: number; limitPerPage?: number } = {},
) {
  let notifications = (await getAllNotifications()).sort(orderFn);

  if (filters.status) {
    notifications = notifications.filter((n) =>
      filters.status!.includes(n.status),
    );
  }
  if (filters.targetPage) {
    notifications = notifications.filter((n) =>
      filters.targetPage!.includes(n.targetPage),
    );
  }

  if (limits.limitPerPage) {
    notifications = notifications.reduce(
      (acc, n) => {
        acc.counts[n.targetPage] = (acc.counts[n.targetPage] ?? 0) + 1;

        if (acc.counts[n.targetPage]! <= limits.limitPerPage!) {
          acc.notifications.push(n);
        }
        return acc;
      },
      {
        notifications: [] as InAppNotification[],
        counts: {} as Record<InAppNotification["targetPage"], number>,
      },
    ).notifications;
  }

  if (limits.limit) {
    notifications = notifications.slice(0, limits.limit);
  }

  return notifications;
}

async function storeNotifications(
  notifications: Required<SiftNotification>[],
): Promise<void> {
  const allStoredNotifications = await getAllNotifications();
  const allStoredNotificationIds = new Set(
    allStoredNotifications.map((n) => n.notificationId),
  );

  const notificationsToStore = notifications
    .filter((n) => !allStoredNotificationIds.has(n.notificationId))
    .map((n) => ({ ...n, status: "unseen" as "unseen" }));
  await storage.set(
    "notifications",
    allStoredNotifications.concat(notificationsToStore),
  );
}

export async function updateNotificationStatus(
  ids: string[],
  status: InAppNotificationStatus,
): Promise<void> {
  const allNotifications = await getAllNotifications();
  const updatedNotifications = allNotifications.map((n) => {
    if (ids.includes(n.notificationId)) n.status = status;
    return n;
  });
  await storage.set("notifications", updatedNotifications);
}

export function cmpNotificationsByStatusAndTimestamp(
  a: InAppNotification,
  b: InAppNotification,
): number {
  const statusPriorityOrderDesc: InAppNotificationStatus[] = [
    "unseen",
    "seen",
    "dismissed",
  ];
  return (
    statusPriorityOrderDesc.indexOf(a.status) -
      statusPriorityOrderDesc.indexOf(b.status) || b.timestamp - a.timestamp
  );
}
