"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "./nav";

export function MobileNav({ 
  isAdmin, 
  logoUrl, 
  companyName,
  userImage,
  userName,
  userRole,
  logoutAction,
  notificationsNode,
}: { 
  isAdmin: boolean;
  logoUrl: string;
  companyName: string;
  userImage?: string | null;
  userName: string;
  userRole: string;
  logoutAction: (formData: FormData) => void;
  notificationsNode?: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close automatically whenever route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const closeDrawer = useCallback(() => {
    requestAnimationFrame(() => {
      setIsOpen(false);
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <div className="mobile-nav-container">
        <button 
          className="mobile-toggle" 
          onClick={() => setIsOpen(true)}
          aria-label="Open menu"
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {notificationsNode && (
        <div className="mobile-notif-container">
          {notificationsNode}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className="mobile-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />
            <motion.aside 
              className="mobile-drawer"
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="drawer-header">
                <Link className="brand" href="/" onClick={closeDrawer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoUrl || "/logo.svg"} alt={companyName} style={{ background: 'transparent', border: 'none', padding: 0, filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.4))' }} />
                  <span>{companyName}</span>
                </Link>
                <button 
                  type="button"
                  className="close-btn" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="drawer-content">
                <Nav 
                  isAdmin={isAdmin} 
                  onItemClick={closeDrawer} 
                  layoutIdPrefix="mobile"
                />
              </div>

              <div className="drawer-footer">
                <div className="userbox">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div className="profile-mini">
                        {userImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={userImage} alt={userName} className="profile-img" />
                        ) : (
                          <User size={16} />
                        )}
                      </div>
                      <div>
                        <strong>{userName}</strong>
                        <span className="muted">{userRole === "ADMIN" ? "Admin" : "Staff"}</span>
                      </div>
                    </div>
                  </div>
                  <form action={logoutAction} style={{ width: "100%" }}>
                    <button type="submit" className="btn" style={{ width: "100%" }}>
                      Sign out
                    </button>
                  </form>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
