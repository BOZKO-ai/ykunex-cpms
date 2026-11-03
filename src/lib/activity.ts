import { db } from "./db";

export async function logActivity(
  userId: number,
  action: string,
  entity: string,
  entityId: number | null,
  summary: string,
  details?: string,
): Promise<void> {
  await db.activity.create({ data: { userId, action, entity, entityId, summary, details } });
}
