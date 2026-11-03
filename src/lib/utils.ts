export type SP = Record<string, string | string[] | undefined>;

export const PAGE_SIZE = 15;

export const one = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

export function toInt(v: string, fallback = 0): number {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | null | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `?${s}` : "";
}

export const money = (n: number | null | undefined): string =>
  n === null || n === undefined ? "—" : `LKR ${n.toLocaleString("en-US")}`;

export const TYPE_LABEL: Record<string, string> = { BUSINESS: "Business", INDIVIDUAL: "Individual" };
