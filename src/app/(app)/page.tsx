import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getAllList } from "@/lib/lists";
import { DAY, fmtDate, fmtDateTime, todayUTC } from "@/lib/dates";
import { money, one, type SP } from "@/lib/utils";
import { DeadlineInfo, Progress } from "@/components/ui";
import { RevenueChart, StatusPieChart, TrendChart } from "@/components/charts";
import { 
  Users, 
  Calendar,
  Briefcase, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Activity as ActivityIcon,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const s = await getSettings();
  const sp = await searchParams;
  const today = todayUTC();
  const snapshotAt = new Date();
  const soonEnd = new Date(today.getTime() + s.dueSoonDays * DAY);

  const live = { archived: false };
  const open = { archived: false, status: { isClosed: false } };
  const statuses = await getAllList("PROJECT_STATUS");
  const areas = await getAllList("SERVICE_AREA");

  const [
    customersCount, 
    openProjectsCount, 
    overdueCount, 
    dueSoonCount, 
    perStatus, 
    overdue, 
    dueSoon, 
    activity, 
    totalProjects,
    allProjects
  ] = await Promise.all([
    db.customer.count({ where: { archived: false } }),
    db.project.count({ where: open }),
    db.project.count({ where: { ...open, deadline: { lt: today } } }),
    db.project.count({ where: { ...open, deadline: { gte: today, lte: soonEnd } } }),
    Promise.all(statuses.map((st) => db.project.count({ where: { ...live, statusId: st.id } }))),
    db.project.findMany({
      where: { ...open, deadline: { lt: today } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { customer: true, status: true },
    }),
    db.project.findMany({
      where: { ...open, deadline: { gte: today, lte: soonEnd } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { customer: true, status: true },
    }),
    db.activity.findMany({ 
      orderBy: { createdAt: "desc" }, 
      take: 6, 
      include: { user: true } 
    }),
    db.project.count({ where: live }),
    db.project.findMany({
      where: live,
      include: { serviceArea: true, status: true }
    })
  ]);

  // Operational Health Calculation
  const onTrackCount = Math.max(0, openProjectsCount - overdueCount - dueSoonCount);
  const healthScore = openProjectsCount === 0 
    ? 100 
    : Math.max(0, Math.round(((openProjectsCount - overdueCount) / openProjectsCount) * 100));
  
  const circumference = 2 * Math.PI * 38; // radius = 38
  const strokeDashoffset = circumference - (circumference * healthScore) / 100;
  const healthColor = healthScore >= 85 ? "var(--success)" : healthScore >= 65 ? "var(--primary)" : "var(--error)";

  // Financial Overview
  const totalPortfolioBudget = allProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const openProjectsList = allProjects.filter(p => !p.status.isClosed);
  const avgProgress = openProjectsList.length > 0
    ? Math.round(openProjectsList.reduce((sum, p) => sum + (p.progress || 0), 0) / openProjectsList.length)
    : 0;

  // Chart Data Preparation
  const revenueByArea = areas.map(area => {
    const value = allProjects
      .filter(p => p.serviceAreaId === area.id)
      .reduce((sum, p) => sum + (p.budget || 0), 0);
    return { name: area.label, value };
  }).filter(a => a.value > 0);

  const statusDistribution = statuses.map((st, i) => ({
    name: st.label,
    value: perStatus[i]
  })).filter(s => s.value > 0);

  // Monthly Trends (last 6 months)
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      name: d.toLocaleString('default', { month: 'short' }),
      projects: 0,
      revenue: 0
    };
  }).reverse();

  allProjects.forEach(p => {
    const d = new Date(p.createdAt);
    const m = last6Months.find(l => l.month === d.getMonth() && l.year === d.getFullYear());
    if (m) {
      m.projects++;
      m.revenue += (p.budget || 0);
    }
  });

  const trendData = last6Months.map(({ name, projects, revenue }) => ({ name, projects, revenue }));

  return (
    <>
      {one(sp.denied) && (
        <div className="alert alert-error" role="alert" style={{ marginBottom: "1.5rem" }}>
          Only admins can open the Settings screen.
        </div>
      )}

      {/* Bento Hero & Operations Health Radar */}
      <section className="bento-hero" aria-label="Operational overview">
        <div className="card bento-welcome-card">
          <div>
            <div className="bento-welcome-badge">
              <Sparkles size={14} />
              <span>Workspace overview</span>
            </div>
            <h1 className="bento-welcome-title">
              Welcome back, {user.name}
            </h1>
            <p className="bento-welcome-desc">
              Here is your workspace overview for {fmtDate(today)}. Currently tracking {openProjectsCount} active deliverables across {customersCount} customers.
            </p>
            <p className="bento-snapshot-time" aria-label={`Dashboard snapshot at ${fmtDateTime(snapshotAt)}`}>
              <span className="live-status-dot" aria-hidden="true" />
              Last refreshed {fmtDateTime(snapshotAt)}
            </p>
          </div>

          <div className="quick-dock-bar">
            <Link href="/projects/new" className="dock-btn dock-btn-primary">
              <Plus size={16} />
              <span>New Project</span>
            </Link>
            <Link href="/customers/new" className="dock-btn">
              <Users size={16} />
              <span>Add Customer</span>
            </Link>
            <Link href="/calendar" className="dock-btn">
              <Calendar size={16} />
              <span>Calendar</span>
            </Link>
            {overdueCount > 0 && (
              <Link href="/projects?scope=overdue" className="dock-btn" style={{ borderColor: "var(--error)", color: "var(--error)" }}>
                <AlertCircle size={16} />
                <span>Overdue ({overdueCount})</span>
              </Link>
            )}
            {user.role === "ADMIN" && (
              <Link href="/settings" className="dock-btn">
                <SettingsIcon size={16} />
                <span>Settings</span>
              </Link>
            )}
          </div>
        </div>

        {/* Circular Health Radar Gauge */}
        <div className="card bento-radar-card">
          <div className="radar-header">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={18} style={{ color: healthColor }} />
              <h3 style={{ margin: 0, fontSize: "1rem" }}>Health Radar</h3>
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Live Status</span>
          </div>

          <div className="radar-score-wrap">
            <div className="radar-circle-wrap">
              <svg width="90" height="90" viewBox="0 0 90 90" className="radar-svg">
                <circle
                  cx="45"
                  cy="45"
                  r="38"
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="45"
                  cy="45"
                  r="38"
                  fill="transparent"
                  stroke={healthColor}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.8s ease" }}
                />
              </svg>
              <div className="radar-center-label">
                {healthScore}%
                <span>Score</span>
              </div>
            </div>

            <div className="radar-breakdown">
              <div className="radar-row">
                <span className="radar-row-label">
                  <span className="radar-dot" style={{ background: "var(--success)" }}></span>
                  On Track
                </span>
                <span className="radar-row-val">{onTrackCount}</span>
              </div>
              <div className="radar-row">
                <span className="radar-row-label">
                  <span className="radar-dot" style={{ background: "var(--primary)" }}></span>
                  Due Soon
                </span>
                <span className="radar-row-val">{dueSoonCount}</span>
              </div>
              <div className="radar-row">
                <span className="radar-row-label">
                  <span className="radar-dot" style={{ background: "var(--error)" }}></span>
                  Overdue
                </span>
                <span className="radar-row-val" style={{ color: overdueCount > 0 ? "var(--error)" : undefined }}>
                  {overdueCount}
                </span>
              </div>
            </div>
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Portfolio Quality</span>
            <strong style={{ color: healthColor }}>
              {healthScore >= 85 ? "Optimal" : healthScore >= 65 ? "Steady" : "Action Required"}
            </strong>
          </div>
        </div>
      </section>

      {/* Bento Metric Stats Row */}
      <section className="stats" aria-label="Key numbers" style={{ marginBottom: "1.5rem" }}>
        <Link href="/projects?scope=open" className="stat">
          <div className="stat-icon"><Briefcase size={20} /></div>
          <div>
            <strong>{openProjectsCount}</strong>
            Active Projects
          </div>
        </Link>
        <Link href="/customers" className="stat">
          <div className="stat-icon"><Users size={20} /></div>
          <div>
            <strong>{customersCount}</strong>
            Customers
          </div>
        </Link>
        <div className="stat">
          <div className="stat-icon" style={{ color: "var(--primary)" }}><DollarSign size={20} /></div>
          <div>
            <strong style={{ fontSize: "1.15rem" }}>{money(totalPortfolioBudget)}</strong>
            Portfolio Value
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon" style={{ color: "var(--success)" }}><CheckCircle2 size={20} /></div>
          <div>
            <strong>{avgProgress}%</strong>
            Avg. Completion
          </div>
        </div>
      </section>

      {/* Analytics Charts Grid */}
      <div className="grid-3" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <div className="card-header">
            <TrendingUp size={18} className="gold" />
            <h3>Monthly Trends</h3>
          </div>
          <TrendChart data={trendData} />
        </div>
        <div className="card">
          <div className="card-header">
            <Briefcase size={18} className="gold" />
            <h3>Revenue by Area</h3>
          </div>
          <RevenueChart data={revenueByArea} />
        </div>
        <div className="card">
          <div className="card-header">
            <PieChartIcon size={18} className="gold" />
            <h3>Project Status</h3>
          </div>
          <StatusPieChart data={statusDistribution} />
        </div>
      </div>

      {/* Operational Pulse & Works Breakdown */}
      <div className="grid-2">
        {/* Activity Pulse Stream */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ActivityIcon size={18} className="gold" />
              <h3 style={{ margin: 0 }}>Recent activity</h3>
            </div>
            <Link href="/projects" style={{ fontSize: "0.8rem", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>

          {activity.length === 0 ? (
            <p className="empty">No recent system activity recorded.</p>
          ) : (
            <div className="activity-pulse-list">
              {activity.map((act) => (
                <div key={act.id} className="activity-pulse-item">
                  <div className="pulse-user-avatar">
                    {act.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={act.user.image} 
                        alt={act.user.name} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      />
                    ) : (
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--primary)" }}>
                        {act.user?.name ? act.user.name.charAt(0).toUpperCase() : "S"}
                      </span>
                    )}
                  </div>
                  <div className="pulse-content">
                    <div className="pulse-header">
                      <span className="pulse-name">{act.user?.name ?? "System"}</span>
                      <span className="pulse-time">{fmtDateTime(act.createdAt)}</span>
                    </div>
                    <p className="pulse-summary" title={act.summary}>
                      {act.summary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Works Analysis & Urgent Deliverables */}
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div>
            <div className="card-header" style={{ marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>Works Distribution</h3>
            </div>
            <div className="items">
              {statuses.map((st, i) => {
                const count = perStatus[i];
                const pct = totalProjects === 0 ? 0 : Math.round((count / totalProjects) * 100);
                return (
                  <Link key={st.id} href={`/projects?status=${st.id}`} className="item-row no-border" style={{ padding: "0.5rem 0" }}>
                    <div style={{ width: "100%" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{st.label}</span>
                        <span className="muted" style={{ fontSize: "0.8rem" }}>{count} ({pct}%)</span>
                      </div>
                      <Progress value={pct} color={st.color} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {(overdue.length > 0 || dueSoon.length > 0) && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <h4 style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)" }}>Priority Attention</h4>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {overdue.length + dueSoon.length} items
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[...overdue, ...dueSoon].slice(0, 4).map((p) => (
                  <Link 
                    key={p.id} 
                    href={`/projects/${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.75rem",
                      borderRadius: "8px",
                      background: "var(--surface-hover)",
                      border: "1px solid var(--border)",
                      textDecoration: "none",
                      color: "inherit",
                      fontSize: "0.85rem"
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, paddingRight: "0.75rem" }}>
                      <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </strong>
                      <span className="muted" style={{ fontSize: "0.75rem" }}>{p.customer.name}</span>
                    </div>
                    <DeadlineInfo deadline={p.deadline} closed={p.status.isClosed} soonDays={s.dueSoonDays} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
