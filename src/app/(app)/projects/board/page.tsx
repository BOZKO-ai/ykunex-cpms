import Link from "next/link";
import { db } from "@/lib/db";
import { getAllList } from "@/lib/lists";
import { PageHeader } from "@/components/ui";
import { KanbanBoard } from "./kanban-client";
import { LayoutGrid, List } from "lucide-react";

export const metadata = { title: "Project Board" };

export default async function ProjectBoard() {
  const [statuses, projects] = await Promise.all([
    getAllList("PROJECT_STATUS"),
    db.project.findMany({
      where: { archived: false },
      include: { customer: true, status: true, assignedTo: true },
      orderBy: { deadline: "asc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="Project Board" subtitle="Manage your project workflow with drag-and-drop.">
        <Link href="/projects" className="btn">
          <List size={18} style={{ marginRight: "0.5rem" }} />
          List View
        </Link>
        <Link href="/projects/new" className="btn btn-primary">
          Add project
        </Link>
      </PageHeader>

      <KanbanBoard statuses={statuses} projects={projects} />
    </>
  );
}
