import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { Badge, PageHeader } from "@/components/ui";
import { fmtDate, fmtDateTime, toInputDate } from "@/lib/dates";
import { changePassword, updateProfile } from "./actions";
import { ProfileImageUpload } from "@/components/profile-image-upload";
import { 
  User as UserIcon, 
  Mail, 
  Shield, 
  Calendar, 
  Phone, 
  Briefcase, 
  Info,
  Clock,
  ArrowRight
} from "lucide-react";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();

  const [u, projects, activity] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: user.uid } }),
    db.project.findMany({
      where: { assignedToId: user.uid, archived: false },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { customer: true, status: true },
    }),
    db.activity.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const calculateAge = (birthDate: Date | null) => {
    if (!birthDate) return null;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(u.birthDate);

  return (
    <>
      <PageHeader title="My account" subtitle="Manage your profile, security, and view your assignments." />

      <div className="grid-2">
        <section className="card" aria-labelledby="profile">
          <h2 id="profile" style={{ marginBottom: "1.5rem" }}>Profile Information</h2>
          
          <ActionForm action={updateProfile} className="form-grid" prefix="profile">
            <div className="wide" style={{ display: "flex", justifyContent: "center" }}>
              <ProfileImageUpload name="image" defaultValue={u.image} />
            </div>

            <Field name="name" label="Full Name" defaultValue={u.name} required wide />
            
            <div className="item-row wide" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
              <div style={{ flex: 1 }}>
                <span className="muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={14} /> Email Address
                </span>
                <strong>{u.email}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Shield size={14} /> Role
                </span>
                <span className="profile-badge">
                  {u.role === "ADMIN" ? "Administrator" : "Staff Member"}
                </span>
              </div>
            </div>

            <Field name="department" label="Department / Designation" defaultValue={u.department} placeholder="e.g. Engineering, Marketing" />
            <Field name="phone" label="Phone Number" defaultValue={u.phone} type="tel" placeholder="+94 77 123 4567" />
            
            <Field name="birthDate" label="Date of Birth" type="date" defaultValue={u.birthDate ? toInputDate(u.birthDate) : ""} />
            <div className="field">
              <label>Current Age</label>
              <div style={{ padding: "0.75rem", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                {age !== null ? `${age} years old` : "—"}
              </div>
            </div>

            <Field name="bio" label="Professional Bio" as="textarea" defaultValue={u.bio} wide placeholder="Tell us about your expertise..." rows={4} />

            <div className="form-actions wide">
              <SubmitButton>Save changes</SubmitButton>
            </div>
          </ActionForm>
        </section>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <section className="card" aria-labelledby="pw">
            <h2 id="pw" style={{ marginBottom: "1.5rem" }}>Security</h2>
            <ActionForm action={changePassword} className="form-grid" prefix="pw">
              <Field name="currentPassword" label="Current password" type="password" required autoComplete="current-password" wide />
              <Field name="newPassword" label="New password" type="password" required hint="Min 8 chars, letter + number" autoComplete="new-password" wide />
              <Field name="confirmPassword" label="Confirm new password" type="password" required autoComplete="new-password" wide />
              <div className="form-actions wide">
                <SubmitButton>Update password</SubmitButton>
              </div>
            </ActionForm>
          </section>

          <section className="card">
            <h2 style={{ marginBottom: "1.5rem" }}>Account Statistics</h2>
            <div className="items">
              <div className="item-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Clock size={16} className="muted" />
                  <div>
                    <span className="muted">Member Since</span>
                    <strong>{fmtDate(u.createdAt)}</strong>
                  </div>
                </div>
              </div>
              <div className="item-row">
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Briefcase size={16} className="muted" />
                  <div>
                    <span className="muted">Total Assignments</span>
                    <strong>{projects.length} Active Projects</strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "1.5rem" }}>
        <section className="card" aria-labelledby="my-projects">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 id="my-projects">Assigned Projects</h2>
            {projects.length > 0 && (
              <Link href={`/projects?assigned=${user.uid}`} className="btn btn-ghost" style={{ fontSize: "0.8rem" }}>
                View all <ArrowRight size={14} style={{ marginLeft: "0.5rem" }} />
              </Link>
            )}
          </div>
          {projects.length === 0 ? (
            <p className="empty">No active projects assigned to you.</p>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link href={`/projects/${p.id}`}>{p.name}</Link>
                        <br />
                        <span className="muted" style={{ fontSize: "0.8rem" }}>{p.customer.name}</span>
                      </td>
                      <td>
                        <Badge label={p.status.label} color={p.status.color} />
                      </td>
                      <td>{fmtDate(p.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card" aria-labelledby="my-activity">
          <h2 id="my-activity" style={{ marginBottom: "1.5rem" }}>Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="empty">No recent activity logged.</p>
          ) : (
            <ul className="items">
              {activity.map((a) => (
                <li key={a.id} className="item-row">
                  <div>
                    <span style={{ display: "block", marginBottom: "0.25rem" }}>{a.summary}</span>
                    <span className="muted" style={{ fontSize: "0.75rem" }}>{fmtDateTime(a.createdAt)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
