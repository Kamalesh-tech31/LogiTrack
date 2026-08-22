"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, IndianRupee, ShoppingBag, Truck, CheckCircle2, Clock3, AlertCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchCustomerAnalyticsSummary, type CustomerAnalyticsSummary } from "@/lib/api";

const colors = ["#F97316", "#38BDF8", "#34D399", "#FBBF24", "#A78BFA", "#EA580C"];

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  assigned: "Assigned",
  shipped: "Shipped",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export default function CustomerAnalyticsPage() {
  const [summary, setSummary] = useState<CustomerAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let isMounted = true;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    const loadSummary = async () => {
      try {
        const response = await fetchCustomerAnalyticsSummary();
        if (isMounted) setSummary(response);
        if (isMounted) setLastUpdated(new Date());
        if (isMounted) setError(null);
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load analytics");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadSummary();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadSummary();
      }
    };

    refreshTimer = setInterval(() => {
      void loadSummary();
    }, 30000);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const monthlyOrders = useMemo(() => summary?.monthlyStats || [], [summary]);

  const statusDistribution = useMemo(
    () =>
      (summary?.orderStatusDistribution || []).map((entry) => ({
        ...entry,
        name: statusLabels[entry.name] || entry.name,
      })),
    [summary],
  );

  const statCards = useMemo(
    () => [
      {
        label: "Total Orders",
        value: summary?.totalOrders ?? 0,
        icon: ShoppingBag,
        accent: "text-[#F97316]",
        subtext: "All lifetime purchases",
      },
      {
        label: "Pending Orders",
        value: summary?.pendingOrders ?? 0,
        icon: Clock3,
        accent: "text-amber-400",
        subtext: "Awaiting dispatch",
      },
      {
        label: "Shipped Orders",
        value: summary?.shippedOrders ?? 0,
        icon: Truck,
        accent: "text-blue-400",
        subtext: "In active transit",
      },
      {
        label: "Delivered Orders",
        value: summary?.deliveredOrders ?? 0,
        icon: CheckCircle2,
        accent: "text-emerald-400",
        subtext: "Fulfilled handoffs",
      },
      {
        label: "Completed Orders",
        value: summary?.completedOrders ?? 0,
        icon: Activity,
        accent: "text-[#FDBA74]",
        subtext: "Settled transactions",
      },
      {
        label: "Total Spending",
        value: `₹${currencyFormatter.format(summary?.totalSpending ?? 0)}`,
        icon: IndianRupee,
        accent: "text-[#F97316]",
        subtext: "Cumulative expenditure",
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
            Spending Intelligence
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Customer Analytics
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
            Track order history, review cumulative expenditure, and analyze fulfillment metrics.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] px-4 py-2 text-xs text-[#A1A1AA] font-mono self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center text-xs text-[#A1A1AA]">
          Loading customer analytics...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-red-400" />
          <p className="text-sm font-bold text-white">Unable to load analytics</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      ) : summary ? (
        <>
          {/* Unified 6 Stat Cards (No random rainbow gradients) */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm hover:border-[#F97316]/50 transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
                        {item.label}
                      </p>
                      <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2A2B30] bg-[#111214] ${item.accent}`}>
                        <Icon size={18} />
                      </div>
                    </div>

                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                      {item.value}
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
                    {item.subtext}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Monthly Orders Line Chart */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div className="pb-4 border-b border-[#2A2B30]/60">
                <h2 className="text-base font-bold text-white font-display">
                  Monthly Orders Trend
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Volume of orders placed month over month
                </p>
              </div>

              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" opacity={0.6} />
                    <XAxis dataKey="month" stroke="#A1A1AA" fontSize={11} />
                    <YAxis stroke="#A1A1AA" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#111214",
                        border: "1px solid #2A2B30",
                        borderRadius: 16,
                        color: "#fff",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#F97316"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#F97316" }}
                      activeDot={{ r: 6, fill: "#FDBA74" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Spending Bar Chart */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div className="pb-4 border-b border-[#2A2B30]/60">
                <h2 className="text-base font-bold text-white font-display">
                  Monthly Spending Analysis
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Total rupees expended per billing period
                </p>
              </div>

              <div className="h-72 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" opacity={0.6} />
                    <XAxis dataKey="month" stroke="#A1A1AA" fontSize={11} />
                    <YAxis stroke="#A1A1AA" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        background: "#111214",
                        border: "1px solid #2A2B30",
                        borderRadius: 16,
                        color: "#fff",
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "#FFFFFF", fontWeight: "bold" }}
                      formatter={(value) => [
                        `₹${currencyFormatter.format(Number(value))}`,
                        "Spending",
                      ]}
                    />
                    <Bar
                      dataKey="spending"
                      fill="#F97316"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Status Distribution Pie Chart */}
          <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm">
            <div className="pb-4 border-b border-[#2A2B30]/60">
              <h2 className="text-base font-bold text-white font-display">
                Order Status Distribution
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Proportional breakdown of lifetime order statuses
              </p>
            </div>

            <div className="h-80 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: "#A1A1AA", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111214",
                      border: "1px solid #2A2B30",
                      borderRadius: 16,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#FFFFFF" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}