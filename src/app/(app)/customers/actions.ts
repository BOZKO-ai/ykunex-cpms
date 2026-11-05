"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor } from "@/lib/auth";
import { FIX_MESSAGE, toValues, validate, type FormState } from "@/lib/forms";
import { customerSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { logger } from "@/lib/logger";

export async function saveCustomer(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireEditor();
  const v = validate(customerSchema, fd);
  if (!("data" in v)) return v.state;

  const [status, existing] = await Promise.all([
    db.listItem.findFirst({ where: { id: v.data.statusId, list: "CUSTOMER_STATUS" } }),
    id ? db.customer.findUnique({ where: { id }, select: { statusId: true } }) : Promise.resolve(null),
  ]);
  if (!status || (!status.active && status.id !== existing?.statusId)) {
    return { errors: { statusId: "Choose a valid status" }, values: toValues(fd), message: FIX_MESSAGE };
  }

  try {
    const saved = await db.$transaction(async (tx) => {
      const c = id
        ? await tx.customer.update({ where: { id }, data: v.data })
        : await tx.customer.create({ data: v.data });

      await tx.activity.create({
        data: {
          userId: user.uid,
          action: id ? "update" : "create",
          entity: "customer",
          entityId: c.id,
          summary: `${id ? "Updated" : "Added"} customer "${c.name}"`,
        },
      });
      return c;
    });
    revalidatePath("/customers");
    redirect(`/customers/${saved.id}`);
  } catch (e) {
    logger.error("Failed to save customer", e, { userId: user.uid, customerId: id });
    return { errors: {}, values: toValues(fd), message: "An error occurred while saving. Please try again." };
  }
}

export async function setCustomerArchived(id: number, archived: boolean): Promise<void> {
  const user = await requireEditor();
  try {
    await db.$transaction(async (tx) => {
      const c = await tx.customer.update({ where: { id }, data: { archived } });
      await tx.activity.create({
        data: {
          userId: user.uid,
          action: archived ? "archive" : "restore",
          entity: "customer",
          entityId: id,
          summary: `${archived ? "Archived" : "Restored"} customer "${c.name}"`,
        },
      });
    });
  } catch (e) {
    logger.error("Failed to archive/restore customer", e, { userId: user.uid, customerId: id });
  }
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
