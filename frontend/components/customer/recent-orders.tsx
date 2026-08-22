"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { orders } from "@/lib/mock-data";
import { fetchOrders } from "@/lib/api";

const statusStyles = {
  delivered: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  shipped: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  pending: "bg-amber-100 text-amber-700 hover:bg-amber-100",
};

export function RecentOrders() {
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const ordersData = await fetchOrders();
        if (Array.isArray(ordersData)) {
          const normalized = ordersData
            .map((o: any, i: number) => ({
              id: o.id || o._id || o.orderId || `order-${i}`,
              customer: o.customer || o.customerName || "Unknown",
              status: o.status || "pending",
              amount: o.amount || o.totalPrice || 0,
              date: o.date || o.createdAt || o.updatedAt || new Date().toISOString(),
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          setRecentOrders(normalized);
        }
      } catch (error) {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  return (
    <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <h2 className="text-lg font-semibold text-foreground">Recent Orders</h2>
        <Link
          href="/customer/orders"
          className="text-sm font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-sm text-muted-foreground">
                <th className="px-6 py-3 font-medium">Order ID</th>
                <th className="px-6 py-3 font-medium">Customer</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-6 py-4 font-medium text-foreground">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {order.customer}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant="secondary"
                      className={
                        statusStyles[order.status] ||
                        "bg-gray-100 text-gray-700"
                      }
                    >
                      {order.status.charAt(0).toUpperCase() +
                        order.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-foreground">
                    ₹{order.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
