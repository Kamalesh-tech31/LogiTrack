"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "recharts";
import {
  IndianRupee,
  ShoppingCart,
  PackageCheck,
  AlertTriangle,
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

  // Build stock-category counts for pie chart
  const totalProducts = analytics?.totalProducts ?? 0;
  const healthyCount = analytics?.healthyCount ?? 0;
  const lowCount = analytics?.lowStockCount ?? 0;
  const noStockCount = analytics?.noStockCount ?? 0;

  const stockHealthData = [
    {
      name: "Healthy",
      value: healthyCount,
      color: "#22c55e",
      bgClass: "bg-emerald-500",
    },
    {
      name: "Low Stock",
      value: lowCount,
      color: "#f59e0b",
      bgClass: "bg-amber-500",
    },
    {
      name: "No Stock",
      value: noStockCount,
      color: "#ef4444",
      bgClass: "bg-red-500",
    },
  ];

  const summaryCards = analytics
    ? [
        {
          title: "Total Revenue",
          value: `₹${analytics.totalRevenue.toLocaleString()}`,
          icon: IndianRupee,
          iconBg: "bg-emerald-500/10 text-emerald-400",
        },
        {
          title: "Total Orders",
          value: analytics.totalOrders.toLocaleString(),
          icon: ShoppingCart,
          iconBg: "bg-sky-500/10 text-sky-400",
        },
        {
          title: "Delivered Orders",
          value: analytics.totalDeliveredOrders.toLocaleString(),
          icon: PackageCheck,
          iconBg: "bg-violet-500/10 text-violet-400",
        },
        {
          title: "Low Stock Items",
          value: analytics.lowStockCount.toString(),
          icon: AlertTriangle,
          iconBg: "bg-amber-500/10 text-amber-400",
        },
      ]
    : [];

  const revenueComparison = analytics
    ? [
        { label: "Previous 30d", value: analytics.prev30Revenue },
        { label: "Last 30d", value: analytics.last30Revenue },
      ]
    : [];

  return (
    <div className="space-y-8 p-8">
      {loading ? (
        <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 text-sm text-primary">
          Loading analytics data...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : !analytics ? (
        <div className="rounded-3xl border border-muted/20 bg-muted/5 p-6 text-sm text-muted-foreground">
          No analytics data available. Please check your owner account or
          backend connection.
        </div>
      ) : null}

      {analytics ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm text-muted-foreground">
                        {card.title}
                      </p>
                      <div
                        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconBg}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <p className="mt-3 text-3xl font-semibold text-white">
                      {card.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Stock Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stockHealthData}
                          dataKey="value"
                          innerRadius={60}
                          outerRadius={80}
                          startAngle={90}
                          endAngle={-270}
                          paddingAngle={2}
                        >
                          {stockHealthData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center w-full">
                    {totalProducts === 0 ? (
                      <div className="text-sm text-neutral-400">
                        No products found
                      </div>
                    ) : (
                      <>
                        <div className="mb-2 text-sm text-muted-foreground">
                          Stock distribution
                        </div>
                        <div className="text-3xl font-semibold text-white">
                          {totalProducts} product
                          {totalProducts === 1 ? "" : "s"}
                        </div>
                        <div className="mt-3 flex flex-wrap justify-center gap-4">
                          {stockHealthData.map((s) => (
                            <div
                              key={s.name}
                              className="flex items-center gap-2 text-sm text-neutral-300"
                            >
                              <span
                                className={`${s.bgClass} inline-block h-3 w-3 rounded-full`}
                              />
                              <span>
                                {s.name}:{" "}
                                <span className="text-white ml-1">
                                  {s.value}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  30 Day Revenue Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueComparison}>
                      <XAxis
                        dataKey="label"
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          `₹${value.toLocaleString()}`,
                          "Revenue",
                        ]}
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid #2d2d2d",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#ef4444"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Delivered Orders Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          label: "Prev 30d",
                          value: analytics.prev30DeliveredOrders,
                        },
                        {
                          label: "Last 30d",
                          value: analytics.last30DeliveredOrders,
                        },
                      ]}
                    >
                      <XAxis
                        dataKey="label"
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#6b7280"
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => [
                          value.toLocaleString(),
                          "Delivered Orders",
                        ]}
                        contentStyle={{
                          backgroundColor: "#111111",
                          border: "1px solid #2d2d2d",
                          borderRadius: 12,
                          color: "#fff",
                        }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#22c55e"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Last 30 Days Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-[#0B0B0B] p-4">
                  <p className="text-sm text-muted-foreground">
                    Last 30 days total orders
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {analytics.last30Orders.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#0B0B0B] p-4">
                  <p className="text-sm text-muted-foreground">
                    Last 30 days delivered
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {analytics.last30DeliveredOrders.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Previous 30 Days Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-3xl bg-[#0B0B0B] p-4">
                  <p className="text-sm text-muted-foreground">
                    Previous 30 days total orders
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {analytics.prev30Orders.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-3xl bg-[#0B0B0B] p-4">
                  <p className="text-sm text-muted-foreground">
                    Previous 30 days delivered
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {analytics.prev30DeliveredOrders.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
