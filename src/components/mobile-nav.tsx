"use client";

import { useEffect, useState } from "react";
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
  logoutAction
}: { 
  isAdmin: boolean;
  logoUrl: string;
  companyName: string;
  userImage?: string | null;
  userName: string;
  userRole: string;
  logoutAction: (formData: FormData) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

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
                <a className="brand" href="/" onClick={() => setIsOpen(false)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt={companyName} style={{ background: 'transparent', border: 'none', padding: 0 }} />
                  <span>{companyName}</span>
                </a>
                <button 
                  className="close-btn" 
                  onClick={() => setIsOpen(false)}
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="drawer-content">
                <Nav isAdmin={isAdmin} onItemClick={() => setIsOpen(false)} />
              </div>

              <div className="drawer-footer">
                <div className="userbox">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
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
    </div>
  );
}
