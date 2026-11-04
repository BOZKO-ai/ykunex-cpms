import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { Printer, ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { PrintButton } from "./print-button";

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return { title: `Project Report #${params.id}` };
}

export default async function ProjectReportPage(props: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await props.params).id);
  if (!Number.isInteger(id)) notFound();

  const [p, s] = await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        customer: true,
        status: true,
        serviceArea: true,
        assignedTo: true,
        updates: { orderBy: { createdAt: "desc" }, include: { author: true } },
        tasks: { orderBy: [{ done: "asc" }, { deadline: "asc" }, { id: "asc" }], include: { assignee: true } },
      },
    }),
    getSettings(),
  ]);

  if (!p) notFound();

  const totalTasks = p.tasks.length;
  const completedTasks = p.tasks.filter((t) => t.done).length;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="report-container">
      {/* Screen-only top action bar */}
      <div className="report-screen-bar no-print">
        <Link href={`/projects/${p.id}`} className="btn">
          <ArrowLeft size={16} /> Back to Project
        </Link>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <PrintButton />
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="report-sheet">
        {/* Header with branding */}
        <header className="report-header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt={s.companyName} style={{ width: "42px", height: "42px", objectFit: "contain" }} />
              <div>
                <h1 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700, color: "#0f172a" }}>{s.companyName}</h1>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Project Executive Summary & Report</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>REPORT #{p.id}</div>
            <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Generated: {fmtDate(new Date())}</div>
          </div>
        </header>

        <hr className="report-divider" />

        {/* Project Title & Overview */}
        <div style={{ marginBottom: "1.5rem" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", fontWeight: 600 }}>Project Title</span>
          <h2 style={{ fontSize: "1.5rem", margin: "0.25rem 0 0.5rem", color: "#0f172a" }}>{p.name}</h2>
          {p.description && (
            <p style={{ color: "#334155", fontSize: "0.95rem", lineHeight: 1.5, margin: 0 }}>{p.description}</p>
          )}
        </div>

        {/* Grid of Key Info */}
        <div className="report-grid">
          <div className="report-card">
            <span className="report-card-label">Customer / Client</span>
            <strong className="report-card-val">{p.customer.name}</strong>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginTop: "2px" }}>
              {p.customer.contactPerson || p.customer.email || "No contact info"}
            </span>
          </div>

          <div className="report-card">
            <span className="report-card-label">Status & Area</span>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "4px" }}>
              <span className="report-tag" style={{ background: "#e2e8f0", color: "#0f172a" }}>
                {p.status.label}
              </span>
              <span className="report-tag" style={{ background: "#fef3c7", color: "#92400e" }}>
                {p.serviceArea.label}
              </span>
            </div>
          </div>

          <div className="report-card">
            <span className="report-card-label">Timeline</span>
            <div style={{ fontSize: "0.85rem", color: "#0f172a", marginTop: "4px" }}>
              <div>Start: <strong>{fmtDate(p.startDate)}</strong></div>
              <div>Deadline: <strong>{fmtDate(p.deadline)}</strong></div>
            </div>
          </div>

          <div className="report-card">
            <span className="report-card-label">Budget (LKR)</span>
            <strong className="report-card-val" style={{ color: "#0f172a" }}>
              {p.budget ? `LKR ${p.budget.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "Not specified"}
            </strong>
            <div className="report-meta-item">
              <span>Paid</span>
              <strong>{`LKR ${p.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</strong>
            </div>
            <div className="report-meta-item">
              <span>Due</span>
              <strong>{p.budget === null ? "Not specified" : `LKR ${Math.max(0, p.budget - p.paidAmount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}</strong>
            </div>
            <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>
              Assigned to: {p.assignedTo?.name ?? "Unassigned"}
            </span>
          </div>
        </div>

        {/* Progress Section */}
        <div style={{ margin: "1.5rem 0", padding: "1rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "#0f172a" }}>Overall Progress</span>
            <strong style={{ color: "#0f172a" }}>{p.progress}%</strong>
          </div>
          <div style={{ height: "10px", width: "100%", background: "#e2e8f0", borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${p.progress}%`, height: "100%", background: "#d97706" }} />
          </div>
        </div>

        {/* Tasks Checklist */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "#0f172a" }}>Tasks ({completedTasks}/{totalTasks} Completed)</h3>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{taskPercent}% tasks done</span>
          </div>
          {p.tasks.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>No tasks listed for this project.</p>
          ) : (
            <div className="report-tasks">
              {p.tasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.4rem 0", borderBottom: "1px solid #f1f5f9" }}>
                  {t.done ? (
                    <CheckCircle2 size={16} color="#10b981" />
                  ) : (
                    <Circle size={16} color="#cbd5e1" />
                  )}
                  <span style={{ fontSize: "0.88rem", color: t.done ? "#64748b" : "#0f172a", textDecoration: t.done ? "line-through" : "none" }}>
                    {t.title}
                    <small style={{ display: "block", color: "#64748b", textDecoration: "none" }}>
                      {t.priority.toLowerCase()} priority
                      {t.assignee ? ` · ${t.assignee.name}` : ""}
                      {t.deadline ? ` · Due ${fmtDate(t.deadline)}` : ""}
                    </small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Updates */}
        {p.updates.length > 0 && (
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: "#0f172a" }}>Recent Updates & Notes</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {p.updates.slice(0, 5).map((u) => (
                <div key={u.id} style={{ padding: "0.6rem 0.8rem", background: "#f8fafc", borderRadius: "6px", borderLeft: "3px solid #cbd5e1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#64748b", marginBottom: "0.25rem" }}>
                    <strong>{u.author.name}</strong>
                    <span>{fmtDateTime(new Date(u.createdAt))}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e293b", lineHeight: 1.4 }}>{u.note}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <footer style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8" }}>
          <span>Generated by Yakunex CPMS Enterprise</span>
          <span>Confidential · For Internal & Client Review</span>
        </footer>
      </div>
    </div>
  );
}
