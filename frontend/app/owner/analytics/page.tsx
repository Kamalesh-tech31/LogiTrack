"use client";

import { useEffect, useState } from "react";
import { fetchAnalytics, OwnerAnalyticsData } from "@/lib/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import {
  IndianRupee,
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<OwnerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAnalytics() {
      setLoading(true);
      setError(null);

      try {
        const analyticsData = await fetchAnalytics();
        setAnalytics(analyticsData);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load analytics");
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  const totalProducts = analytics?.totalProducts ?? 0;
  const healthyCount = analytics?.healthyCount ?? 0;
  const lowCount = analytics?.lowStockCount ?? 0;
  const noStockCount = analytics?.noStockCount ?? 0;

  const stockHealthData = [
    {
      name: "Healthy",
      value: healthyCount,
      color: "#34D399",
      bgClass: "bg-emerald-400",
    },
    {
      name: "Low Stock",
      value: lowCount,
      color: "#FBBF24",
      bgClass: "bg-amber-400",
    },
    {
      name: "Out of Stock",
      value: noStockCount,
      color: "#F87171",
      bgClass: "bg-red-400",
    },
  ];

  const hasStockData = totalProducts > 0;
  const hasRevenueData =
    analytics && (analytics.last30Revenue > 0 || analytics.prev30Revenue > 0);
  const hasDeliveredData =
    analytics &&
    (analytics.last30DeliveredOrders > 0 ||
      analytics.prev30DeliveredOrders > 0);

  const summaryCards = analytics
    ? [
        {
          title: "Total Revenue",
          value: `₹${analytics.totalRevenue.toLocaleString()}`,
          icon: IndianRupee,
          accent: "text-[#F97316]",
          footnote: "Cumulative store earnings",
        },
        {
          title: "Total Orders",
          value: analytics.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          accent: "text-blue-400",
          footnote: "Lifetime order volume",
        },
        {
          title: "Delivered Orders",
          value: analytics.totalDeliveredOrders.toLocaleString(),
          icon: PackageCheck,
          accent: "text-emerald-400",
          footnote: "Completed dispatches",
        },
        {
          title: "Low Stock Warnings",
          value: analytics.lowStockCount.toString(),
          icon: AlertTriangle,
          accent: "text-amber-400",
          footnote: "SKUs below minimum safety",
        },
      ]
    : [];

  const revenueComparison = analytics
    ? [
        { label: "Previous 30d", value: analytics.prev30Revenue },
        { label: "Last 30d", value: analytics.last30Revenue },
      ]
    : [];

  const deliveryComparison = analytics
    ? [
        { label: "Prev 30d", value: analytics.prev30DeliveredOrders },
        { label: "Last 30d", value: analytics.last30DeliveredOrders },
      ]
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Financial & Logistics Intelligence
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Business Analytics
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Monitor multi-period revenue, review order fulfillment velocity, and track stock reserve health.
        </p>
      </div>

      {loading && (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-xs text-[#A1A1AA]">
          Loading business analytics...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-red-400" />
          <p className="text-sm font-bold text-white">Error loading analytics</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {analytics && (
        <>
          {/* 4 Summary Cards */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
                        {card.title}
                      </p>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] ${card.accent}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">
                      {card.value}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
                    {card.footnote}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Stock Health Donut Card */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div className="pb-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">Stock Health</h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Inventory reserve distribution</p>
                </div>
                <PieIcon size={16} className="text-[#F97316]" />
              </div>

              <div className="py-4 flex flex-col items-center justify-center relative min-h-[220px]">
                {hasStockData ? (
                  <>
                    <div className="h-44 w-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stockHealthData}
                            dataKey="value"
                            innerRadius={55}
                            outerRadius={75}
                            startAngle={90}
                            endAngle={-270}
                            paddingAngle={3}
                          >
                            {stockHealthData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 text-center">
                      <p className="text-xs font-bold text-white font-display">
                        {totalProducts} Total {totalProducts === 1 ? "Product" : "Products"}
                      </p>
                      <div className="mt-2.5 flex flex-wrap justify-center gap-3">
                        {stockHealthData.map((s) => (
                          <div key={s.name} className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA]">
                            <span className={`${s.bgClass} inline-block h-2 w-2 rounded-full`} />
                            <span>{s.name}: <strong className="text-white">{s.value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-xs text-[#A1A1AA] space-y-1">
                    <AlertCircle size={20} className="mx-auto text-[#A1A1AA]/50" />
                    <p className="text-white font-semibold">No Stock Records</p>
                    <p className="text-[11px]">Add products to generate stock distribution data.</p>
                  </div>
                )}
              </div>
            </div>

            {/* 30 Day Revenue Comparison Bar Chart */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div className="pb-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">30-Day Revenue</h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Current vs previous period income</p>
                </div>
                <TrendingUp size={16} className="text-emerald-400" />
              </div>

              <div className="h-64 mt-4 relative flex items-center justify-center">
                {hasRevenueData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" opacity={0.6} />
                      <XAxis dataKey="label" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                      <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                        contentStyle={{
                          backgroundColor: "#111214",
                          border: "1px solid #2A2B30",
                          borderRadius: 16,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="#F97316" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-6 text-xs text-[#A1A1AA] space-y-1">
                    <BarChart3 size={20} className="mx-auto text-[#A1A1AA]/50" />
                    <p className="text-white font-semibold">No Revenue Activity</p>
                    <p className="text-[11px]">30-day comparative income will appear upon new sales.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivered Orders Trend */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div className="pb-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">Fulfillment Trend</h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">Delivered orders comparison</p>
                </div>
                <PackageCheck size={16} className="text-blue-400" />
              </div>

              <div className="h-64 mt-4 relative flex items-center justify-center">
                {hasDeliveredData ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deliveryComparison}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" opacity={0.6} />
                      <XAxis dataKey="label" stroke="#A1A1AA" fontSize={11} tickLine={false} />
                      <YAxis stroke="#A1A1AA" fontSize={11} tickLine={false} />
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), "Delivered Orders"]}
                        contentStyle={{
                          backgroundColor: "#111214",
                          border: "1px solid #2A2B30",
                          borderRadius: 16,
                          color: "#fff",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" fill="#34D399" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-6 text-xs text-[#A1A1AA] space-y-1">
                    <PackageCheck size={20} className="mx-auto text-[#A1A1AA]/50" />
                    <p className="text-white font-semibold">No Deliveries Recorded</p>
                    <p className="text-[11px]">Delivered volume will track once couriers complete dispatches.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Period Statistics Cards */}
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#2A2B30]/60">
                <h2 className="text-base font-bold text-white font-display">Last 30 Days Activity</h2>
                <p className="text-xs text-[#A1A1AA]">Recent operational order counts</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#111214] border border-[#2A2B30] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Total Orders</p>
                  <p className="mt-2 text-2xl font-extrabold text-white font-display">{analytics.last30Orders.toLocaleString()}</p>
                </div>

                <div className="rounded-2xl bg-[#111214] border border-[#2A2B30] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Delivered</p>
                  <p className="mt-2 text-2xl font-extrabold text-white font-display">{analytics.last30DeliveredOrders.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-[#2A2B30]/60">
                <h2 className="text-base font-bold text-white font-display">Previous 30 Days Activity</h2>
                <p className="text-xs text-[#A1A1AA]">Prior comparative benchmark period</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-[#111214] border border-[#2A2B30] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Total Orders</p>
                  <p className="mt-2 text-2xl font-extrabold text-white font-display">{analytics.prev30Orders.toLocaleString()}</p>
                </div>

                <div className="rounded-2xl bg-[#111214] border border-[#2A2B30] p-4">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Delivered</p>
                  <p className="mt-2 text-2xl font-extrabold text-white font-display">{analytics.prev30DeliveredOrders.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
