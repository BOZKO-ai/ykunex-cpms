import { db } from "@/lib/db";
import { requireManager } from "@/lib/auth";
import { getList } from "@/lib/lists";
import { ProjectForm } from "@/components/forms";
import { PageHeader } from "@/components/ui";
import { one, toInt, type SP } from "@/lib/utils";
import { saveProject } from "../actions";

export const metadata = { title: "Add project" };

export default async function NewProjectPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireManager();
  const sp = await searchParams;
  const [customers, areas, statuses, users] = await Promise.all([
    db.customer.findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    getList("SERVICE_AREA"),
    getList("PROJECT_STATUS"),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  return (
    <>
      <PageHeader title="Add project" subtitle="Fields marked * are required." />
      <ProjectForm
        action={saveProject.bind(null, null)}
        defaultCustomerId={toInt(one(sp.customerId)) || undefined}
        customers={customers.map((c) => ({ id: c.id, label: c.name }))}
        areas={areas.map((a) => ({ id: a.id, label: a.label }))}
        statuses={statuses.map((s) => ({ id: s.id, label: s.label }))}
        users={users.map((u) => ({ id: u.id, label: u.name }))}
        cancelHref="/projects"
      />
    </>
  );
}
