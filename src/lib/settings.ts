import { cache } from "react";
import { db } from "./db";

export const DEFAULTS = {
  companyName: "Yakunex Technologies (Pvt) Ltd",
  primaryColor: "#fbbf24",
  accentColor: "#020617",
  logoDataUrl: "/logo.svg",
  dueSoonDays: "7",
};

export type AppSettings = {
  companyName: string;
  primaryColor: string;
  accentColor: string;
  logoDataUrl: string;
  dueSoonDays: number;
};

export const getSettings = cache(async (): Promise<AppSettings> => {
  const m: Record<string, string> = { ...DEFAULTS };
  try {
    const rows = await db.setting.findMany();
    for (const r of rows) if (r.key in m) m[r.key] = r.value;
  } catch (error) {
    console.error("[Settings] Failed to fetch settings from DB, using defaults:", error instanceof Error ? error.message : error);
  }
  return {
    companyName: m.companyName,
    primaryColor: m.primaryColor,
    accentColor: m.accentColor,
    logoDataUrl: m.logoDataUrl,
    dueSoonDays: Number(m.dueSoonDays) || 7,
  };
});

export async function saveSettings(entries: Record<string, string>): Promise<void> {
  await db.$transaction(
    Object.entries(entries).map(([key, value]) =>
      db.setting.upsert({ where: { key }, update: { value }, create: { key, value } }),
    ),
  );
}
