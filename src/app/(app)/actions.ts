"use server";

import { redirect } from "next/navigation";
import { destroySession, requireUser } from "@/lib/auth";
import { markAllAsRead, markAsRead } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

export async function markNotificationRead(id: number): Promise<void> {
  await requireUser();
  await markAsRead(id);
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await markAllAsRead(user.uid);
  revalidatePath("/", "layout");
}
