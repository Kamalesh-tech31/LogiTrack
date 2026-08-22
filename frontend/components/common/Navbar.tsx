"use client";

import { useEffect, useState } from "react";

import { MapPinned, Bell } from "lucide-react";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

const Navbar = () => {
  const [time, setTime] = useState("");
  const [userName, setUserName] = useState("Agent");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
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
    <div className="w-full h-20 bg-[#1A1B1E] border-b border-[#2A2B30] px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Delivery Dashboard</h1>
        <p className="text-[#A1A1AA] text-sm mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-2xl border border-[#2A2B30] px-4 py-3 bg-[#111214]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-[#A1A1AA]">Agent Online</span>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#2A2B30] px-4 py-3 bg-[#111214]">
          <MapPinned size={16} className="text-[#A1A1AA]" />
          <span className="text-sm text-white">{time || "--:--:--"}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setIsNotifOpen((s) => !s)}
            className="w-12 h-12 rounded-2xl bg-[#111214] border border-[#2A2B30] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F97316] hover:text-white transition-all cursor-pointer"
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F97316] px-1 text-[10px] font-bold text-white shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-[#111214] border border-[#2A2B30] shadow-xl z-20">
              <div className="flex items-center justify-between p-4 border-b border-[#2A2B30]">
                <div>
                  <p className="text-sm text-[#A1A1AA]">Notifications</p>
                  <p className="text-xs text-[#A1A1AA]">
                    {unreadCount} unread
                  </p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {notifications.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-2xl border p-3 transition-colors hover:border-[#F97316] cursor-pointer ${item.isRead ? "border-[#2A2B30]" : "border-[#F97316]/40 bg-[#F97316]/5"}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleOpenNotification(item)}
                  >
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-sm text-[#A1A1AA] mt-1">
                      {item.message}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-sm text-[#A1A1AA]">
                    No notifications available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-[#111214] border border-[#2A2B30] px-4 py-2 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-[#F97316] flex items-center justify-center text-white font-bold shadow-[0_0_10px_rgba(249,115,22,0.4)]">
            {userName[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h3 className="text-white font-medium">{userName}</h3>
            <p className="text-[#A1A1AA] text-sm">Delivery Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
