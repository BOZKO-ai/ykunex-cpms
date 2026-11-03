import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getAllList } from "@/lib/lists";
import { DAY, fmtDate, fmtDateTime, todayUTC } from "@/lib/dates";
import { one, type SP } from "@/lib/utils";
import { Badge, DeadlineInfo, PageHeader, Progress } from "@/components/ui";
import { RevenueChart, StatusPieChart, TrendChart } from "@/components/charts";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  PieChart as PieChartIcon, 
  Plus,
  ArrowRight
} from "lucide-react";

export const metadata = { title: "Dashboard" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<SP> }) {
  const user = await requireUser();
  const s = await getSettings();
  const sp = await searchParams;
  const today = todayUTC();
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
      take: 6,
      include: { customer: true, status: true },
    }),
    db.project.findMany({
      where: { ...open, deadline: { gte: today, lte: soonEnd } },
      orderBy: { deadline: "asc" },
      take: 6,
      include: { customer: true, status: true },
    }),
    db.activity.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
    db.project.count({ where: live }),
    db.project.findMany({
      where: live,
      include: { serviceArea: true, status: true }
    })
  ]);

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

  const projectTable = (rows: typeof overdue, empty: string) =>
    rows.length === 0 ? (
      <p className="empty">{empty}</p>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Project</th>
              <th scope="col">Customer</th>
              <th scope="col">Deadline</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/projects/${p.id}`}>{p.name}</Link>
                </td>
                <td>{p.customer.name}</td>
                <td>
                  <DeadlineInfo deadline={p.deadline} closed={p.status.isClosed} soonDays={s.dueSoonDays} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

  return (
    <>
      <PageHeader title="Dashboard" subtitle={`Welcome back, ${user.name}. Today is ${fmtDate(today)}.`}>
        <Link href="/customers/new" className="btn">
          Add customer
        </Link>
        <Link href="/projects/new" className="btn btn-primary">
          Add project
        </Link>
      </PageHeader>

      {one(sp.denied) && (
        <div className="alert alert-error" role="alert">
          Only admins can open the Settings screen.
        </div>
      )}

      <section className="stats" aria-label="Key numbers">
        <Link href="/customers" className="stat">
          <div className="stat-icon"><Users size={20} /></div>
          <div>
            <strong>{customersCount}</strong>
            Customers
          </div>
        </Link>
        <Link href="/projects?scope=open" className="stat">
          <div className="stat-icon"><Briefcase size={20} /></div>
          <div>
            <strong>{openProjectsCount}</strong>
            Open projects
          </div>
        </Link>
        <Link href="/projects?scope=overdue" className="stat" style={{ borderLeft: "4px solid var(--error)" }}>
          <div className="stat-icon" style={{ color: "var(--error)" }}><AlertCircle size={20} /></div>
          <div>
            <strong style={{ color: "var(--error)" }}>{overdueCount}</strong>
            Overdue
          </div>
        </Link>
        <Link href="/projects?scope=dueSoon" className="stat" style={{ borderLeft: "4px solid var(--primary)" }}>
          <div className="stat-icon" style={{ color: "var(--primary)" }}><Clock size={20} /></div>
          <div>
            <strong style={{ color: "var(--primary)" }}>{dueSoonCount}</strong>
            Due soon
          </div>
        </Link>
      </section>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
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

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="items">
            <Link href="/projects/new" className="item-row">
              <div className="stat-icon"><Plus size={16} /></div>
              <div>
                <strong>Create New Project</strong>
                <span className="muted">Setup a new engagement</span>
              </div>
              <ArrowRight size={16} className="muted" />
            </Link>
            <Link href="/customers/new" className="item-row">
              <div className="stat-icon"><Users size={16} /></div>
              <div>
                <strong>Register Customer</strong>
                <span className="muted">Add a new business or individual</span>
              </div>
              <ArrowRight size={16} className="muted" />
            </Link>
            <Link href="/projects?scope=overdue" className="item-row">
              <div className="stat-icon" style={{ color: "var(--error)" }}><AlertCircle size={16} /></div>
              <div>
                <strong>Review Overdue</strong>
                <span className="muted">Handle {overdueCount} delayed projects</span>
              </div>
              <ArrowRight size={16} className="muted" />
            </Link>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Works Analysis</h3>
          </div>
          <div className="items">
            {statuses.map((st, i) => {
              const count = perStatus[i];
              const pct = totalProjects === 0 ? 0 : Math.round((count / totalProjects) * 100);
              return (
                <Link key={st.id} href={`/projects?status=${st.id}`} className="item-row no-border">
                  <div style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <strong>{st.label}</strong>
                      <span className="muted" style={{ fontSize: "0.85rem" }}>{count} projects ({pct}%)</span>
                    </div>
                    <Progress value={pct} color={st.color} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
