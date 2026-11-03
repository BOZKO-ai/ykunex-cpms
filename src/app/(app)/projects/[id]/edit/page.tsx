import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getList } from "@/lib/lists";
import { ProjectForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { saveProject } from "../../actions";

export const metadata = { title: "Edit project" };

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const p = await db.project.findUnique({ where: { id } });
  if (!p) notFound();
  const [customers, areas, statuses, users] = await Promise.all([
    db.customer.findMany({
      where: { OR: [{ archived: false }, { id: p.customerId }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getList("SERVICE_AREA", [p.serviceAreaId]),
    getList("PROJECT_STATUS", [p.statusId]),
    db.user.findMany({
      where: { OR: [{ active: true }, { id: p.assignedToId ?? -1 }] },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return (
    <>
      <PageHeader title={`Edit ${p.name}`} subtitle="Fields marked * are required." />
      <ProjectForm
        action={saveProject.bind(null, p.id)}
        project={p}
        customers={customers.map((c) => ({ id: c.id, label: c.name }))}
        areas={areas.map((a) => ({ id: a.id, label: a.label }))}
        statuses={statuses.map((s) => ({ id: s.id, label: s.label }))}
        users={users.map((u) => ({ id: u.id, label: u.name }))}
        cancelHref={`/projects/${p.id}`}
      />
    </>
  );
}
