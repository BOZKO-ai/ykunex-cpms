import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getAllList } from "@/lib/lists";
import { fmtDate } from "@/lib/dates";
import { PAGE_SIZE, TYPE_LABEL, one, toInt, type SP } from "@/lib/utils";
import { Badge, PageHeader, Pagination } from "@/components/ui";

export const metadata = { title: "Customers" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim();
  const statusId = toInt(one(sp.status));
  const type = one(sp.type);
  const archived = one(sp.archived) === "1";
  const page = Math.max(1, toInt(one(sp.page), 1));

  const where: Prisma.CustomerWhereInput = {
    archived,
    ...(q ? { OR: [{ name: { contains: q } }, { contactPerson: { contains: q } }, { email: { contains: q } }] } : {}),
    ...(statusId ? { statusId } : {}),
    ...(type === "BUSINESS" || type === "INDIVIDUAL" ? { type } : {}),
  };

  const [statuses, total, rows] = await Promise.all([
    getAllList("CUSTOMER_STATUS"),
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { status: true, _count: { select: { projects: true } } },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader title="Customers" subtitle={`${total} ${archived ? "archived" : ""} ${total === 1 ? "customer" : "customers"}`}>
        <a href="/export/customers" className="btn">
          Export CSV
        </a>
        <Link href="/customers/new" className="btn btn-primary">
          Add customer
        </Link>
      </PageHeader>

      <form className="card filters" method="get" role="search" aria-label="Search and filter customers">
        <div className="field grow">
          <label htmlFor="q">Search</label>
          <input id="q" name="q" defaultValue={q} placeholder="Name, contact person or email" />
        </div>
        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={statusId ? String(statusId) : ""}>
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
                {s.active ? "" : " (disabled)"}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="type">Type</label>
          <select id="type" name="type" defaultValue={type}>
            <option value="">All types</option>
            <option value="BUSINESS">Business</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </div>
        <label className="check-inline">
          <input type="checkbox" name="archived" value="1" defaultChecked={archived} /> Show archived
        </label>
        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <Link href="/customers" className="btn btn-ghost">
            Reset
          </Link>
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="card empty">
          <p>No customers match these filters.</p>
          <Link href="/customers/new" className="btn btn-primary">
            Add a customer
          </Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Customer</th>
                <th scope="col">Contact</th>
                <th scope="col">Type</th>
                <th scope="col">Status</th>
                <th scope="col">Projects</th>
                <th scope="col">Added</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/customers/${c.id}`}>{c.name}</Link>
                  </td>
                  <td>
                    {c.contactPerson || "—"}
                    <br />
                    <span className="muted">{c.email || c.phone || ""}</span>
                  </td>
                  <td>{TYPE_LABEL[c.type] ?? c.type}</td>
                  <td>
                    <Badge label={c.status.label} color={c.status.color} />
                  </td>
                  <td>{c._count.projects}</td>
                  <td>{fmtDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath="/customers" params={{ q, status: statusId || undefined, type, archived: archived ? "1" : undefined }} />
    </>
  );
}
