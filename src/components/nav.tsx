"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const items = [
  { 
    href: "/", 
    label: "Dashboard", 
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
      </svg>
    )
  },
  { 
    href: "/customers", 
    label: "Customers", 
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  { 
    href: "/projects", 
    label: "Projects", 
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"/><path d="M12 12v4"/><path d="M9 14h6"/>
      </svg>
    )
  },
  { 
    href: "/projects/board", 
    label: "Kanban Board", 
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3h7v18H3z"/><path d="M14 3h7v10h-7z"/><path d="M14 17h7v4h-7z"/>
      </svg>
    )
  },
  {
    href: "/calendar",
    label: "Calendar",
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    )
  },
  { 
    href: "/users", 
    label: "Users", 
    admin: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  { 
    href: "/account", 
    label: "My account", 
    admin: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/>
      </svg>
    )
  },
  { 
    href: "/settings", 
    label: "Settings", 
    admin: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
      </svg>
    )
  },
  {
    href: "/activity",
    label: "Audit Logs",
    admin: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    )
  },
];

import { motion } from "framer-motion";

const GROUP: Record<string, string> = {
  "/": "Workspace", "/customers": "Workspace", "/projects": "Workspace", "/projects/board": "Workspace", "/calendar": "Workspace",
  "/account": "Account",
  "/users": "Administration", "/settings": "Administration", "/activity": "Administration",
};
const GROUP_ORDER = ["Workspace", "Account", "Administration"];
const groupOf = (href: string) => GROUP[href] ?? "Workspace";

export function Nav({ 
  isAdmin, 
  onItemClick,
  layoutIdPrefix = "desktop"
}: { 
  isAdmin: boolean; 
  onItemClick?: () => void;
  layoutIdPrefix?: string;
}) {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="sidebar-nav">
      <ul>
        {items
          .filter((i) => !i.admin || isAdmin)
          .sort((a, b) => GROUP_ORDER.indexOf(groupOf(a.href)) - GROUP_ORDER.indexOf(groupOf(b.href)))
          .map((i, idx, arr) => {
            const heading = idx === 0 || groupOf(arr[idx - 1].href) !== groupOf(i.href) ? groupOf(i.href) : null;
            // Precise active matching: prevent /projects and /projects/board collision
            const active = 
              i.href === "/"
                ? path === "/"
                : i.href === "/projects"
                  ? path === "/projects" || (path.startsWith("/projects/") && !path.startsWith("/projects/board"))
                  : path === i.href || path.startsWith(i.href + "/");

            return (
              <Fragment key={i.href}>
              {heading && <li className="nav-group" aria-hidden="true">{heading}</li>}
              <li style={{ position: "relative" }}>
                <Link 
                  href={i.href} 
                  aria-current={active ? "page" : undefined} 
                  className={active ? "active" : undefined}
                  onClick={onItemClick}
                  style={{ position: "relative", zIndex: 1 }}
                >
                  {i.icon}
                  <span>{i.label}</span>
                </Link>
                {active && (
                  <motion.div 
                    layoutId={`nav-active-${layoutIdPrefix}`}
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    style={{ 
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      backgroundColor: "rgba(251, 191, 36, 0.1)",
                      borderRadius: "12px",
                      zIndex: 0,
                      pointerEvents: "none"
                    }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </li>
              </Fragment>
            );
          })}
      </ul>
    </nav>
  );
}