"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

export function CustomerHeader() {
  const [userName, setUserName] = useState("Customer");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadNotifications = async () => {
      try {
        const response = await fetchNotifications();
        if (!isMounted) return;
        setNotifications(
          Array.isArray(response.notifications) ? response.notifications : [],
        );
        setUnreadCount(Number(response.unreadCount || 0));
      } catch {
        if (isMounted) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (isMounted) {
          setLoadingNotifications(false);
        }
      }
    };

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleNotifications = useMemo(
    () => notifications.slice(0, 5),
    [notifications],
  );

  const handleMarkOneRead = async (id: string) => {
    try {
      const response = await markNotificationRead(id);
      setUnreadCount(Number(response.unreadCount || 0));
      setNotifications((current) =>
        current.map((item) =>
          item._id === id ? { ...item, isRead: true } : item,
        ),
      );
    } catch {
      // keep current state if the backend update fails
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      await handleMarkOneRead(notification._id);
    }
  };

  return (
    <header className="w-full h-18 bg-[#1A1B1E]/90 backdrop-blur-xl border-b border-[#2A2B30] px-6 lg:px-8 flex items-center justify-between z-20 shrink-0">
      {/* Left: Refined Workspace Context with Vertical Accent Bar */}
      <div className="flex items-center gap-3">
        <div className="w-[3px] h-6 rounded-full bg-gradient-to-b from-[#F97316] to-[#EA580C] shadow-[0_0_8px_rgba(249,115,22,0.4)] shrink-0" />
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.22em] text-[#F4F4F5] leading-none">
            Customer Workspace
          </p>
          <p className="text-[10px] text-[#A1A1AA]/60 font-sans tracking-normal mt-1">
            LogiTrack Order Management
          </p>
        </div>
      </div>

      {/* Right: Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        {/* Notifications Drawer Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="w-9 h-9 rounded-2xl bg-[#111214] border border-[#2A2B30] flex items-center justify-center text-[#A1A1AA] hover:border-[#F97316]/60 hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Show notifications"
          >
            <Bell size={16} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-[#111214] border border-[#2A2B30] shadow-2xl z-30 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#2A2B30]">
                <p className="text-sm font-bold text-white">Notifications</p>
                <span className="text-xs text-[#A1A1AA]">
                  {unreadCount} unread
                </span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {visibleNotifications.map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-2xl border p-3 transition-colors hover:border-[#F97316] cursor-pointer ${
                      item.isRead ? "border-[#2A2B30] bg-[#1A1B1E]/40" : "border-[#F97316]/40 bg-[#F97316]/10"
                    }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleOpenNotification(item)}
                  >
                    <p className="text-white font-semibold text-xs">{item.title}</p>
                    <p className="text-xs text-[#A1A1AA] mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
                {visibleNotifications.length === 0 && (
                  <div className="text-xs text-[#A1A1AA] text-center py-4">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Link */}
        <Link
          href="/customer/profile"
          className="flex items-center gap-2.5 bg-[#111214] border border-[#2A2B30] px-3.5 py-1.5 rounded-2xl hover:border-[#F97316]/40 transition"
        >
          <div className="w-7 h-7 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316] font-bold text-xs">
            {userName[0]?.toUpperCase() || "C"}
          </div>
          <div className="hidden sm:block text-left">
            <h2 className="text-white font-semibold text-xs leading-none">{userName}</h2>
            <p className="text-[#A1A1AA] text-[10px] mt-0.5">Customer</p>
          </div>
          <span className="sr-only">Open profile</span>
        </Link>
      </div>

      {/* Notification Modal */}
      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-bold text-white pr-4">
                {selectedNotification.title}
              </h2>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-[#A1A1AA] hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-neutral-300 text-xs mb-4 leading-relaxed">
              {selectedNotification.message}
            </p>

            {selectedNotification.orderCode && (
              <div className="mb-4 p-3 bg-[#111214] border border-[#2A2B30] rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-semibold mb-1">Order ID</p>
                <p className="text-xs font-mono text-white">
                  {selectedNotification.orderCode}
                </p>
              </div>
            )}

            {selectedNotification.metadata?.productName && (
              <div className="mb-4 p-3 bg-[#111214] border border-[#2A2B30] rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#A1A1AA] font-semibold mb-1">Product</p>
                <p className="text-xs text-white">
                  {selectedNotification.metadata.productName}
                </p>
              </div>
            )}

            <div className="text-[11px] text-[#A1A1AA] mb-4">
              {selectedNotification.createdAt
                ? new Date(selectedNotification.createdAt).toLocaleString()
                : "Just now"}
            </div>

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default CustomerHeader;
