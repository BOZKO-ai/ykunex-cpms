import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Badge } from "@/components/ui";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { fmtDate } from "@/lib/dates";
import { saveUser, toggleUserActive } from "./actions";
import { User as UserIcon, Mail, Shield, Power, Plus } from "lucide-react";

export const metadata = { title: "User Management" };

export default async function UsersPage() {
  const admin = await requireAdmin();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="User Management" subtitle="Manage staff access and permissions." />

      <div className="grid-2">
        <section className="card">
          <h2 style={{ marginBottom: "1.5rem" }}>System Users ({users.length})</h2>
          <div className="items">
            {users.map((u) => (
              <div key={u.id} className={`item-row ${!u.active ? "disabled" : ""}`}>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                  <div className="profile-mini">
                    {u.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.image} alt={u.name} className="profile-img" />
                    ) : (
                      <UserIcon size={16} />
                    )}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <strong>{u.name}</strong>
                      {u.id === admin.uid && <span className="chip" style={{ background: "rgba(251,191,36,0.1)", color: "var(--primary)" }}>You</span>}
                    </div>
                    <span className="muted" style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.85rem" }}>
                      <Mail size={12} /> {u.email}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ textAlign: "right" }}>
                    <Badge label={u.role} color={u.role === "ADMIN" ? "var(--primary)" : "#6b7280"} />
                    <br />
                    <span className="muted" style={{ fontSize: "0.75rem" }}>Since {fmtDate(u.createdAt)}</span>
                  </div>
                  
                  {u.id !== admin.uid && (
                    <form action={toggleUserActive.bind(null, u.id)}>
                      <button 
                        type="submit" 
                        className={`btn-icon ${u.active ? "" : "active"}`}
                        title={u.active ? "Disable User" : "Enable User"}
                        style={{ color: u.active ? "var(--error)" : "var(--success)" }}
                      >
                        <Power size={16} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h2 style={{ marginBottom: "1.5rem" }}>Add New User</h2>
          <ActionForm action={saveUser.bind(null, null)} className="form-grid" prefix="new-user">
            <Field name="name" label="Full Name" required wide placeholder="e.g. John Doe" />
            <Field name="email" label="Email Address" type="email" required wide placeholder="name@yakunex.com" />
            <Field name="password" label="Initial Password" type="password" required wide hint="Min 8 chars, letter + number" />
            <div className="field wide">
              <label htmlFor="role">System Role</label>
              <select id="role" name="role" defaultValue="STAFF">
                <option value="VIEWER">Viewer (Read-only)</option>
                <option value="STAFF">Staff Member (Project access)</option>
                <option value="MANAGER">Project Manager (Manage projects)</option>
                <option value="ADMIN">Administrator (Full Access)</option>
              </select>
            </div>
            <div className="form-actions wide">
              <SubmitButton>
                <Plus size={16} style={{ marginRight: "0.5rem" }} /> Create User Account
              </SubmitButton>
            </div>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
