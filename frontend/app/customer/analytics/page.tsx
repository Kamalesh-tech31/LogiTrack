"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, CalendarDays, IndianRupee, ShoppingBag, Truck, CheckCircle2, Clock3 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchCustomerAnalyticsSummary, type CustomerAnalyticsSummary } from "@/lib/api";

const colors = ["#F97316", "#60A5FA", "#34D399", "#FBBF24", "#A78BFA", "#EA580C"];

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
        accent: "from-[#F97316]/20 to-[#F97316]/5",
      },
      {
        label: "Pending Orders",
        value: summary?.pendingOrders ?? 0,
        icon: Clock3,
        accent: "from-amber-500/20 to-amber-500/5",
      },
      {
        label: "Shipped Orders",
        value: summary?.shippedOrders ?? 0,
        icon: Truck,
        accent: "from-cyan-500/20 to-cyan-500/5",
      },
      {
        label: "Delivered Orders",
        value: summary?.deliveredOrders ?? 0,
        icon: CheckCircle2,
        accent: "from-emerald-500/20 to-emerald-500/5",
      },
      {
        label: "Completed Orders",
        value: summary?.completedOrders ?? 0,
        icon: Activity,
        accent: "from-violet-500/20 to-violet-500/5",
      },
      {
        label: "Total Spending",
        value: `₹${currencyFormatter.format(summary?.totalSpending ?? 0)}`,
        icon: IndianRupee,
        accent: "from-[#F97316]/20 to-[#F97316]/5",
      },
    ],
    [summary],
  );

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-[#2A2B30] bg-[linear-gradient(135deg,rgba(249,115,22,0.15),rgba(26,27,30,0.95)_60%)] p-6 md:p-8 lg:flex-row lg:items-end lg:justify-between shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-[#A1A1AA]">
            Customer analytics
          </p>
          <h1 className="text-3xl font-bold text-white md:text-4xl">
            Analytics Dashboard
          </h1>
          <p className="text-sm text-[#A1A1AA] md:text-base">
            Real order activity, spend, and status trends across your account,
            refreshed automatically.
          </p>
        </div>
        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] px-4 py-3 text-sm text-[#A1A1AA]">
          <p className="text-xs uppercase tracking-[0.25em] text-[#A1A1AA]">
            Last updated
          </p>
          <p className="mt-1 text-white font-medium">
            {lastUpdated
              ? lastUpdated.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Waiting for data"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] p-6 text-white">
          Loading analytics...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {statCards.map((item) => {
              const Icon = item.icon;

              return (
                <Card
                  key={item.label}
                  className="overflow-hidden border border-[#2A2B30] bg-[#1A1B1E] shadow-sm hover:border-[#F97316] transition-all"
                >
                  <CardContent
                    className={`relative p-5 bg-gradient-to-br ${item.accent}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#A1A1AA]">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold text-white">
                          {item.value}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3 text-[#F97316]">
                        <Icon size={20} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Monthly Orders Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" />
                    <XAxis dataKey="month" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip
                      contentStyle={{
                        background: "#111214",
                        border: "1px solid #2A2B30",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                      labelStyle={{ color: "#FFFFFF" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#F97316"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#F97316" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
              <CardHeader>
                <CardTitle className="text-white">Monthly Spending Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2B30" />
                    <XAxis dataKey="month" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip
                      contentStyle={{
                        background: "#111214",
                        border: "1px solid #2A2B30",
                        borderRadius: 16,
                        color: "#fff",
                      }}
                      labelStyle={{ color: "#FFFFFF" }}
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
              </CardContent>
            </Card>
          </div>

          <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
            <CardHeader>
              <CardTitle className="text-white">Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={75}
                    outerRadius={130}
                    paddingAngle={2}
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ color: "#A1A1AA" }} />
                  <Tooltip
                    contentStyle={{
                      background: "#111214",
                      border: "1px solid #2A2B30",
                      borderRadius: 16,
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#FFFFFF" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}