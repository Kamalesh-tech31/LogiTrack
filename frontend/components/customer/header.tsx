"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

export function CustomerHeader() {
  const [userName, setUserName] = useState("User");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

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
        setNotifications(Array.isArray(response.notifications) ? response.notifications : []);
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

  const visibleNotifications = useMemo(() => notifications.slice(0, 5), [notifications]);

  const handleMarkAllRead = async () => {
    try {
      const response = await markAllNotificationsRead();
      setUnreadCount(Number(response.unreadCount || 0));
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      // keep current state if the backend update fails
    }
  };

  const handleMarkOneRead = async (id: string) => {
    try {
      const response = await markNotificationRead(id);
      setUnreadCount(Number(response.unreadCount || 0));
      setNotifications((current) =>
        current.map((item) => (item._id === id ? { ...item, isRead: true } : item)),
      );
    } catch {
      // keep current state if the backend update fails
    }
  };

  return (
    <div className="w-full bg-[#111111] border-b border-neutral-900 px-8 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-2xl bg-[#0B0B0B] border border-neutral-800 text-neutral-400 hover:bg-[#7F1D1D] hover:text-white"
          aria-label="Show notifications"
        >
          <Bell size={20} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>

        <Link href="/customer/profile" className="flex min-w-0 items-center gap-3 rounded-2xl border border-neutral-800 bg-[#0B0B0B] px-4 py-2 hover:bg-[#1A1A1A]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F1D1D] text-sm font-bold text-white">
            {userName[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 overflow-hidden text-left">
            <h3 className="truncate text-sm font-medium text-white">{userName}</h3>
            <p className="truncate text-xs text-neutral-500">View profile</p>
          </div>
          <span className="sr-only">Open profile</span>
        </Link>
      </div>
    </div>
  );
}