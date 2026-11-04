import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { fmtDate } from "@/lib/dates";
import { TYPE_LABEL } from "@/lib/utils";
import { Badge, DeadlineInfo, PageHeader, Progress } from "@/components/ui";
import { ConfirmButton } from "@/components/form";
import { setCustomerArchived } from "../actions";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User as UserIcon, 
  Calendar, 
  DollarSign, 
  Briefcase,
  TrendingUp
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const c = await db.customer.findUnique({ where: { id: Number((await params).id) || 0 } });
  return { title: c?.name ?? "Customer" };
}

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const c = await db.customer.findUnique({
    where: { id },
    include: { 
      status: true, 
      projects: { 
        orderBy: { createdAt: "desc" }, 
        include: { status: true, serviceArea: true } 
      } 
    },
  });
  if (!c) notFound();
  const s = await getSettings();

  const totalRevenue = c.projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const activeProjects = c.projects.filter(p => !p.status.isClosed).length;
  const completedProjects = c.projects.filter(p => p.status.isClosed).length;

  return (
    <>
      <Breadcrumbs 
        items={[
          { label: "Customers", href: "/customers" },
          { label: c.name }
        ]} 
      />

      <PageHeader title={c.name} subtitle={c.archived ? "This customer is archived." : undefined}>
        <Link href={`/customers/${c.id}/edit`} className="btn">
          Edit
        </Link>
        <Link href={`/projects/new?customerId=${c.id}`} className="btn btn-primary">
          Add project
        </Link>
        {c.archived ? (
          <form action={setCustomerArchived.bind(null, c.id, false)}>
            <button type="submit" className="btn">
              Restore
            </button>
          </form>
        ) : (
          <form action={setCustomerArchived.bind(null, c.id, true)}>
            <ConfirmButton message={`Archive "${c.name}"? It will be hidden from the customer list. Its projects are not archived automatically. You can restore it later.`}>
              Archive
            </ConfirmButton>
          </form>
        )}
      </PageHeader>

      <div className="stats" style={{ marginBottom: "1.5rem" }}>
        <div className="stat">
          <div className="stat-icon"><DollarSign size={20} /></div>
          <div>
            <strong>LKR {totalRevenue.toLocaleString()}</strong>
            Lifetime Value
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon"><Briefcase size={20} /></div>
          <div>
            <strong>{activeProjects}</strong>
            Active Projects
          </div>
        </div>
        <div className="stat">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div>
            <strong>{completedProjects}</strong>
            Completed
          </div>
        </div>
      </div>

      <div className="grid-2">
        <section className="card" aria-labelledby="details">
          <h2 id="details">Details</h2>
          <div className="items">
            <div className="item-row">
              <Building2 size={16} className="muted" />
              <div>
                <span className="muted">Status & Type</span>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                  <Badge label={c.status.label} color={c.status.color} />
                  <Badge label={TYPE_LABEL[c.type] ?? c.type} color="#6b7280" />
                </div>
              </div>
            </div>
            <div className="item-row">
              <UserIcon size={16} className="muted" />
              <div>
                <span className="muted">Contact Person</span>
                <strong>{c.contactPerson || "—"}</strong>
              </div>
            </div>
            <div className="item-row">
              <Mail size={16} className="muted" />
              <div>
                <span className="muted">Email</span>
                {c.email ? <a href={`mailto:${c.email}`}>{c.email}</a> : <strong>—</strong>}
              </div>
            </div>
            <div className="item-row">
              <Phone size={16} className="muted" />
              <div>
                <span className="muted">Phone</span>
                <strong>{c.phone || "—"}</strong>
              </div>
            </div>
            <div className="item-row">
              <MapPin size={16} className="muted" />
              <div>
                <span className="muted">Address</span>
                <p className="pre" style={{ margin: "0.25rem 0 0 0" }}>{c.address || "—"}</p>
              </div>
            </div>
            <div className="item-row">
              <Calendar size={16} className="muted" />
              <div>
                <span className="muted">Customer Since</span>
                <strong>{fmtDate(c.createdAt)}</strong>
              </div>
            </div>
          </div>
          {c.notes && (
            <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
              <h3 style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>Internal Notes</h3>
              <p className="pre" style={{ fontSize: "0.9rem" }}>{c.notes}</p>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="projects">
          <h2 id="projects">Project History ({c.projects.length})</h2>
          {c.projects.length === 0 ? (
            <p className="empty">No projects for this customer yet.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {c.projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`}>{p.name}</Link>
                        <br />
                        <span className="muted" style={{ fontSize: "0.8rem" }}>{fmtDate(p.startDate)}</span>
                      </td>
                      <td>
                        <Badge label={p.status.label} color={p.status.color} />
                      </td>
                      <td>{p.budget ? `LKR ${p.budget.toLocaleString()}` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
