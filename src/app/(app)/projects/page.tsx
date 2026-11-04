import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getAllList } from "@/lib/lists";
import { DAY, parseDate, todayUTC } from "@/lib/dates";
import { PAGE_SIZE, one, toInt, type SP } from "@/lib/utils";
import { Badge, DeadlineInfo, PageHeader, Pagination, Progress } from "@/components/ui";

export const metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const s = await getSettings();
  const sp = await searchParams;

  const q = one(sp.q).trim();
  const statusId = toInt(one(sp.status));
  const areaId = toInt(one(sp.area));
  const customerId = toInt(one(sp.customer));
  const assignedId = toInt(one(sp.assigned));
  const deadline = one(sp.deadline); // "", "overdue", "soon"
  const scope = one(sp.scope); // "", "open", "closed"
  const fromStr = one(sp.from);
  const toStr = one(sp.to);
  const from = parseDate(fromStr);
  const to = parseDate(toStr);
  const archived = one(sp.archived) === "1";
  const page = Math.max(1, toInt(one(sp.page), 1));

  const today = todayUTC();
  const soonEnd = new Date(today.getTime() + s.dueSoonDays * DAY);

  const and: Prisma.ProjectWhereInput[] = [];
  if (scope === "open") and.push({ status: { isClosed: false } });
  if (scope === "closed") and.push({ status: { isClosed: true } });
  if (deadline === "overdue") and.push({ status: { isClosed: false }, deadline: { lt: today } });
  if (deadline === "soon") and.push({ status: { isClosed: false }, deadline: { gte: today, lte: soonEnd } });
  if (from) and.push({ deadline: { gte: from } });
  if (to) and.push({ deadline: { lte: to } });

  const where: Prisma.ProjectWhereInput = {
    archived,
    ...(q ? { OR: [{ name: { contains: q } }, { customer: { name: { contains: q } } }] } : {}),
    ...(statusId ? { statusId } : {}),
    ...(areaId ? { serviceAreaId: areaId } : {}),
    ...(customerId ? { customerId } : {}),
    ...(assignedId ? { assignedToId: assignedId } : {}),
    AND: and,
  };

  const [statuses, areas, customers, users, total, rows] = await Promise.all([
    getAllList("PROJECT_STATUS"),
    getAllList("SERVICE_AREA"),
    db.customer.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.user.findMany({ where: { active: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.project.count({ where }),
    db.project.findMany({
      where,
      orderBy: [{ status: { isClosed: "asc" } }, { deadline: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true, status: true, serviceArea: true, assignedTo: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Projects" subtitle={`${total} ${archived ? "archived " : ""}${total === 1 ? "project" : "projects"}`}>
        <a href="/export/projects" className="btn">
          Export CSV
        </a>
        <Link href="/projects/new" className="btn btn-primary">
          Add project
        </Link>
      </PageHeader>

      <form className="card filters" method="get" role="search" aria-label="Search and filter projects">
        <div className="field grow">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Project or customer name" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={statusId ? String(statusId) : ""}>
            <option value="">All statuses</option>
            {statuses.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="area">Service area</label>
          <select id="area" name="area" defaultValue={areaId ? String(areaId) : ""}>
            <option value="">All areas</option>
            {areas.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="customer">Customer</label>
          <select id="customer" name="customer" defaultValue={customerId ? String(customerId) : ""}>
            <option value="">All customers</option>
            {customers.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="assigned">Assigned to</label>
          <select id="assigned" name="assigned" defaultValue={assignedId ? String(assignedId) : ""}>
            <option value="">Anyone</option>
            {users.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="deadline">Deadline</label>
          <select id="deadline" name="deadline" defaultValue={deadline}>
            <option value="">Any</option>
            <option value="overdue">Overdue</option>
            <option value="soon">Due in next {s.dueSoonDays} days</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="from">Deadline from</label>
          <input id="from" name="from" type="date" defaultValue={from ? fromStr : ""} />
        </div>
        <div className="field">
          <label htmlFor="to">Deadline to</label>
          <input id="to" name="to" type="date" defaultValue={to ? toStr : ""} />
        </div>
        <div className="field">
          <label htmlFor="scope">Show</label>
          <select id="scope" name="scope" defaultValue={scope}>
            <option value="">All projects</option>
            <option value="open">Open only</option>
            <option value="closed">Finished only</option>
          </select>
        </div>
        <label className="check-inline">
          <input type="checkbox" name="archived" value="1" defaultChecked={archived} /> Show archived
        </label>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <Link href="/projects" className="btn btn-ghost">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="card empty">
          <p>No projects match these filters.</p>
          <Link href="/projects/new" className="btn btn-primary">
            Add a project
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Project</th>
                <th scope="col">Customer</th>
                <th scope="col">Service area</th>
                <th scope="col">Status</th>
                <th scope="col">Deadline</th>
                <th scope="col">Progress</th>
                <th scope="col">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link href={`/projects/${p.id}`}>{p.name}</Link>
                  </td>
                  <td>
                    <Link href={`/customers/${p.customerId}`}>{p.customer.name}</Link>
                  </td>
                  <td>{p.serviceArea.label}</td>
                  <td>
                    <Badge label={p.status.label} color={p.status.color} active={!p.status.isClosed} />
                  </td>
                  <td>
                    <DeadlineInfo deadline={p.deadline} closed={p.status.isClosed} soonDays={s.dueSoonDays} />
                  </td>
                  <td>
                    <Progress value={p.progress} color={p.status.color} />
                  </td>
                  <td>{p.assignedTo?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/projects"
        params={{
          q,
          status: statusId || undefined,
          area: areaId || undefined,
          customer: customerId || undefined,
          assigned: assignedId || undefined,
          deadline,
          scope,
          from: from ? fromStr : undefined,
          to: to ? toStr : undefined,
          archived: archived ? "1" : undefined,
        }}
      />
    </>
  );
}
