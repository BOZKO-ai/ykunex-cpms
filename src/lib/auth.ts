import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "./db";

export const SESSION_COOKIE = "yakunex_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export type Role = "ADMIN" | "MANAGER" | "STAFF" | "VIEWER";

export type Session = { uid: number; name: string; role: Role };

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET is missing or too short. Copy .env.example to .env and restart.");
  }
  return new TextEncoder().encode(s);
}

export async function createSession(s: Session): Promise<void> {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Reads the signed cookie only (no DB hit). Use requireUser() to protect pages and actions. */
export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    return { 
      uid: Number(payload.uid), 
      name: String(payload.name), 
      role: payload.role as Role 
    };
  } catch {
    return null;
  }
}

/** Every page and server action calls this: cookie must be valid AND the user must still exist and be active. */
export async function requireUser(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  const u = await db.user.findUnique({ where: { id: s.uid } });
  if (!u || !u.active) redirect("/login");
  return { uid: u.id, name: u.name, role: u.role as Role };
}

export async function requireAdmin(): Promise<Session> {
  const u = await requireUser();
  if (u.role !== "ADMIN") redirect("/?denied=1");
  return u;
}

export async function requireManager(): Promise<Session> {
  const u = await requireUser();
  if (u.role !== "ADMIN" && u.role !== "MANAGER") redirect("/?denied=1");
  return u;
}

/** 
 * Returns true if the user has permission to edit/modify data.
 * VIEWER role is read-only.
 */
export function canEdit(user: Session): boolean {
  return user.role !== "VIEWER";
}

/**
 * Returns true if the user has elevated management permissions.
 */
export function isManager(user: Session): boolean {
  return user.role === "ADMIN" || user.role === "MANAGER";
}
