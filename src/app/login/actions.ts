"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { validate, type FormState } from "@/lib/forms";
import { loginSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";

// Persistent brute-force guard: 5 failures => 5 minute lock for that email.
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60_000;

export async function loginAction(_: FormState, fd: FormData): Promise<FormState> {
  const v = validate(loginSchema, fd);
  if (!("data" in v)) return { ...v.state, values: { email: v.state.values?.email ?? "" } };

  const email = v.data.email.toLowerCase();
  const rec = await db.loginAttempt.findUnique({ where: { email } });
  if (rec?.lockedUntil && rec.lockedUntil > new Date()) {
    return { message: "Too many failed attempts. Please wait a few minutes and try again.", values: { email } };
  }

  const user = await db.user.findUnique({ where: { email } });
  const ok = !!user && user.active && (await bcrypt.compare(v.data.password, user.passwordHash));
  if (!ok || !user) {
    const expired = rec?.lockedUntil ? rec.lockedUntil <= new Date() : false;
    const count = (expired ? 0 : rec?.count ?? 0) + 1;
    const lockedUntil = count >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
    await db.loginAttempt.upsert({
      where: { email },
      update: { count, lockedUntil },
      create: { email, count, lockedUntil },
    });
    return { message: "Incorrect email or password.", values: { email } };
  }

  if (rec) await db.loginAttempt.delete({ where: { email } }).catch(() => {});
  await createSession({ uid: user.id, name: user.name, role: user.role === "ADMIN" ? "ADMIN" : "STAFF" });
  await logActivity(user.id, "login", "user", user.id, `${user.name} signed in`);
  redirect("/");
}
