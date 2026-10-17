"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Package, Clock, IndianRupee } from "lucide-react";
import { customerStats } from "@/lib/mock-data";
import { fetchDashboardStats } from "@/lib/api";

const defaultStats = [
  {
    label: "Total Orders",
    value: customerStats.totalOrders.toLocaleString(),
    icon: ShoppingCart,
    color: "text-[#F97316]",
    bgColor: "bg-[#F97316]/10",
  },
  {
    label: "Items Ordered",
    value: customerStats.items.toString(),
    icon: Package,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
  },
  {
    label: "Pending Deliveries",
    value: customerStats.pending.toLocaleString(),
    icon: Clock,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
  },
  {
    label: "Total Spend",
    value: `₹${customerStats.revenue.toLocaleString()}`,
    icon: IndianRupee,
    color: "text-[#FDBA74]",
    bgColor: "bg-[#FDBA74]/10",
  },
];

export function StatsOverview() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsResponse = await fetchDashboardStats();
        if (Array.isArray(statsResponse) && statsResponse.length > 0) {
          const backendStats = statsResponse[0];
          setStats([
            {
              label: "Total Orders",
              value:
                backendStats.totalOrders?.toLocaleString() ||
                customerStats.totalOrders.toLocaleString(),
              icon: ShoppingCart,
              color: "text-[#F97316]",
              bgColor: "bg-[#F97316]/10",
            },
            {
              label: "Items Ordered",
              value: (
                backendStats.totalItems || customerStats.items
              ).toString(),
              icon: Package,
              color: "text-emerald-400",
              bgColor: "bg-emerald-500/10",
            },
            {
              label: "Pending Deliveries",
              value: (
                backendStats.pendingOrders || customerStats.pending
              ).toLocaleString(),
              icon: Clock,
              color: "text-amber-400",
              bgColor: "bg-amber-500/10",
            },
            {
              label: "Total Spend",
              value: `₹${(backendStats.totalRevenue || customerStats.revenue).toLocaleString()}`,
              icon: IndianRupee,
              color: "text-[#FDBA74]",
              bgColor: "bg-[#FDBA74]/10",
            },
          ]);
        }
      } catch (error) {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return (
    <section className="space-y-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
          Account Telemetry
        </p>
        <h2 className="text-xl font-bold text-white font-display tracking-tight mt-0.5">
          Activity Overview
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm hover:border-[#F97316]/50 transition-all duration-200 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
                {stat.label}
              </p>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2A2B30] bg-[#111214] ${stat.color}`}
              >
                <stat.icon size={18} />
              </div>
            </div>

            <p className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-3">
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default StatsOverview;
