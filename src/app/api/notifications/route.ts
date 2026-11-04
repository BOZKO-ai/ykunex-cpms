import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAndCreateDeadlineNotifications } from "@/lib/notifications";
import { rateLimit } from "@/lib/rate-limit";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rl = rateLimit(`notif-api-${session.uid}`, 60, 60_000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  await checkAndCreateDeadlineNotifications(session.uid);

  const notifications = await db.notification.findMany({
    where: { userId: session.uid },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json(notifications.map(n => ({
    ...n,
    createdAt: n.createdAt.toISOString()
  })));
}
