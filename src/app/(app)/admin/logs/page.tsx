import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge, Pagination } from "@/components/ui";
import { fmtDateTime } from "@/lib/dates";
import { one, toInt, type SP } from "@/lib/utils";
import { Activity as ActivityIcon, User, Info, FileText, AlertCircle } from "lucide-react";

export const metadata = { title: "Audit Logs" };

const PAGE_SIZE = 50;

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, toInt(one(sp.page), 1));

  const [total, logs] = await Promise.all([
    db.activity.count(),
    db.activity.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getIcon = (action: string) => {
    switch (action) {
      case "create": return <ActivityIcon size={16} className="text-success" />;
      case "update": return <FileText size={16} className="text-warning" />;
      case "delete":
      case "archive": return <AlertCircle size={16} className="text-error" />;
      default: return <Info size={16} className="text-info" />;
    }
  };

  return (
    <>
      <PageHeader 
        title="Audit Logs" 
        subtitle={`Viewing ${logs.length} of ${total} system activities.`} 
      />

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-wrap" style={{ border: "none" }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="muted" style={{ fontSize: "0.8rem" }}>
                    {fmtDateTime(log.createdAt)}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <User size={14} className="muted" />
                      <div>
                        <strong>{log.user?.name || "System"}</strong>
                        <br />
                        <span className="muted" style={{ fontSize: "0.7rem" }}>{log.user?.role}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {getIcon(log.action)}
                      <Badge label={log.action} color={log.action === "create" ? "var(--success)" : log.action === "update" ? "var(--warning)" : "var(--error)"} />
                    </div>
                  </td>
                  <td>
                    <span className="muted">{log.entity}</span>
                    {log.entityId && <span className="muted"> (#{log.entityId})</span>}
                  </td>
                  <td>
                    <strong>{log.summary}</strong>
                    {log.details && (
                      <pre style={{ 
                        marginTop: "0.5rem", 
                        fontSize: "0.75rem", 
                        whiteSpace: "pre-wrap",
                        color: "var(--text-muted)",
                        background: "rgba(0,0,0,0.2)",
                        padding: "0.5rem",
                        borderRadius: "4px"
                      }}>
                        {log.details}
                      </pre>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <Pagination page={page} totalPages={totalPages} basePath="/admin/logs" params={{}} />
      </div>
    </>
  );
}
