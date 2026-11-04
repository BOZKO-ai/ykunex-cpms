import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid project id" }, { status: 400 });
  }

  const fd = await req.formData();
  const note = fd.get("note") as string;
  if (!note) {
    return NextResponse.json({ error: "Note is required" }, { status: 400 });
  }

  try {
    await db.$transaction(async (tx) => {
      const update = await tx.projectUpdate.create({
        data: {
          projectId: id,
          authorId: user.uid,
          note,
        },
      });

      await tx.activity.create({
        data: {
          userId: user.uid,
          action: "create",
          entity: "update",
          entityId: update.id,
          summary: `Logged time on project #${id}`,
          details: note,
        },
      });
    });

    revalidatePath(`/projects/${id}`);
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to log time" }, { status: 500 });
  }
}

