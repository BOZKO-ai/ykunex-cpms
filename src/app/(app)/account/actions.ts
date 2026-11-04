"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { validate, type FormState } from "@/lib/forms";
import { passwordChangeSchema, userProfileSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { parseDate } from "@/lib/dates";
import { saveFile } from "@/lib/storage";

export async function updateProfile(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const v = validate(userProfileSchema, fd);
  if (!("data" in v)) return v.state;

  let image = v.data.image || null;
  if (image && image.startsWith("data:")) {
    image = await saveFile(image, "profile.jpg");
  }

  const data = {
    name: v.data.name,
    phone: v.data.phone,
    bio: v.data.bio,
    department: v.data.department,
    birthDate: v.data.birthDate ? parseDate(v.data.birthDate) : null,
    image,
  };

  await db.user.update({
    where: { id: user.uid },
    data,
  });

  await logActivity(user.uid, "update", "user", user.uid, `${user.name} updated their profile details`);
  revalidatePath("/account");
  revalidatePath("/", "layout");
  return { ok: true, message: "Profile updated successfully." };
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const v = validate(passwordChangeSchema, fd);
  if (!("data" in v)) return v.state;

  const me = await db.user.findUnique({ where: { id: user.uid } });
  const ok = !!me && (await bcrypt.compare(v.data.currentPassword, me.passwordHash));
  if (!ok) return { errors: { currentPassword: "Your current password is incorrect" }, message: "Please fix the highlighted fields." };

  await db.user.update({
    where: { id: user.uid },
    data: { passwordHash: await bcrypt.hash(v.data.newPassword, 10) },
  });
  await logActivity(user.uid, "update", "user", user.uid, `${user.name} changed their password`);
  return { ok: true, message: "Password updated." };
}
