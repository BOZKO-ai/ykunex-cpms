"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireEditor, requireManager } from "@/lib/auth";
import { parseDate } from "@/lib/dates";
import { FIX_MESSAGE, toValues, validate, type FormState } from "@/lib/forms";
import { paymentSchema, projectSchema, taskSchema, updateSchema } from "@/lib/validation";
import { logActivity } from "@/lib/activity";
import { notify } from "@/lib/notifications";
import { logger } from "@/lib/logger";

export async function saveProject(id: number | null, _: FormState, fd: FormData): Promise<FormState> {
  const user = id ? await requireEditor() : await requireManager();
  const v = validate(projectSchema, fd);
  if (!("data" in v)) return v.state;
  const d = v.data;

  // Never trust the ids that came from the browser: check they really exist (and belong to the right list).
  const [customer, area, status, assignee, existing] = await Promise.all([
    db.customer.findUnique({ where: { id: d.customerId } }),
    db.listItem.findFirst({ where: { id: d.serviceAreaId, list: "SERVICE_AREA" } }),
    db.listItem.findFirst({ where: { id: d.statusId, list: "PROJECT_STATUS" } }),
    d.assignedToId ? db.user.findUnique({ where: { id: d.assignedToId } }) : Promise.resolve(null),
    id ? db.project.findUnique({ where: { id }, select: { serviceAreaId: true, statusId: true } }) : Promise.resolve(null),
  ]);
  const errors: Record<string, string> = {};
  if (!customer) errors.customerId = "Choose a valid customer";
  if (!area || (!area.active && area.id !== existing?.serviceAreaId)) errors.serviceAreaId = "Choose a valid service area";
  if (!status || (!status.active && status.id !== existing?.statusId)) errors.statusId = "Choose a valid status";
  if (d.assignedToId && !assignee) errors.assignedToId = "Choose a valid staff member";
  if (Object.keys(errors).length) return { errors, values: toValues(fd), message: FIX_MESSAGE };

  const data = {
    name: d.name,
    description: d.description,
    customerId: d.customerId,
    serviceAreaId: d.serviceAreaId,
    statusId: d.statusId,
    startDate: parseDate(d.startDate)!,
    deadline: parseDate(d.deadline)!,
    progress: d.progress,
    budget: d.budget,
    assignedToId: d.assignedToId,
  };

  let changes: string[] = [];
  const prev = id ? await db.project.findUnique({ where: { id }, include: { status: true, serviceArea: true } }) : null;
  if (prev) {
    if (prev.name !== d.name) changes.push(`Name: "${prev.name}" → "${d.name}"`);
    if (prev.statusId !== d.statusId) {
      const newStatus = await db.listItem.findUnique({ where: { id: d.statusId } });
      changes.push(`Status: "${prev.status.label}" → "${newStatus?.label}"`);
    }
    if (prev.progress !== d.progress) changes.push(`Progress: ${prev.progress}% → ${d.progress}%`);
    if (prev.budget !== d.budget) changes.push(`Budget: ${prev.budget} → ${d.budget}`);
  }

  const saved = await db.$transaction(async (tx) => {
    const p = id
      ? await tx.project.update({ where: { id }, data })
      : await tx.project.create({ data });

    await tx.activity.create({
      data: {
        userId: user.uid,
        action: id ? "update" : "create",
        entity: "project",
        entityId: p.id,
        summary: `${id ? "Updated" : "Added"} project "${p.name}"`,
        details: changes.length > 0 ? changes.join("\n") : undefined,
      },
    });

    if (p.assignedToId && p.assignedToId !== user.uid) {
      const isNewAssignee = !id ? true : (prev?.assignedToId !== p.assignedToId);
      if (isNewAssignee) {
        await tx.notification.create({
          data: {
            userId: p.assignedToId,
            title: "Project Assigned",
            message: `You have been assigned to project "${p.name}" by ${user.name}.`,
            type: "INFO",
            link: `/projects/${p.id}`,
          },
        });
      }

      if (id && prev && prev.statusId !== p.statusId) {
        const newStatus = await tx.listItem.findUnique({ where: { id: p.statusId } });
        await tx.notification.create({
          data: {
            userId: p.assignedToId,
            title: "Project Status Changed",
            message: `${user.name} changed status of "${p.name}" to "${newStatus?.label ?? "Updated"}".`,
            type: "INFO",
            link: `/projects/${p.id}`,
          },
        });
      }
    }

    return p;
  }).catch((e) => {
    logger.error("Failed to save project", e, { userId: user.uid, projectId: id });
    return null;
  });

  if (!saved) return { errors, values: toValues(fd), message: "Could not save the project. Please check the highlighted fields and try again." };

  revalidatePath("/projects");
  revalidatePath("/");
  redirect(`/projects/${saved.id}`);
}

export async function setProjectArchived(id: number, archived: boolean): Promise<void> {
  const user = await requireManager();
  const p = await db.project.update({ where: { id }, data: { archived } });
  await logActivity(user.uid, archived ? "archive" : "restore", "project", id, `${archived ? "Archived" : "Restored"} project "${p.name}"`);
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/");
}

export async function addUpdate(projectId: number, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireEditor();
  const v = validate(updateSchema, fd);
  if (!("data" in v)) return v.state;

  try {
    await db.$transaction(async (tx) => {
      const update = await tx.projectUpdate.create({
        data: {
          projectId,
          authorId: user.uid,
          note: v.data.note,
          progress: v.data.progress,
        },
      });

      if (v.data.progress !== null) {
        await tx.project.update({ where: { id: projectId }, data: { progress: v.data.progress } });
      }

      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "create",
          entity: "update",
          entityId: update.id,
          summary: `Posted update on project #${projectId}`,
          details: v.data.note,
        },
      });

      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (project?.assignedToId && project.assignedToId !== user.uid) {
        await tx.notification.create({
          data: {
            userId: project.assignedToId,
            title: "New Project Update",
            message: `${user.name} posted a new update on your project "${project.name}".`,
            type: "INFO",
            link: `/projects/${projectId}`,
          },
        });
      }
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath("/");
    return { ok: true, message: "Update posted." };
  } catch (e) {
    logger.error("Failed to add update", e, { userId: user.uid, projectId });
    return { errors: {}, message: "Could not post update." };
  }
}

export async function addTask(projectId: number, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireEditor();
  const v = validate(taskSchema, fd);
  if (!("data" in v)) return v.state;

  try {
    await db.$transaction(async (tx) => {
      const assignee = v.data.assigneeId
        ? await tx.user.findUnique({ where: { id: v.data.assigneeId }, select: { id: true, active: true } })
        : null;
      if (v.data.assigneeId && (!assignee || !assignee.active)) {
        throw new Error("Choose a valid active staff member.");
      }
      const task = await tx.task.create({
        data: {
          projectId,
          title: v.data.title,
          priority: v.data.priority,
          deadline: v.data.deadline ? parseDate(v.data.deadline) : null,
          assigneeId: v.data.assigneeId,
        },
      });
      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "create",
          entity: "task",
          entityId: task.id,
          summary: `Added task "${task.title}" to project #${projectId}`,
        },
      });

      const project = await tx.project.findUnique({ where: { id: projectId } });
      if (project?.assignedToId && project.assignedToId !== user.uid) {
        await tx.notification.create({
          data: {
            userId: project.assignedToId,
            title: "New Task Added",
            message: `${user.name} added task "${task.title}" to project "${project.name}".`,
            type: "INFO",
            link: `/projects/${projectId}`,
          },
        });
      }
      if (task.assigneeId && task.assigneeId !== user.uid) {
        await tx.notification.create({
          data: {
            userId: task.assigneeId,
            title: "Task Assigned",
            message: `${user.name} assigned you task "${task.title}".`,
            type: "INFO",
            link: `/projects/${projectId}`,
          },
        });
      }
    });
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, message: "Task added." };
  } catch (e) {
    logger.error("Failed to add task", e, { userId: user.uid, projectId });
    return { errors: {}, message: "Could not add task." };
  }
}

async function toggleTask(taskId: number): Promise<void> {
  await requireEditor();
  const t = await db.task.findUnique({ where: { id: taskId } });
  if (!t) return;
  await db.task.update({ where: { id: taskId }, data: { done: !t.done } });
  revalidatePath(`/projects/${t.projectId}`);
}

export async function toggleTaskFromForm(fd: FormData): Promise<void> {
  const taskId = Number(fd.get("taskId"));
  if (!Number.isInteger(taskId) || taskId <= 0) {
    throw new Error("Invalid task id");
  }
  await toggleTask(taskId);
}

export async function updateProjectStatus(id: number, statusId: number): Promise<void> {
  const user = await requireEditor();
  const [project, status] = await Promise.all([
    db.project.findUnique({ where: { id } }),
    db.listItem.findFirst({ where: { id: statusId, list: "PROJECT_STATUS" } }),
  ]);
  if (!project || !status) return;

  await db.project.update({ where: { id }, data: { statusId } });
  await logActivity(user.uid, "update", "project", id, `Moved project "${project.name}" to "${status.label}"`);

  if (project.assignedToId && project.assignedToId !== user.uid) {
    await db.notification.create({
      data: {
        userId: project.assignedToId,
        title: "Project Status Updated",
        message: `${user.name} moved project "${project.name}" to "${status.label}".`,
        type: "INFO",
        link: `/projects/${project.id}`,
      },
    });
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/projects/board");
  revalidatePath("/");
}

export async function deleteTask(projectId: number, taskId: number, _fd: FormData): Promise<void> {
  const user = await requireEditor();
  try {
    await db.$transaction(async (tx) => {
      await tx.task.delete({ where: { id: taskId } });
      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "delete",
          entity: "task",
          entityId: taskId,
          summary: `Deleted task from project #${projectId}`,
        },
      });
    });
  } catch (e) {
    logger.error("Failed to delete task", e, { userId: user.uid, taskId });
  }
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}

import { saveFile, deleteFile } from "@/lib/storage";

export async function addDocument(projectId: number, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireEditor();
  const name = fd.get("name") as string;
  const type = fd.get("type") as string;
  const size = Number(fd.get("size"));
  const rawData = fd.get("data") as string;

  if (!name || !rawData) return { errors: {}, message: "File name and data are required." };

  try {
    const data = await saveFile(rawData, name);
    await db.$transaction(async (tx) => {
      const doc = await (tx.projectDocument as any).create({
        data: { projectId, name, type, size, data },
      });

      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "create",
          entity: "document",
          entityId: doc.id,
          summary: `Attached document "${name}" to project #${projectId}`,
        },
      });
    });
    revalidatePath(`/projects/${projectId}`);
    return { ok: true, message: "Document attached." };
  } catch (e) {
    logger.error("Failed to attach document", e, { userId: user.uid, projectId });
    return { errors: {}, message: "Could not attach document. Please try again." };
  }
}

export async function deleteDocument(projectId: number, documentId: number): Promise<void> {
  const user = await requireEditor();
  try {
    await db.$transaction(async (tx) => {
      const doc = await (tx.projectDocument as any).delete({ where: { id: documentId } });
      if (doc?.data) await deleteFile(doc.data);
      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "delete",
          entity: "document",
          entityId: documentId,
          summary: `Deleted document "${doc.name}" from project #${projectId}`,
        },
      });
    });
    revalidatePath(`/projects/${projectId}`);
  } catch (e) {
    logger.error("Failed to delete document", e, { userId: user.uid, documentId });
  }
}

export async function addPayment(projectId: number, _: FormState, fd: FormData): Promise<FormState> {
  const user = await requireEditor();
  const v = validate(paymentSchema, fd);
  if (!("data" in v)) return v.state;
  const project = await db.project.findUnique({ where: { id: projectId } });
  if (!project) return { message: "This project no longer exists." };

  // Never let the ledger go over the agreed budget.
  if (project.budget !== null && project.paidAmount + v.data.amount > project.budget + 0.005) {
    const left = Math.max(0, project.budget - project.paidAmount);
    return {
      errors: { amount: `This is more than the balance. Remaining: LKR ${left.toLocaleString("en-US")}` },
      values: toValues(fd),
      message: FIX_MESSAGE,
    };
  }

  await db.$transaction([
    db.payment.create({
      data: {
        projectId,
        amount: v.data.amount,
        paidOn: parseDate(v.data.paidOn)!,
        method: v.data.method,
        reference: v.data.reference,
        note: v.data.note,
      },
    }),
    db.project.update({ where: { id: projectId }, data: { paidAmount: { increment: v.data.amount } } }),
  ]);
  await logActivity(user.uid, "create", "payment", projectId, `Recorded payment LKR ${v.data.amount.toLocaleString("en-US")} on "${project.name}"`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
  return { ok: true, message: "Payment recorded." };
}

export async function deletePayment(projectId: number, paymentId: number): Promise<void> {
  const user = await requireManager();
  const pay = await db.payment.findUnique({ where: { id: paymentId } });
  if (!pay || pay.projectId !== projectId) return;
  await db.$transaction([
    db.payment.delete({ where: { id: paymentId } }),
    db.project.update({ where: { id: projectId }, data: { paidAmount: { decrement: pay.amount } } }),
  ]);
  await logActivity(user.uid, "delete", "payment", projectId, `Removed payment LKR ${pay.amount.toLocaleString("en-US")} from project #${projectId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/");
}
