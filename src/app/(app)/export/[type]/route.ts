import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { toInputDate } from "@/lib/dates";

type Cell = string | number | boolean | null | undefined;

// Escapes quotes/commas and neutralises spreadsheet formulas (=, +, -, @) so exported text can't run in Excel.
function toCsv(rows: Cell[][]): string {
  const esc = (v: Cell) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  if (!(await getSession())) return new Response("Please sign in first.", { status: 401 });
  const { type } = await params;
  let rows: Cell[][];

  if (type === "customers") {
    const data = await db.customer.findMany({ orderBy: { name: "asc" }, include: { status: true } });
    rows = [
      ["ID", "Name", "Contact person", "Email", "Phone", "Address", "Type", "Status", "Archived", "Notes", "Date added"],
      ...data.map((c) => [c.id, c.name, c.contactPerson, c.email, c.phone, c.address, c.type, c.status.label, c.archived ? "Yes" : "No", c.notes, toInputDate(c.createdAt)]),
    ];
  } else if (type === "projects") {
    const data = await db.project.findMany({
      orderBy: { deadline: "asc" },
      include: { customer: true, status: true, serviceArea: true, assignedTo: true },
    });
    rows = [
      ["ID", "Project", "Customer", "Service area", "Status", "Start date", "Deadline", "Progress %", "Budget (LKR)", "Assigned to", "Archived", "Description"],
      ...data.map((p) => [p.id, p.name, p.customer.name, p.serviceArea.label, p.status.label, toInputDate(p.startDate), toInputDate(p.deadline), p.progress, p.budget, p.assignedTo?.name ?? "", p.archived ? "Yes" : "No", p.description]),
    ];
  } else {
    return new Response("Unknown export type.", { status: 404 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
