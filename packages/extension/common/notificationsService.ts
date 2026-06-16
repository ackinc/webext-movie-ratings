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
    {
      id: "ADDED_PARAMOUNT_PLUS",
      message: "Sift now supports ParamountPlus!",
      targetPopupPage: "settings",
      status: "unseen",
      timestamp: 1781525467940,
    },
  ];

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

export async function getNotificationsBy(
  filters: {
    status?: InAppNotificationStatus[];
    targetPage?: InAppNotification["targetPopupPage"][];
  },
  orderFn = cmpNotifications,
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
      filters.targetPage!.includes(n.targetPopupPage),
    );
  }

  if (limits.limitPerPage) {
    notifications = notifications.reduce(
      (acc, n) => {
        acc.counts[n.targetPopupPage] =
          (acc.counts[n.targetPopupPage] ?? 0) + 1;

        if (acc.counts[n.targetPopupPage] <= limits.limitPerPage!) {
          acc.notifications.push(n);
        }
        return acc;
      },
      {
        notifications: [] as InAppNotification[],
        counts: {} as Record<InAppNotification["targetPopupPage"], number>,
      },
    ).notifications;
  }

  if (limits.limit) {
    notifications = notifications.slice(0, limits.limit);
  }

  return notifications;
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
  ids: string[],
  status: InAppNotificationStatus,
): Promise<void> {
  const allNotifications = await getAllNotifications();
  const updatedNotifications = allNotifications.map((n) => {
    if (ids.includes(n.id)) n.status = status;
    return n;
  });
  await storage.set("notifications", updatedNotifications);
}

export function cmpNotifications(
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
