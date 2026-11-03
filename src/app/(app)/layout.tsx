import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Nav } from "@/components/nav";
import { logoutAction, markAllNotificationsRead, markNotificationRead } from "./actions";
import { db } from "@/lib/db";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import { NotificationBell } from "@/components/notifications";
import { User } from "lucide-react";
import { MobileNav } from "@/components/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const s = await getSettings();

  const [projects, customers, u, notifications] = await Promise.all([
    db.project.findMany({ where: { archived: false }, select: { id: true, name: true } }),
    db.customer.findMany({ where: { archived: false }, select: { id: true, name: true } }),
    db.user.findUnique({ where: { id: user.uid }, select: { id: true, name: true, image: true } }),
    db.notification.findMany({
      where: { userId: user.uid },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const userImage = u?.image;

  return (
    <div className="shell">
      <CommandPalette 
        projects={projects.map(p => ({ ...p, type: "project" }))} 
        customers={customers.map(c => ({ ...c, type: "customer" }))} 
      />
      
      <MobileNav 
        isAdmin={user.role === "ADMIN"}
        logoUrl={s.logoDataUrl || "/logo.svg"}
        companyName={s.companyName}
        userImage={userImage}
        userName={user.name}
        userRole={user.role}
        logoutAction={logoutAction}
      />

      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt={s.companyName} style={{ background: 'transparent', border: 'none', padding: 0 }} />
          <span>{s.companyName}</span>
        </a>
        <Nav isAdmin={user.role === "ADMIN"} />
        <div className="userbox">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div className="profile-mini">
                {userImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userImage} alt={user.name} className="profile-img" />
                ) : (
                  <User size={16} />
                )}
              </div>
              <div>
                <strong>{user.name}</strong>
                <span className="muted">{user.role === "ADMIN" ? "Admin" : "Staff"}</span>
              </div>
            </div>
            <NotificationBell 
              initialNotifications={notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }))}
              markAsReadAction={markNotificationRead}
              markAllAsReadAction={markAllNotificationsRead}
            />
          </div>
          <form action={logoutAction} style={{ width: "100%" }}>
            <button type="submit" className="btn" style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main id="main" className="main">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
}
