"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Clock, CheckCircle, Truck } from "lucide-react";
import { fetchOwnerOrders } from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  price: number;
  images?: string[];
}

interface OrderItem {
  product?: Product;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  items: OrderItem[];
  totalPrice: number;
  status:
    | "pending"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled"
    | string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      setError(null);

      try {
        const ordersData = await fetchOwnerOrders();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  const totalOrders = orders.length;
  const pendingCount = orders.filter(
    (order) => order.status === "pending",
  ).length;
  // Treat both 'completed' and 'delivered' as delivered for owner reporting
  const deliveredCount = orders.filter((order) =>
    ["completed", "delivered"].includes((order.status || "").toLowerCase()),
  ).length;

  // In delivery includes assigned/processing/shipped/out-for-delivery
  const inDeliveryCount = orders.filter((order) =>
    ["assigned", "processing", "shipped", "out-for-delivery"].includes(
      (order.status || "").toLowerCase(),
    ),
  ).length;

  function getStatusClasses(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "processing":
        return "bg-blue-500/20 text-blue-400";
      case "shipped":
        return "bg-purple-500/20 text-purple-400";
      case "delivered":
        return "bg-green-500/20 text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-300";
    }
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div>
        <h1 className="text-4xl font-bold text-white">Orders Management</h1>

        <p className="text-gray-400 mt-2">
          Manage customer orders and delivery flow
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Total Orders</p>

              <h2 className="text-3xl font-bold mt-2">{totalOrders}</h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
              <ShoppingCart className="text-[#F97316]" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Pending</p>

              <h2 className="text-3xl font-bold mt-2">{pendingCount}</h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Clock className="text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Delivered</p>

              <h2 className="text-3xl font-bold mt-2">{deliveredCount}</h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <CheckCircle className="text-green-400" />
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">In Delivery</p>

              <h2 className="text-3xl font-bold mt-2">{inDeliveryCount}</h2>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <Truck className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="text-[#A1A1AA]">Loading orders...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {/* Orders Table */}
      <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[#2A2B30] flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Recent Orders</h2>

            <p className="text-[#A1A1AA] text-sm mt-1">
              Latest customer transactions
            </p>
          </div>

          <button
            type="button"
            className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-medium transition-all cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.3)]"
          >
            Export
          </button>
        </div>

        <table className="w-full">
          <thead className="bg-[#111214]">
            <tr className="text-left text-[#A1A1AA] text-sm">
              <th className="p-5">Order ID</th>
              <th className="p-5">Customer</th>
              <th className="p-5">Product</th>
              <th className="p-5">Amount</th>
              <th className="p-5">Payment</th>
              <th className="p-5">Status</th>
              <th className="p-5">Action</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order, index) => (
              <tr
                key={order._id}
                className="border-t border-[#2A2B30] hover:bg-[#111214]/60 transition-all"
              >
                <td className="p-5 font-medium">{order.orderId}</td>

                <td className="p-5">{order.customerName}</td>

                <td className="p-5 text-gray-300">
                  {order.items[0]?.product?.name ?? "Unknown product"}
                </td>

                <td className="p-5">₹{order.totalPrice}</td>

                <td className="p-5">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      ["completed", "delivered"].includes(
                        (order.status || "").toLowerCase(),
                      )
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {["completed", "delivered"].includes(
                      (order.status || "").toLowerCase(),
                    )
                      ? "Paid"
                      : "Pending"}
                  </span>
                </td>

                <td className="p-5">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${getStatusClasses(order.status)}`}
                  >
                    {order.status}
                  </span>
                </td>

                <td className="p-5">
                  <button className="px-4 py-2 rounded-xl border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white transition-all cursor-pointer">
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
