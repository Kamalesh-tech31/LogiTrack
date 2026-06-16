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
    <div className="w-full h-20 bg-[#111111] border-b border-neutral-900 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Delivery Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 px-4 py-3 bg-[#0B0B0B]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-neutral-400">Agent Online</span>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-neutral-800 px-4 py-3 bg-[#0B0B0B]">
          <MapPinned size={16} className="text-neutral-400" />
          <span className="text-sm text-white">{time || "--:--:--"}</span>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => setIsNotifOpen((s) => !s)}
            className="w-12 h-12 rounded-2xl bg-[#0B0B0B] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-[#7F1D1D] hover:text-white transition-all"
          >
            <Bell size={20} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-3 w-80 rounded-3xl bg-[#0B0B0B] border border-neutral-800 shadow-xl z-20">
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div>
                  <p className="text-sm text-neutral-400">Notifications</p>
                  <p className="text-xs text-neutral-500">
                    {unreadCount} unread
                  </p>
                </div>
              </div>
              <div className="space-y-3 p-4">
                {notifications.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className={`rounded-2xl border p-3 transition-colors hover:border-[#7F1D1D] cursor-pointer ${item.isRead ? "border-[#1F1F1F]" : "border-[#7F1D1D]/40"}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => void handleOpenNotification(item)}
                  >
                    <p className="text-white font-semibold">{item.title}</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      {item.message}
                    </p>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="text-sm text-neutral-500">
                    No notifications available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 bg-[#0B0B0B] border border-neutral-800 px-4 py-2 rounded-2xl">
          <div className="w-10 h-10 rounded-full bg-[#7F1D1D] flex items-center justify-center text-white font-bold">
            {userName[0]?.toUpperCase() || "A"}
          </div>
          <div>
            <h3 className="text-white font-medium">{userName}</h3>
            <p className="text-neutral-500 text-sm">Delivery Agent</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
