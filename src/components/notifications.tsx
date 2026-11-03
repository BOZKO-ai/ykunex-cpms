"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, Loader2 } from "lucide-react";
import { fmtDateTime } from "@/lib/dates";

export type Notification = {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string | Date;
};

export function NotificationBell({ 
  initialNotifications,
  markAsReadAction,
  markAllAsReadAction
}: { 
  initialNotifications: Notification[];
  markAsReadAction: (id: number) => Promise<void>;
  markAllAsReadAction: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isUpdating, setIsUpdating] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    
    let polling = false;
    const controller = new AbortController();

    async function pollNotifications() {
      if (polling || document.visibilityState === "hidden") return;
      polling = true;

      try {
        const res = await fetch("/api/notifications", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.warn("Unable to refresh notifications; will retry.", e);
      } finally {
        polling = false;
      }
    }

    // Poll only while the page is visible and avoid overlapping requests.
    const interval = setInterval(() => {
      void pollNotifications();
    }, 30000);
    document.addEventListener("visibilitychange", pollNotifications);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("visibilitychange", pollNotifications);
      clearInterval(interval);
      controller.abort();
    };
  }, []);

  const handleMarkRead = async (id: number) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await markAsReadAction(id);
      setNotifications(current => current.map(n => n.id === id ? { ...n, read: true } : n));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await markAllAsReadAction();
      setNotifications(current => current.map(n => ({ ...n, read: true })));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        className={`bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={() => setIsOpen(open => !open)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown glass" role="dialog" aria-label="Notifications">
          <div className="dropdown-header">
            <div>
              <h3>Notifications</h3>
              <span className="notification-summary">
                {unreadCount ? `${unreadCount} unread` : "All caught up"}
              </span>
            </div>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn-link" disabled={isUpdating}>
                {isUpdating ? <Loader2 size={14} className="animate-spin" /> : null}
                Mark all read
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="empty">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`notification-item ${n.read ? "read" : "unread"}`}>
                  <div className="notif-content">
                    <div className="notif-title">
                      <strong>{n.title}</strong>
                      {!n.read && <span className="new-dot" />}
                    </div>
                    <p>{n.message}</p>
                    <span className="notif-time">{fmtDateTime(new Date(n.createdAt))}</span>
                    {n.link && (
                      <Link 
                        href={n.link} 
                        className="notif-link" 
                        onClick={() => {
                          void handleMarkRead(n.id);
                          setIsOpen(false);
                        }}
                      >
                        View details <ExternalLink size={12} />
                      </Link>
                    )}
                  </div>
                  {!n.read && (
                    <button 
                      onClick={() => void handleMarkRead(n.id)}
                      className="mark-read-btn"
                      title="Mark as read"
                      aria-label={`Mark ${n.title} as read`}
                      disabled={isUpdating}
                    >
                      <Check size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
