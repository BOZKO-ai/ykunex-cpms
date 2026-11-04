"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { validate, type FormState } from "@/lib/forms";
import { userCreateSchema, userUpdateSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function saveUser(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const schema = id ? userUpdateSchema : userCreateSchema;
  const v = validate(schema, fd);
  if (!("data" in v)) return v.state;

  const { name, email, role } = v.data;
  const password = "password" in v.data && typeof v.data.password === "string" ? v.data.password : undefined;

  try {
    await db.$transaction(async (tx) => {
      if (id) {
        await tx.user.update({
          where: { id },
          data: { name, email, role },
        });
        await tx.activity.create({
          data: {
            userId: admin.uid,
            action: "update",
            entity: "user",
            entityId: id,
            summary: `Updated user "${name}"`,
          },
        });
      } else {
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            role,
            passwordHash: await bcrypt.hash(password!, 10),
          },
        });
        await tx.activity.create({
          data: {
            userId: admin.uid,
            action: "create",
            entity: "user",
            entityId: newUser.id,
            summary: `Created user "${name}"`,
          },
        });
        await tx.notification.create({
          data: {
            userId: newUser.id,
            title: "Welcome to Yakunex CPMS",
            message: `Welcome aboard, ${name}! Your account has been set up with the ${role} role.`,
            type: "SUCCESS",
          },
        });
      }
    });
  } catch (e: any) {
    if (e.code === "P2002") {
      return { errors: { email: "This email is already in use" }, message: "Please fix the highlighted fields." };
    }
    logger.error("Failed to save user", e, { adminId: admin.uid, userId: id });
    return { errors: {}, message: "An unexpected error occurred. Please try again later." };
  }

  revalidatePath("/users");
  return { ok: true, message: id ? "User updated." : "User created." };
}

export async function toggleUserActive(id: number): Promise<void> {
  const admin = await requireAdmin();
  if (id === admin.uid) return; // Cannot disable self

  try {
    await db.$transaction(async (tx) => {
      const u = await tx.user.findUnique({ where: { id } });
      if (!u) return;

      await tx.user.update({
        where: { id },
        data: { active: !u.active },
      });

      await tx.activity.create({
        data: {
          userId: admin.uid,
          action: "update",
          entity: "user",
          entityId: id,
          summary: `${u.active ? "Disabled" : "Enabled"} user "${u.name}"`,
        },
      });

      if (!u.active) {
        await tx.notification.create({
          data: {
            userId: id,
            title: "Account Enabled",
            message: "Your account has been enabled by an administrator.",
            type: "SUCCESS",
          },
        });
      }
    });
  } catch (e) {
    logger.error("Failed to toggle user status", e, { adminId: admin.uid, userId: id });
  }

  revalidatePath("/users");
}
