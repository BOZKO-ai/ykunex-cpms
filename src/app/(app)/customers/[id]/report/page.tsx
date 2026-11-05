import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate } from "@/lib/dates";
import { money, TYPE_LABEL } from "@/lib/utils";
import { PrintButton } from "../../../projects/[id]/report/print-button";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  return { title: `Customer Report #${(await props.params).id}` };
}

export default async function CustomerReportPage(props: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [c, s] = await Promise.all([
    db.customer.findUnique({
      where: { id },
      include: { status: true, projects: { orderBy: { deadline: "asc" }, include: { status: true, serviceArea: true } } },
    }),
    getSettings(),
  ]);
  if (!c) notFound();

  const live = c.projects.filter((p) => !p.archived);
  const open = live.filter((p) => !p.status.isClosed).length;
  const totalBudget = live.reduce((sum, p) => sum + (p.budget ?? 0), 0);
  const totalPaid = live.reduce((sum, p) => sum + p.paidAmount, 0);

  return (
    <div className="report-container">
      <div className="report-screen-bar no-print">
        <Link href={`/customers/${c.id}`} className="btn">
          <ArrowLeft size={16} /> Back to customer
        </Link>
        <PrintButton />
      </div>

      <div className="report-sheet">
        <header className="report-header">
          <div>
            <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700, color: "#0f172a" }}>{s.companyName}</h1>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Customer Summary Report</span>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>CUSTOMER #{c.id}</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Generated: {fmtDate(new Date())}</div>
          </div>
        </header>

        <hr className="report-divider" />

        <h2 style={{ fontSize: "1.5rem", margin: "0 0 0.75rem", color: "#0f172a" }}>{c.name}</h2>

        <div className="report-grid">
          <div className="report-card">
            <span className="report-card-label">Contact</span>
            <strong className="report-card-val">{c.contactPerson || "—"}</strong>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>{[c.email, c.phone].filter(Boolean).join(" · ") || "No contact details"}</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Type and status</span>
            <strong className="report-card-val">
              {TYPE_LABEL[c.type] ?? c.type} · {c.status.label}
            </strong>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Customer since {fmtDate(c.createdAt)}</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Projects</span>
            <strong className="report-card-val">
              {live.length} total · {open} open
            </strong>
          </div>
          <div className="report-card">
            <span className="report-card-label">Money</span>
            <strong className="report-card-val">{money(totalPaid)} received</strong>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>
              of {money(totalBudget)} · balance {money(Math.max(0, totalBudget - totalPaid))}
            </span>
          </div>
        </div>

        {c.address && (
          <p style={{ color: "#334155", fontSize: "0.9rem" }}>
            <strong>Address:</strong> {c.address}
          </p>
        )}
        {c.notes && (
          <p style={{ color: "#334155", fontSize: "0.9rem", whiteSpace: "pre-wrap" }}>
            <strong>Notes:</strong> {c.notes}
          </p>
        )}

        <h3 style={{ margin: "1.25rem 0 0.5rem", color: "#0f172a" }}>Projects</h3>
        {live.length === 0 ? (
          <p style={{ color: "#64748b" }}>No projects yet.</p>
        ) : (
          <table style={{ width: "100%", minWidth: 0, fontSize: "0.85rem", color: "#0f172a" }}>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Area</th>
                <th scope="col">Status</th>
                <th scope="col">Deadline</th>
                <th scope="col">Progress</th>
                <th scope="col">Budget</th>
                <th scope="col">Paid</th>
              </tr>
            </thead>
            <tbody>
              {live.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.serviceArea.label}</td>
                  <td>{p.status.label}</td>
                  <td>{fmtDate(p.deadline)}</td>
                  <td>{p.progress}%</td>
                  <td>{money(p.budget)}</td>
                  <td>{money(p.paidAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
