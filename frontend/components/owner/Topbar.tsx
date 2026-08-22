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
    <div className="w-full h-20 bg-[#1A1B1E] border-b border-[#2A2B30] px-8 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold text-white">Owner Dashboard</h1>
        <p className="text-[#A1A1AA] text-sm mt-1">
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
            className="flex items-center gap-2 bg-[#F97316]/15 border border-[#F97316]/40 px-4 py-2 rounded-2xl text-[#F97316] font-medium"
            aria-expanded={isPlanOpen}
          >
            <Crown size={18} />
            <span>Pro Plan</span>
          </button>

          {isPlanOpen && (
            <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-[#111214] border border-[#2A2B30] shadow-xl z-20">
              <div className="p-4 border-b border-[#2A2B30]">
                <p className="text-sm text-[#A1A1AA]">Upgrade options</p>
              </div>
              <div className="space-y-3 p-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-2xl border border-[#2A2B30] p-3 hover:border-[#F97316] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-white">{plan.name}</p>
                      <span className="text-sm text-[#F97316] font-medium">
                        {plan.price}
                      </span>
                    </div>
                    <p className="text-sm text-[#A1A1AA] mt-1">
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
            className="w-12 h-12 rounded-2xl bg-[#111214] border border-[#2A2B30] flex items-center justify-center text-[#A1A1AA] hover:bg-[#F97316] hover:text-white transition-all cursor-pointer"
            aria-expanded={isNotifOpen}
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
                {visibleNotifications.map((item) => (
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
                {visibleNotifications.length === 0 && (
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
            A
          </div>
          <div>
            <h3 className="text-white font-medium">{userName}</h3>
            <p className="text-[#A1A1AA] text-sm">Business Owner</p>
          </div>
        </div>
      </div>

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
              <h2 className="text-xl font-bold text-white pr-4">
                {selectedNotification.title}
              </h2>
              <button
                onClick={() => setSelectedNotification(null)}
                className="text-[#A1A1AA] hover:text-white text-2xl leading-none cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-neutral-300 mb-4">
              {selectedNotification.message}
            </p>

            {selectedNotification.orderCode && (
              <div className="mb-4 p-3 bg-[#111214] border border-[#2A2B30] rounded-xl">
                <p className="text-xs text-[#A1A1AA] mb-1">Order ID</p>
                <p className="text-sm font-mono text-white">
                  {selectedNotification.orderCode}
                </p>
              </div>
            )}

            {selectedNotification.metadata?.productName && (
              <div className="mb-4 p-3 bg-[#111214] border border-[#2A2B30] rounded-xl">
                <p className="text-xs text-[#A1A1AA] mb-1">Product</p>
                <p className="text-sm text-white">
                  {selectedNotification.metadata.productName}
                </p>
              </div>
            )}

            <div className="text-xs text-[#A1A1AA] mb-4">
              {selectedNotification.createdAt
                ? new Date(selectedNotification.createdAt).toLocaleString()
                : "Just now"}
            </div>

            <button
              onClick={() => setSelectedNotification(null)}
              className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-2.5 rounded-xl font-semibold transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
