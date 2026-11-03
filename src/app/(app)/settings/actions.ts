"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { FIX_MESSAGE, toValues, validate, type FormState } from "@/lib/forms";
import { brandingSchema, listItemSchema } from "@/lib/validation";
import { saveSettings } from "@/lib/settings";
import { logActivity } from "@/lib/activity";

const LIST_KEYS = ["SERVICE_AREA", "CUSTOMER_STATUS", "PROJECT_STATUS"];
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const MAX_LOGO = 300 * 1024;

const isDuplicate = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export async function saveBranding(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const v = validate(brandingSchema, fd);
  if (!("data" in v)) return v.state;

  const entries: Record<string, string> = {
    companyName: v.data.companyName,
    primaryColor: v.data.primaryColor,
    accentColor: v.data.accentColor,
    dueSoonDays: String(v.data.dueSoonDays),
  };

  const logo = fd.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (!LOGO_TYPES.includes(logo.type)) {
      return { errors: { logo: "Logo must be a PNG, JPG, WebP or SVG image" }, values: toValues(fd), message: FIX_MESSAGE };
    }
    if (logo.size > MAX_LOGO) {
      return { errors: { logo: "Logo must be smaller than 300 KB" }, values: toValues(fd), message: FIX_MESSAGE };
    }
    // Stored as a data URL in the DB so it works with `next start` and needs no upload folder.
    entries.logoDataUrl = `data:${logo.type};base64,${Buffer.from(await logo.arrayBuffer()).toString("base64")}`;
  } else if (fd.get("removeLogo") === "on") {
    entries.logoDataUrl = "";
  }

  await saveSettings(entries);
  await logActivity(user.uid, "update", "settings", null, "Updated branding and general settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}

export async function addListItem(list: string, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireAdmin();
  if (!LIST_KEYS.includes(list)) return { message: "Unknown list." };
  const v = validate(listItemSchema, fd);
  if (!("data" in v)) return v.state;
  const last = await db.listItem.findFirst({ where: { list }, orderBy: { sortOrder: "desc" } });
  try {
    await db.listItem.create({
      data: {
        list,
        label: v.data.label,
        color: v.data.color,
        isClosed: list === "PROJECT_STATUS" && fd.get("isClosed") === "on",
        sortOrder: (last?.sortOrder ?? 0) + 1,
      },
    });
  } catch (e) {
    if (isDuplicate(e)) return { errors: { label: "That name already exists in this list" }, values: toValues(fd), message: FIX_MESSAGE };
    throw e;
  }
  await logActivity(user.uid, "create", "settings", null, `Added "${v.data.label}" to ${list.toLowerCase().replace("_", " ")}`);
  revalidatePath("/settings");
  return { ok: true, message: `Added "${v.data.label}".` };
}

export async function updateListItem(id: number, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireAdmin();
  const v = validate(listItemSchema, fd);
  if (!("data" in v)) return v.state;
  const item = await db.listItem.findUnique({ where: { id } });
  if (!item) return { message: "That item no longer exists." };
  try {
    await db.listItem.update({
      where: { id },
      data: {
        label: v.data.label,
        ...(fd.has("color") ? { color: v.data.color } : {}),
        ...(item.list === "PROJECT_STATUS" ? { isClosed: fd.get("isClosed") === "on" } : {}),
      },
    });
  } catch (e) {
    if (isDuplicate(e)) return { errors: { label: "That name already exists in this list" }, values: toValues(fd), message: FIX_MESSAGE };
    throw e;
  }
  await logActivity(user.uid, "update", "settings", id, `Renamed/updated "${item.label}" to "${v.data.label}"`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved." };
}

export async function toggleListItem(id: number): Promise<void> {
  const user = await requireAdmin();
  const item = await db.listItem.findUnique({ where: { id } });
  if (!item) return;
  if (item.active) {
    // Never leave a dropdown empty.
    const activeCount = await db.listItem.count({ where: { list: item.list, active: true } });
    if (activeCount <= 1) return;
  }
  await db.listItem.update({ where: { id }, data: { active: !item.active } });
  await logActivity(user.uid, "update", "settings", id, `${item.active ? "Disabled" : "Enabled"} "${item.label}"`);
  revalidatePath("/", "layout");
}
