"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, Check, ExternalLink, Loader2, AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { fmtDateTime } from "@/lib/dates";
import { useToast } from "./toast";

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
  const router = useRouter();
  const { toast: showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isUpdating, setIsUpdating] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync state if initialNotifications updates from server
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Click outside and escape handlers: ONLY active when dropdown is open
  useEffect(() => {
    if (!isOpen) return;
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
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
          const data: Notification[] = await res.json();
          setNotifications(prev => {
            const prevIds = new Set(prev.map(n => n.id));
            const brandNew = data.filter(n => !n.read && !prevIds.has(n.id));
            if (brandNew.length > 0) {
              const latest = brandNew[0];
              const toastType = 
                latest.type === "ALERT" ? "error" :
                latest.type === "WARNING" ? "warning" :
                latest.type === "SUCCESS" ? "success" : "info";
              showToast({
                title: latest.title,
                message: latest.message,
                type: toastType,
                duration: 6000
              });
            }
            return data;
          });
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.warn("Unable to refresh notifications; will retry.", e);
      } finally {
        polling = false;
      }
    }

    let es: EventSource | null = null;
    if (typeof window !== "undefined" && "EventSource" in window) {
      try {
        es = new EventSource("/api/notifications/stream");
        es.onmessage = (event) => {
          try {
            const data: Notification[] = JSON.parse(event.data);
            setNotifications(prev => {
              const prevIds = new Set(prev.map(n => n.id));
              const brandNew = data.filter(n => !n.read && !prevIds.has(n.id));
              if (brandNew.length > 0 && prev.length > 0) {
                const latest = brandNew[0];
                const toastType = 
                  latest.type === "ALERT" ? "error" :
                  latest.type === "WARNING" ? "warning" :
                  latest.type === "SUCCESS" ? "success" : "info";
                showToast({
                  title: latest.title,
                  message: latest.message,
                  type: toastType,
                  duration: 6000
                });
              }
              return data;
            });
          } catch {}
        };
      } catch {
        // SSE not available, fallback will poll
      }
    }

    // Fallback Polling every 30s when tab is visible
    const interval = setInterval(() => {
      if (!es || es.readyState === EventSource.CLOSED) {
        void pollNotifications();
      }
    }, 30000);
    document.addEventListener("visibilitychange", pollNotifications);

    return () => {
      document.removeEventListener("visibilitychange", pollNotifications);
      clearInterval(interval);
      if (es) es.close();
      controller.abort();
    };
  }, []);

  const handleMarkRead = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Optimistic update
    setNotifications(current => current.map(n => n.id === id ? { ...n, read: true } : n));
    try {
      await markAsReadAction(id);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (isUpdating || unreadCount === 0) return;
    setIsUpdating(true);
    // Optimistic update
    setNotifications(current => current.map(n => ({ ...n, read: true })));
    try {
      await markAllAsReadAction();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleItemClick = (n: Notification) => {
    if (!n.read) {
      void handleMarkRead(n.id);
    }
    if (n.link) {
      setIsOpen(false);
      router.push(n.link);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case "ALERT":
        return <AlertCircle size={16} className="notif-type-icon notif-type-alert" />;
      case "WARNING":
        return <AlertTriangle size={16} className="notif-type-icon notif-type-warning" />;
      case "SUCCESS":
        return <CheckCircle2 size={16} className="notif-type-icon notif-type-success" />;
      default:
        return <Info size={16} className="notif-type-icon notif-type-info" />;
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button 
        type="button"
        className={`bell-btn ${unreadCount > 0 ? "has-unread" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(open => !open);
        }}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
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
                <div 
                  key={n.id} 
                  className={`notification-item ${n.read ? "read" : "unread"} ${n.link ? "clickable" : ""}`}
                  onClick={() => handleItemClick(n)}
                  onKeyDown={(event) => {
                    if (n.link && (event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      handleItemClick(n);
                    }
                  }}
                  role={n.link ? "button" : undefined}
                  tabIndex={n.link ? 0 : undefined}
                >
                  <div className="notif-icon-col">
                    {getTypeIcon(n.type)}
                  </div>
                  <div className="notif-content">
                    <div className="notif-title">
                      <strong>{n.title}</strong>
                      {!n.read && <span className="new-dot" />}
                    </div>
                    <p>{n.message}</p>
                    <span className="notif-time">{fmtDateTime(new Date(n.createdAt))}</span>
                    {n.link && (
                      <span className="notif-link">
                        View details <ExternalLink size={12} />
                      </span>
                    )}
                  </div>
                  {!n.read && (
                    <button 
                      onClick={(e) => void handleMarkRead(n.id, e)}
                      className="mark-read-btn"
                      title="Mark as read"
                      aria-label={`Mark ${n.title} as read`}
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
