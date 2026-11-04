import { db } from "./db";
import { getSettings } from "./settings";
import { daysUntil, fmtDate, todayUTC } from "./dates";
import { sendEmail, deadlineEmailHtml } from "./email";

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

/** Automatically detects overdue or due-soon projects for a user and creates alerts if not already sent recently. */
export async function checkAndCreateDeadlineNotifications(userId: number): Promise<void> {
  try {
    const s = await getSettings();
    const today = todayUTC();
    const soonThreshold = new Date(today.getTime() + s.dueSoonDays * 86_400_000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find open projects assigned to this user that are due soon or overdue
    const projects = await db.project.findMany({
      where: {
        assignedToId: userId,
        archived: false,
        status: { isClosed: false },
        deadline: { lte: soonThreshold },
      },
      select: {
        id: true,
        name: true,
        deadline: true,
      },
      take: 10,
    });

    for (const p of projects) {
      const days = daysUntil(p.deadline);
      const isOverdue = days < 0;
      const title = isOverdue ? `Project Overdue: ${p.name}` : `Deadline Approaching: ${p.name}`;
      const type: NotificationType = isOverdue ? "ALERT" : "WARNING";
      const message = isOverdue
        ? `Project "${p.name}" was due on ${fmtDate(p.deadline)} (${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue).`
        : days === 0
        ? `Project "${p.name}" is due today (${fmtDate(p.deadline)})!`
        : `Project "${p.name}" is due in ${days} day${days === 1 ? "" : "s"} (${fmtDate(p.deadline)}).`;
      const link = `/projects/${p.id}`;

      // Check if an unread notification or recent notification for this project already exists
      const existing = await db.notification.findFirst({
        where: {
          userId,
          link,
          createdAt: { gte: oneDayAgo },
          type: { in: ["ALERT", "WARNING"] },
        },
      });

      if (!existing) {
        await db.notification.create({
          data: {
            userId,
            title,
            message,
            type,
            link,
          },
        });

        // Send email alert asynchronously without blocking
        const user = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (user?.email) {
          void sendEmail({
            to: user.email,
            subject: `[Yakunex CPMS] ${title}`,
            html: deadlineEmailHtml(p.name, fmtDate(p.deadline), days, link),
          });
        }
      }
    }
  } catch (error) {
    console.error("[Notifications] Failed checking deadline notifications:", error);
  }
}
