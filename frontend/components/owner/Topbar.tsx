"use client";

import { useEffect, useState } from "react";
import { Bell, Crown } from "lucide-react";
import { JSX } from "react/jsx-runtime";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api";

const plans = [
  { name: "Starter", price: "₹29/mo", details: "Up to 5 users" },
  { name: "Growth", price: "₹59/mo", details: "Up to 20 users" },
  { name: "Enterprise", price: "Custom", details: "Unlimited seats" },
];

export default function Topbar(): JSX.Element {
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);
  const [userName, setUserName] = useState("User");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
      // ignore update failures
    }
  };

  const handleOpenNotification = async (notification: AppNotification) => {
    setSelectedNotification(notification);
    // Auto-mark as read when opened
    if (!notification.isRead) {
      await handleMarkOneRead(notification._id);
    }
  };

  const visibleNotifications = notifications.slice(0, 5);

  return (
    <div className="w-full h-20 bg-[#111111] border-b border-neutral-900 px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Welcome back, {userName}
        </p>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsPlanOpen((current) => !current);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-2 bg-[#7F1D1D]/20 border border-[#7F1D1D] px-4 py-2 rounded-2xl text-[#DC2626] font-medium"
            aria-expanded={isPlanOpen}
          >
            <Crown size={18} />
            <span>Pro Plan</span>
          </button>

          {isPlanOpen && (
            <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-[#0B0B0B] border border-neutral-800 shadow-xl z-20">
              <div className="p-4 border-b border-neutral-800">
                <p className="text-sm text-neutral-400">Upgrade options</p>
              </div>
              <div className="space-y-3 p-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-2xl border border-[#1F1F1F] p-3 hover:border-[#7F1D1D] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{plan.name}</p>
                      <span className="text-sm text-[#DC2626]">
                        {plan.price}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">
                      {plan.details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            title="Notifications"
            onClick={() => {
              setIsNotifOpen((current) => !current);
              setIsPlanOpen(false);
            }}
            className="w-12 h-12 rounded-2xl bg-[#0B0B0B] border border-neutral-800 flex items-center justify-center text-neutral-400 hover:bg-[#7F1D1D] hover:text-white transition-all"
            aria-expanded={isNotifOpen}
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
                {visibleNotifications.map((item) => (
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
                {visibleNotifications.length === 0 && (
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
            A
          </div>
          <div>
            <h3 className="text-white font-medium">{userName}</h3>
            <p className="text-neutral-500 text-sm">Business Owner</p>
          </div>
        </div>
      </div>

      {selectedNotification && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedNotification(null)}
        >
          <div
            className="bg-[#111111] border border-neutral-800 rounded-3xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold text-white pr-4">
                {selectedNotification.title}
              </h2>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-neutral-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <p className="text-neutral-300 mb-4">
              {selectedNotification.message}
            </p>

            {selectedNotification.orderCode && (
              <div className="mb-4 p-3 bg-[#0B0B0B] border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 mb-1">Order ID</p>
                <p className="text-sm font-mono text-white">
                  {selectedNotification.orderCode}
                </p>
              </div>
            )}

            {selectedNotification.metadata?.productName && (
              <div className="mb-4 p-3 bg-[#0B0B0B] border border-neutral-800 rounded-xl">
                <p className="text-xs text-neutral-500 mb-1">Product</p>
                <p className="text-sm text-white">
                  {selectedNotification.metadata.productName}
                </p>
              </div>
            )}

            <div className="text-xs text-neutral-500 mb-4">
              {selectedNotification.createdAt
                ? new Date(selectedNotification.createdAt).toLocaleString()
                : "Just now"}
            </div>

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full bg-[#7F1D1D] hover:bg-[#9D2D2D] text-white py-2 rounded-lg font-medium transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
