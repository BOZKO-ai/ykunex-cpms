import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Nav } from "@/components/nav";
import { logoutAction, markAllNotificationsRead, markNotificationRead } from "./actions";
import { db } from "@/lib/db";
import { CommandPalette } from "@/components/command-palette";
import { PageTransition } from "@/components/page-transition";
import { NotificationBell } from "@/components/notifications";
import { User } from "lucide-react";
import { checkAndCreateDeadlineNotifications } from "@/lib/notifications";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const s = await getSettings();

  const [projects, customers, u, notifications] = await Promise.all([
    db.project.findMany({ where: { archived: false }, select: { id: true, name: true }, take: 100 }),
    db.customer.findMany({ where: { archived: false }, select: { id: true, name: true }, take: 100 }),
    db.user.findUnique({ where: { id: user.uid }, select: { id: true, name: true, image: true } }),
    checkAndCreateDeadlineNotifications(user.uid).then(() =>
      db.notification.findMany({
        where: { userId: user.uid },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    ),
  ]);

  const userImage = u?.image;
  const serializedNotifications = notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() }));

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
        notificationsNode={
          <NotificationBell 
            initialNotifications={serializedNotifications}
            markAsReadAction={markNotificationRead}
            markAllAsReadAction={markAllNotificationsRead}
          />
        }
      />

      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link className="brand" href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={s.logoDataUrl || "/logo.svg"} 
            alt={s.companyName} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              padding: 0,
              mixBlendMode: 'normal',
              filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.3))'
            }} 
          />
          <span>{s.companyName}</span>
        </Link>
        <Nav isAdmin={user.role === "ADMIN"} layoutIdPrefix="desktop" />
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <ThemeToggle />
              <NotificationBell 
                initialNotifications={serializedNotifications}
                markAsReadAction={markNotificationRead}
                markAllAsReadAction={markAllNotificationsRead}
              />
            </div>
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
