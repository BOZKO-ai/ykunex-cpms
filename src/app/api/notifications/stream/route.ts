import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkAndCreateDeadlineNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.uid;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;

      req.signal.addEventListener("abort", () => {
        active = false;
        try { controller.close(); } catch {}
      });

      // Initial deadline check
      await checkAndCreateDeadlineNotifications(userId);

      // Send initial data
      try {
        const initial = await db.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 30,
        });
        const payload = JSON.stringify(initial.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      } catch (err) {
        console.error("[SSE] Error sending initial notifications:", err);
      }

      // Keep connection alive with periodic check & heartbeat every 15s
      const interval = setInterval(async () => {
        if (!active) {
          clearInterval(interval);
          return;
        }

        try {
          // Check for notifications
          const notifs = await db.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 30,
          });
          const payload = JSON.stringify(notifs.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (err) {
          // Send ping heartbeat if DB error or idle
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {}
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

