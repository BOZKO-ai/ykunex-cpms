// All dates are stored as UTC midnight ("date only"), so we format in UTC to avoid off-by-one days.
export const DAY = 86_400_000;

export function todayUTC(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
}

/** Parses "YYYY-MM-DD" strictly. Returns null for anything else (including 2026-02-31). */
export function parseDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s ? null : d;
}

export function toInputDate(d: Date | null | undefined): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

export function fmtDate(d: Date | null | undefined): string {
  return d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
}

export function fmtDateTime(d: Date): string {
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Whole days from today until `d` (negative = in the past). */
export function daysUntil(d: Date): number {
  return Math.round((d.getTime() - todayUTC().getTime()) / DAY);
}
