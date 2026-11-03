import type { z } from "zod";

export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

/** Plain string fields of a FormData (files are skipped). */
export function toValues(fd: FormData): Record<string, string> {
  const v: Record<string, string> = {};
  fd.forEach((val, k) => {
    if (typeof val === "string") v[k] = val;
  });
  return v;
}

export const FIX_MESSAGE = "Please fix the highlighted fields and save again.";

/** Validates a form with a zod schema. Returns parsed data, or a ready-to-return form state with friendly errors. */
export function validate<T extends z.ZodTypeAny>(
  schema: T,
  fd: FormData,
): { data: z.output<T> } | { state: FormState } {
  const values = toValues(fd);
  const r = schema.safeParse(values);
  if (r.success) return { data: r.data };
  const errors: Record<string, string> = {};
  for (const issue of r.error.issues) {
    const key = issue.path.length ? String(issue.path[0]) : "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { state: { errors, values, message: FIX_MESSAGE } };
}
