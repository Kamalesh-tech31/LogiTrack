"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, Clock, CheckCircle2, Truck, Copy, Check, Search, Package, AlertCircle } from "lucide-react";
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
    | "completed"
    | "cancelled"
    | string;
  shippedAt: string | null;
  deliveredAt: string | null;
}

function formatDisplayId(rawId: string | null | undefined) {
  if (!rawId) return "--";
  if (rawId.startsWith("ORD-")) {
    const parts = rawId.split("-");
    const last = parts[parts.length - 1];
    return `#${last.slice(-4)}`;
  }
  if (rawId.length > 8) {
    return `#${rawId.slice(-4).toUpperCase()}`;
  }
  return `#${rawId}`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const id = (order.orderId || order._id || "").toLowerCase();
    const customer = (order.customerName || "").toLowerCase();
    const product = (order.items?.[0]?.product?.name || "").toLowerCase();
    return id.includes(q) || customer.includes(q) || product.includes(q);
  });

  const totalOrders = orders.length;
  const deliveredOrders = orders.filter((o) =>
    ["delivered", "completed"].includes((o.status || "").toLowerCase()),
  ).length;
  const shippedOrders = orders.filter(
    (o) => (o.status || "").toLowerCase() === "shipped",
  ).length;
  const pendingOrders = orders.filter(
    (o) => !["delivered", "completed", "shipped"].includes((o.status || "").toLowerCase()),
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Order Fulfillment
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Orders Management
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Review customer purchases, monitor delivery pipelines, and check order values.
        </p>
      </div>

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Total Orders</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316]">
              <ShoppingCart size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{totalOrders}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Delivered</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{deliveredOrders}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">In Transit</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-blue-400">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{shippedOrders}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Processing</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{pendingOrders}</p>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              All Orders
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Comprehensive list of customer orders and fulfillment statuses
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by ID, customer, product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#111214] border border-[#2A2B30] rounded-2xl text-xs text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316]/60 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#A1A1AA]">
            Loading orders list...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm font-bold text-white">Unable to load orders</p>
            <p className="text-xs text-[#A1A1AA]">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B30]/60">
                {filtered.map((order, index) => {
                  const rawId = order.orderId || order._id;
                  const displayId = formatDisplayId(rawId);
                  const isCopied = copiedId === rawId;
                  const rawStatus = (order.status || "pending").toLowerCase();
                  const isDelivered = rawStatus === "delivered" || rawStatus === "completed";
                  const isShipped = rawStatus === "shipped";

                  return (
                    <tr key={order._id || `order-${index}`} className="hover:bg-[#111214]/60 transition">
                      <td className="p-3.5 pl-4">
                        <button
                          type="button"
                          onClick={() => handleCopyId(rawId)}
                          title={`Copy full ID: ${rawId}`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
                        >
                          <span>{displayId}</span>
                          {isCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                        </button>
                      </td>
                      <td className="p-3.5 font-semibold text-white">
                        {order.customerName || "Customer"}
                      </td>
                      <td className="p-3.5 text-[#A1A1AA]">
                        {order.items?.[0]?.product?.name || "Assorted Items"}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isDelivered
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isShipped
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDelivered
                                ? "bg-emerald-400"
                                : isShipped
                                  ? "bg-blue-400"
                                  : "bg-amber-400 animate-pulse"
                            }`}
                          />
                          <span className="capitalize">{rawStatus}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right font-extrabold text-white font-display">
                        ₹{Number(order.totalPrice || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-10 text-center text-[#A1A1AA] space-y-2 mt-4">
                <Package size={24} className="mx-auto text-[#A1A1AA]/40" />
                <p className="text-sm font-bold text-white">No orders found</p>
                <p className="text-xs text-[#A1A1AA]">Try adjusting your search criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
