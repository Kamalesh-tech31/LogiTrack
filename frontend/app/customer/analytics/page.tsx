"use client";

import { useEffect, useMemo, useState } from "react";
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

const colors = ["#60A5FA", "#F87171", "#34D399", "#FBBF24", "#A78BFA", "#FB7185"];

export default function CustomerAnalyticsPage() {
  const [summary, setSummary] = useState<CustomerAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      try {
        const response = await fetchCustomerAnalyticsSummary();
        if (isMounted) setSummary(response);
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load analytics");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const monthlyOrders = useMemo(() => summary?.monthlyStats || [], [summary]);

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Customer analytics</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Analytics Dashboard</h1>
        <p className="mt-2 text-sm text-neutral-400">Real order activity, spend, and status trends across your account.</p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-6 text-white">Loading analytics...</div>
      ) : error ? (
        <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-6 text-[#FCA5A5]">{error}</div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Total Orders", value: summary.totalOrders },
              { label: "Delivered Orders", value: summary.deliveredOrders },
              { label: "Pending Orders", value: summary.pendingOrders },
              { label: "Shipped Orders", value: summary.shippedOrders },
              { label: "Total Spending", value: `₹${summary.totalSpending.toLocaleString()}` },
            ].map((item) => (
              <Card key={item.label} className="border border-[#27272A] bg-[#111111]">
                <CardContent className="p-5">
                  <p className="text-sm text-neutral-400">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card className="border border-[#27272A] bg-[#111111]">
              <CardHeader>
                <CardTitle>Monthly Orders Trend</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="month" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip contentStyle={{ background: "#111111", border: "1px solid #27272A" }} />
                    <Line type="monotone" dataKey="orders" stroke="#F87171" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-[#27272A] bg-[#111111]">
              <CardHeader>
                <CardTitle>Monthly Spending Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyOrders}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                    <XAxis dataKey="month" stroke="#A1A1AA" />
                    <YAxis stroke="#A1A1AA" />
                    <Tooltip contentStyle={{ background: "#111111", border: "1px solid #27272A" }} />
                    <Bar dataKey="spending" fill="#60A5FA" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card className="border border-[#27272A] bg-[#111111]">
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.orderStatusDistribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={75}
                    outerRadius={130}
                    paddingAngle={2}
                  >
                    {summary.orderStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: "#111111", border: "1px solid #27272A" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}