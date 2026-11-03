import { db } from "./db";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ALERT";

export async function notify(
  userId: number,
  title: string,
  message: string,
  type: NotificationType = "INFO",
  link?: string
) {
  return await db.notification.create({
    data: {
      userId,
      title,
      message,
      type,
      link,
    },
  });
}

export async function markAsRead(notificationId: number) {
  return await db.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllAsRead(userId: number) {
  return await db.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
