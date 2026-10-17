"use client";

import { useEffect, useState } from "react";
import { Clock, Bell } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

const Navbar = () => {
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("Delivery Agent");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }, 1000);

    const name = localStorage.getItem("userName");
    if (name) {
      setUserName(name);
    }

    return () => clearInterval(interval);
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
      }
    };

    void loadNotifications();

    return () => {
      isMounted = false;
    };
  }, []);

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
      // ignore
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
            Delivery Console
          </p>
          <p className="text-[10px] text-[#A1A1AA]/60 font-sans tracking-normal mt-1">
            LogiTrack Fleet Network
          </p>
        </div>
      </div>

      {/* Right: Status & Utilities */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Agent Status Pill */}
        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-[#2A2B30] px-3.5 py-1.5 bg-[#111214]">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-xs font-semibold text-[#A1A1AA]">Online</span>
        </div>

        {/* Live Clock Pill */}
        <div className="hidden md:flex items-center gap-2 rounded-2xl border border-[#2A2B30] px-3.5 py-1.5 bg-[#111214]">
          <Clock size={13} className="text-[#F97316]" />
          <span className="text-xs font-mono font-medium text-white">{time || "--:--:--"}</span>
        </div>

        {/* Notifications Drawer Button */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setIsNotifOpen((s) => !s)}
            className="w-9 h-9 rounded-2xl bg-[#111214] border border-[#2A2B30] flex items-center justify-center text-[#A1A1AA] hover:border-[#F97316]/60 hover:text-white transition-all cursor-pointer shadow-sm"
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
                {notifications.slice(0, 5).map((item) => (
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
                {notifications.length === 0 && (
                  <div className="text-xs text-[#A1A1AA] text-center py-4">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity Capsule */}
        <div className="flex items-center gap-2.5 bg-[#111214] border border-[#2A2B30] px-3.5 py-1.5 rounded-2xl">
          <div className="w-7 h-7 rounded-xl bg-[#F97316]/20 border border-[#F97316]/40 flex items-center justify-center text-[#F97316] font-bold text-xs">
            {userName[0]?.toUpperCase() || "A"}
          </div>
          <div className="hidden sm:block text-left">
            <h2 className="text-white font-semibold text-xs leading-none">{userName}</h2>
            <p className="text-[#A1A1AA] text-[10px] mt-0.5">Delivery Agent</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
