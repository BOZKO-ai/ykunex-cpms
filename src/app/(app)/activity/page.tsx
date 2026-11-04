import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge, Pagination } from "@/components/ui";
import { fmtDateTime } from "@/lib/dates";
import { Shield, User, Filter, Search, Clock, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Audit Logs & Activity" };

const PAGE_SIZE = 25;

function one(val: string | string[] | undefined): string {
  if (Array.isArray(val)) return val[0] ?? "";
  return val ?? "";
}

export default async function ActivityPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const searchParams = await props.searchParams;

  const page = Math.max(1, Number(one(searchParams.page)) || 1);
  const userFilter = one(searchParams.user);
  const entityFilter = one(searchParams.entity);
  const actionFilter = one(searchParams.action);
  const query = one(searchParams.q);

  // Build Prisma where clause
  const where: any = {};
  if (userFilter) where.userId = Number(userFilter);
  if (entityFilter) where.entity = entityFilter;
  if (actionFilter) where.action = actionFilter;
  if (query) {
    where.OR = [
      { summary: { contains: query } },
      { details: { contains: query } },
    ];
  }

  const [totalCount, activities, users] = await Promise.all([
    db.activity.count({ where }),
    db.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
    db.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case "create": return "#10b981"; // emerald
      case "update": return "#38bdf8"; // sky blue
      case "delete": return "#f43f5e"; // rose
      case "archive": return "#f59e0b"; // amber
      case "restore": return "#a855f7"; // purple
      case "login": return "#fbbf24"; // gold
      default: return "#94a3b8";
    }
  };

  const getEntityColor = (entity: string) => {
    switch (entity.toLowerCase()) {
      case "project": return "var(--primary)";
      case "customer": return "#38bdf8";
      case "user": return "#a855f7";
      case "task": return "#10b981";
      case "settings": return "#e2e8f0";
      default: return "#94a3b8";
    }
  };

  return (
    <>
      <PageHeader 
        title="Audit Logs" 
        subtitle="Complete chronological history of user actions and system changes." 
      />

      <section className="card" style={{ marginBottom: "1.5rem", padding: "1.25rem" }}>
        <form method="GET" action="/activity" className="form-grid" style={{ alignItems: "flex-end" }}>
          <div>
            <label htmlFor="q">Search Details</label>
            <div style={{ position: "relative" }}>
              <input 
                id="q" 
                name="q" 
                defaultValue={query} 
                placeholder="Search by summary or details..." 
              />
            </div>
          </div>

          <div>
            <label htmlFor="user">User</label>
            <select id="user" name="user" defaultValue={userFilter}>
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="entity">Entity</label>
            <select id="entity" name="entity" defaultValue={entityFilter}>
              <option value="">All Entities</option>
              <option value="project">Project</option>
              <option value="customer">Customer</option>
              <option value="user">User</option>
              <option value="task">Task</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <div>
            <label htmlFor="action">Action</label>
            <select id="action" name="action" defaultValue={actionFilter}>
              <option value="">All Actions</option>
              <option value="create">Created</option>
              <option value="update">Updated</option>
              <option value="delete">Deleted</option>
              <option value="archive">Archived</option>
              <option value="restore">Restored</option>
              <option value="login">Signed In</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Filter size={16} /> Filter
            </button>
            {(query || userFilter || entityFilter || actionFilter) && (
              <Link href="/activity" className="btn" title="Clear filters">
                Reset
              </Link>
            )}
          </div>
        </form>
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--glass-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.1rem", margin: 0 }}>
            Activity Feed ({totalCount.toLocaleString()})
          </h2>
          <span className="muted" style={{ fontSize: "0.85rem" }}>
            Page {page} of {Math.max(1, totalPages)}
          </span>
        </div>

        {activities.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }} className="muted">
            <Clock size={32} style={{ margin: "0 auto 1rem", opacity: 0.5 }} />
            <p>No activity logs match your filter criteria.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col" style={{ width: "170px" }}>Timestamp</th>
                  <th scope="col" style={{ width: "180px" }}>User</th>
                  <th scope="col" style={{ width: "120px" }}>Entity</th>
                  <th scope="col" style={{ width: "110px" }}>Action</th>
                  <th scope="col">Summary & Details</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }} className="muted">
                      {fmtDateTime(new Date(a.createdAt))}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div className="profile-mini" style={{ width: "26px", height: "26px", minWidth: "26px" }}>
                          {a.user?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={a.user.image} alt={a.user.name} className="profile-img" />
                          ) : (
                            <User size={13} />
                          )}
                        </div>
                        <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
                          {a.user?.name ?? "System"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge label={a.entity.toUpperCase()} color={getEntityColor(a.entity)} />
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{ 
                          backgroundColor: `${getActionColor(a.action)}15`, 
                          borderColor: `${getActionColor(a.action)}35`,
                          color: getActionColor(a.action),
                          fontWeight: 600,
                          fontSize: "0.75rem"
                        }}
                      >
                        {a.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: "0.9rem", color: "#f8fafc" }}>
                        {a.summary}
                      </div>
                      {a.details && (
                        <div 
                          style={{ 
                            marginTop: "0.35rem", 
                            fontSize: "0.8rem", 
                            color: "var(--text-muted)", 
                            background: "rgba(0,0,0,0.25)",
                            padding: "0.4rem 0.6rem",
                            borderRadius: "6px",
                            fontFamily: "monospace",
                            whiteSpace: "pre-wrap"
                          }}
                        >
                          {a.details}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ padding: "1rem" }}>
            <Pagination 
              page={page} 
              totalPages={totalPages} 
              basePath="/activity" 
              params={{ q: query, user: userFilter, entity: entityFilter, action: actionFilter }} 
            />
          </div>
        )}
      </section>
    </>
  );
}

