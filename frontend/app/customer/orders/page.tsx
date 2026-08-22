"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOrders } from "@/lib/api";
import {
  Search,
  Eye,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ShoppingBag,
  AlertCircle,
  Ban,
} from "lucide-react";
import { CancelOrderModal } from "@/components/customer/cancel-order-modal";

type CustomerOrder = {
  id: string;
  customer: string;
  product: string;
  status: string;
  amount: number;
  date: string;
  items?: Array<{ product: string; quantity: number; price: number }>;
};

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
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const router = useRouter();

  const normalizeOrder = (order: any, index: number): CustomerOrder => {
    const productName =
      order.items?.[0]?.product?.name ||
      order.items?.[0]?.product ||
      order.items?.[0]?.name ||
      "Assorted Items";
    const rawStatus = String(order.status || "pending").toLowerCase();
    const normalizedStatus =
      rawStatus === "completed" ? "delivered" : rawStatus;
    return {
      id: String(order.id || order._id || order.orderId || `order-${index}`),
      customer: order.customerName || order.customer || "Customer",
      product: productName,
      status: normalizedStatus,
      amount:
        typeof order.amount === "number"
          ? order.amount
          : typeof order.totalPrice === "number"
            ? order.totalPrice
            : 0,
      date:
        order.date ||
        order.createdAt ||
        order.updatedAt ||
        new Date().toISOString(),
      items: order.items,
    };
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const ordersData = await fetchOrders(searchQuery || undefined);
      const normalizedOrders = Array.isArray(ordersData)
        ? ordersData.map(normalizeOrder)
        : [];
      setOrders(normalizedOrders);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void loadOrders();
    }, 200);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOrderCancelled = () => {
    void loadOrders();
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query) ||
      order.status.toLowerCase().includes(query)
    );
  });

  const orderStats = {
    total: orders.length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    pending: orders.filter(
      (o) => o.status === "pending" || o.status === "processing",
    ).length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
          Purchases
        </p>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          My Order History
        </h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Track live dispatch routes, cancel unfulfilled orders, and review past
          deliveries.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm hover:border-[#F97316]/40 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
              Delivered
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-emerald-400">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">
            {orderStats.delivered}
          </p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm hover:border-[#F97316]/40 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
              In Transit
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-blue-400">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">
            {orderStats.shipped}
          </p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm hover:border-[#F97316]/40 transition flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
              Processing
            </p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-amber-400">
              <Clock size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">
            {orderStats.pending}
          </p>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              Orders History
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Detailed breakdown of all items ordered
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by order ID or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#111214] border border-[#2A2B30] rounded-2xl text-xs text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316]/60 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#A1A1AA]">
            Loading orders history...
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
                  <th className="p-3.5">Product</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Amount</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B30]/60">
                {filteredOrders.map((order, index) => {
                  const rawId = order.id;
                  const displayId = formatDisplayId(rawId);
                  const isCopied = copiedId === rawId;
                  const rawStatus = (order.status || "pending").toLowerCase();
                  const isDelivered =
                    rawStatus === "delivered" || rawStatus === "completed";
                  const isShipped = rawStatus === "shipped";
                  const canCancel =
                    rawStatus === "pending" || rawStatus === "processing";

                  return (
                    <tr
                      key={rawId || `order-${index}`}
                      className="hover:bg-[#111214]/60 transition"
                    >
                      <td className="p-3.5 pl-4">
                        <button
                          type="button"
                          onClick={() => handleCopyId(rawId)}
                          title={`Copy full ID: ${rawId}`}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
                        >
                          <span>{displayId}</span>
                          {isCopied ? (
                            <Check size={10} className="text-green-400" />
                          ) : (
                            <Copy size={10} />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5 font-bold text-white font-display">
                        {order.product || "Assorted items"}
                      </td>
                      <td className="p-3.5 text-[#A1A1AA] font-mono">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
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
                      <td className="p-3.5 text-right font-extrabold text-white font-display">
                        ₹{order.amount.toLocaleString()}
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canCancel && (
                            <button
                              type="button"
                              onClick={() => setCancellingOrderId(rawId)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/20 transition cursor-pointer"
                              title="Cancel order and restore stock"
                            >
                              <Ban size={12} />
                              <span>Cancel</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/customer/tracking?orderId=${order.id}`,
                              )
                            }
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#111214] border border-[#2A2B30] text-xs font-semibold text-[#FDBA74] hover:text-[#F97316] hover:border-[#F97316]/50 transition cursor-pointer"
                          >
                            <Eye size={12} />
                            <span>Track</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-10 text-center text-[#A1A1AA] space-y-2 mt-4">
                <ShoppingBag size={24} className="mx-auto text-[#A1A1AA]/40" />
                <p className="text-sm font-bold text-white">No orders found</p>
                <p className="text-xs text-[#A1A1AA]">
                  Try adjusting your search criteria or browse our catalog.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={Boolean(cancellingOrderId)}
        onClose={() => setCancellingOrderId(null)}
        orderId={cancellingOrderId || ""}
        onOrderCancelled={handleOrderCancelled}
      />
    </div>
  );
}
