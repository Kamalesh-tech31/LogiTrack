"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";
import { useLogout } from "@/lib/logout";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

export function CustomerHeader() {
  const router = useRouter();
  const { logout } = useLogout();
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
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
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 rounded-3xl border-neutral-800 bg-[#0B0B0B] p-0 text-white">
            <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-white">Notifications</p>
                <p className="text-xs text-neutral-500">
                  {loadingNotifications ? "Loading..." : `${unreadCount} unread`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-[#F87171] hover:text-white"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {visibleNotifications.length > 0 ? (
                visibleNotifications.map((item) => (
                  <DropdownMenuItem
                    key={item._id}
                    className={`mb-2 cursor-pointer rounded-2xl border px-3 py-3 text-left focus:bg-[#1A1A1A] ${
                      item.isRead ? "border-neutral-800 bg-[#111111]" : "border-[#7F1D1D]/40 bg-[#1A1A1A]"
                    }`}
                    onClick={() => void handleMarkOneRead(item._id)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-white">{item.title}</p>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                          {item.orderCode || item.type}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-400">{item.message}</p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-4 py-8 text-sm text-neutral-500">
                  No notifications yet.
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <Link href="/customer/profile" className="flex min-w-0 items-center gap-3 rounded-2xl border border-neutral-800 bg-[#0B0B0B] px-4 py-2 hover:bg-[#1A1A1A]">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#7F1D1D] text-sm font-bold text-white">
            {userName[0]?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 overflow-hidden text-left">
            <h3 className="truncate text-sm font-medium text-white">{userName}</h3>
            <p className="truncate text-xs text-neutral-500">View profile</p>
          </div>
          <ExternalLink size={16} className="shrink-0 text-neutral-500" />
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex min-w-0 items-center gap-3 bg-[#0B0B0B] border border-neutral-800 px-4 py-2 rounded-2xl hover:bg-[#1A1A1A]"
            >
              <div className="min-w-0 overflow-hidden text-left">
                <h3 className="truncate text-sm font-medium text-white">Quick actions</h3>
                <p className="truncate text-xs text-neutral-500">Profile and account</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-3xl border-neutral-800 bg-[#0B0B0B] p-2 text-white">
            <DropdownMenuItem onSelect={() => router.push("/customer/profile")}>Profile</DropdownMenuItem>
            <AccountDeletionDialog roleLabel="Customer" triggerMode="menuItem" />
            <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}