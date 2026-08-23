"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Clock, CheckCircle2, Copy, Check, Package, ArrowRight } from "lucide-react";
import { fetchOrders, fetchProducts, fetchCurrentUser } from "@/lib/api";
import { HomeAddressPrompt } from "@/components/customer/home-address-prompt";

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

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, productsData, userData] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
          fetchCurrentUser().catch(() => null),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setUser(userData);
      } catch {
        setOrders([]);
        setProducts([]);
      } finally {
        setLoadingOrders(false);
        setLoadingProducts(false);
      }
    };

    void fetchData();
  }, []);

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const stats = useMemo(() => {
    const totalOrders = safeOrders.length;
    const deliveredOrders = safeOrders.filter(
      (order) => (order.status ?? "").toLowerCase() === "delivered" || (order.status ?? "").toLowerCase() === "completed",
    ).length;
    const pendingOrders = safeOrders.filter(
      (order) => (order.status ?? "").toLowerCase() !== "delivered" && (order.status ?? "").toLowerCase() !== "completed",
    ).length;

    return [
      {
        label: "Total Orders",
        value: totalOrders,
        icon: ShoppingCart,
        description: "All orders placed from your account",
        accent: "text-[#F97316]",
      },
      {
        label: "In Progress",
        value: pendingOrders,
        icon: Clock,
        description: "Orders currently being prepared or in transit",
        accent: "text-amber-400",
      },
      {
        label: "Delivered",
        value: deliveredOrders,
        icon: CheckCircle2,
        description: "Successfully completed deliveries",
        accent: "text-emerald-400",
      },
    ];
  }, [safeOrders]);

  const featuredProducts = useMemo(() => {
    return [...safeProducts]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.updatedAt || a.date || 0).getTime();
        const bDate = new Date(b.createdAt || b.updatedAt || b.date || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 4);
  }, [safeProducts]);

  const recentOrders = useMemo(() => {
    return [...safeOrders]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.updatedAt || a.date || 0).getTime();
        const bDate = new Date(a.createdAt || a.updatedAt || a.date || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [safeOrders]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Customer-Friendly Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Account Overview
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Customer Dashboard
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Browse new products, check recent orders, and track your deliveries in real time.
        </p>
      </div>

      {/* Optional Home Address Suggestion (Non-blocking) */}
      {user && (
        <HomeAddressPrompt
          user={user}
          onAddressSaved={(addr) => setUser((prev: any) => ({ ...prev, defaultAddress: addr }))}
        />
      )}

      {/* 3-Tier Metric Overview Cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm hover:border-[#F97316]/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
                    {stat.label}
                  </p>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl border border-[#2A2B30] bg-[#111214] ${stat.accent}`}>
                    <Icon size={18} />
                  </div>
                </div>

                <p className="mt-2 text-3xl font-extrabold text-white font-display tracking-tight">
                  {loadingOrders ? "..." : stat.value}
                </p>
              </div>

              <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
                {stat.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Featured Products Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              Featured Products
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Popular items available for immediate dispatch
            </p>
          </div>
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition group"
          >
            <span>Browse Catalog</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <div
              key={product.id || product._id || product.name}
              className="group rounded-3xl overflow-hidden border border-[#2A2B30] bg-[#1A1B1E] shadow-sm hover:border-[#F97316]/60 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-square overflow-hidden bg-[#111214]">
                  <Image
                    src={
                      product.image ||
                      (Array.isArray(product.images) && product.images[0]) ||
                      "/placeholder.png"
                    }
                    alt={product.name || "Product image"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="rounded-full bg-[#111214]/80 backdrop-blur-md border border-[#2A2B30] px-2.5 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
                      {product.category || "General"}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-bold text-white text-sm font-display truncate">
                    {product.name || "Untitled Product"}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">In stock & ready to ship</p>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between border-t border-[#2A2B30]/50 mt-2 pt-3">
                <span className="text-base font-extrabold text-white font-display">
                  ₹{Number(product.price ?? 0).toLocaleString()}
                </span>
                <span className="rounded-full bg-[#F97316]/10 border border-[#F97316]/30 px-2.5 py-0.5 text-[10px] font-semibold text-[#FDBA74]">
                  Popular
                </span>
              </div>
            </div>
          ))}

          {featuredProducts.length === 0 && !loadingProducts && (
            <div className="col-span-full rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 text-center text-[#A1A1AA] space-y-2">
              <Package size={24} className="mx-auto text-[#A1A1AA]/50" />
              <p className="text-sm font-medium text-white">No products available right now</p>
              <p className="text-xs text-[#A1A1AA]">Check back soon for new arrivals.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Orders Section */}
      <section className="space-y-4">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                Recent Orders
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Your latest order history and fulfillment statuses
              </p>
            </div>
            <Link
              href="/customer/orders"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition group"
            >
              <span>View All Orders</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full min-w-[550px] text-left text-xs">
              <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3 pl-4">Order ID</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 pr-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B30]/60">
                {recentOrders.map((order, index) => {
                  const rawId = order.orderId || order._id || order.id;
                  const displayId = formatDisplayId(rawId);
                  const isCopied = copiedId === rawId;
                  const amountValue =
                    typeof order.amount === "number"
                      ? order.amount
                      : typeof order.totalPrice === "number"
                        ? order.totalPrice
                        : undefined;
                  const rawStatus = (order.status || "pending").toLowerCase();
                  const isDelivered = rawStatus === "delivered" || rawStatus === "completed";

                  return (
                    <tr key={rawId || String(index)} className="hover:bg-[#111214]/60 transition">
                      <td className="p-3 pl-4">
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
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            isDelivered
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isDelivered ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                          <span className="capitalize">{rawStatus}</span>
                        </span>
                      </td>
                      <td className="p-3 pr-4 text-right font-extrabold text-white font-display">
                        {amountValue != null ? `₹${amountValue.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {recentOrders.length === 0 && !loadingOrders && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-8 text-center text-[#A1A1AA] space-y-2 mt-4">
                <ShoppingCart size={24} className="mx-auto text-[#A1A1AA]/50" />
                <p className="text-sm font-medium text-white">No recent orders</p>
                <p className="text-xs text-[#A1A1AA]">When you place an order, it will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
