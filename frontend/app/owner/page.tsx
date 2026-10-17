"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardCard from "@/components/owner/DashboardCard";
import { Coins, ShoppingCart, Package, Users, ArrowRight, Copy, Check, AlertTriangle, UserCheck, ShieldCheck } from "lucide-react";
import {
  fetchOwnerProducts,
  fetchOwnerOrders,
  fetchAnalytics,
  fetchOwnerInventory,
  fetchOwnerDeliveries,
  fetchOwnerDeliveryAgents,
} from "@/lib/api";

interface Product {
  _id: string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  minStock?: number;
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
  status: string;
  createdAt?: string;
}

interface InventoryProduct {
  _id: string;
  name: string;
  category?: string;
  stock: number;
  minStock: number;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  salesGrowthPercent: number;
  lowStockCount: number;
  last30Revenue: number;
  prev30Revenue: number;
}

interface DeliveryAgent {
  _id: string;
  name: string;
  contact: string;
  isAvailable: boolean;
  vehicle?: string;
}

interface Tracking {
  status: string;
  location?: string;
  message?: string;
  timestamp?: string;
}

interface Delivery {
  _id: string;
  order: Order;
  agent?: DeliveryAgent | null;
  status:
    | "pending"
    | "assigned"
    | "in_transit"
    | "delivered"
    | "failed"
    | string;
  tracking: Tracking[];
  estimatedDelivery?: string;
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

export default function OwnerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const products = await fetchOwnerProducts();
        const businessOrders = await fetchOwnerOrders();
        const inventoryData = await fetchOwnerInventory();
        const analyticsData = await fetchAnalytics();
        const activeDeliveries = await fetchOwnerDeliveries({ owner: true });
        const completedList = await fetchOwnerDeliveries({
          owner: true,
          status: "completed",
        });
        const deliveredList = await fetchOwnerDeliveries({
          owner: true,
          status: "delivered",
        });

        const merged = [
          ...(Array.isArray(activeDeliveries) ? activeDeliveries : []),
          ...(Array.isArray(completedList) ? completedList : []),
          ...(Array.isArray(deliveredList) ? deliveredList : []),
        ];
        const map = new Map();
        merged.forEach((m: any) => {
          if (m && m.id) map.set(m.id, m);
        });
        const deliveriesData = Array.from(map.values());
        const deliveryAgentsData = await fetchOwnerDeliveryAgents();

        setProducts(Array.isArray(products) ? products : []);
        setOrders(Array.isArray(businessOrders) ? businessOrders : []);
        setInventory(Array.isArray(inventoryData) ? inventoryData : []);
        setAnalytics(analyticsData ?? null);
        setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
        setDeliveryAgents(
          Array.isArray(deliveryAgentsData) ? deliveryAgentsData : [],
        );
      } catch (err: any) {
        setError(err?.message ?? "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    void loadAll();
  }, []);

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalProducts = products.length;
  const totalOrders = orders.length;
  const revenue =
    orders && orders.length > 0
      ? orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)
      : (analytics?.totalRevenue ?? 0);

  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);
  const lowStockItems = useMemo(
    () => inventory.filter((p) => p.stock <= p.minStock),
    [inventory],
  );

  const uniqueAgents = useMemo(() => {
    const map = new Map<string, any>();
    deliveryAgents.forEach((agent) => {
      if (agent && agent._id) map.set(String(agent._id), agent);
    });

    deliveries.forEach((d) => {
      const a = d.agent || (d as any).raw?.assignedAgent;
      if (!a) return;
      const id = typeof a === "string" ? a : a._id || a.id;
      if (!id) return;
      if (map.has(String(id))) return;
      if (typeof a === "object") {
        map.set(String(id), a);
      } else {
        map.set(String(id), {
          _id: String(id),
          name: String(id),
          contact: null,
          isAvailable: false,
        });
      }
    });

    return Array.from(map.values());
  }, [deliveryAgents, deliveries]);

  const activeAgentsCount = uniqueAgents.filter((a) => a.isAvailable !== false).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Enterprise Operations
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Dashboard Overview
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Monitor revenue, track inventory thresholds, and supervise fleet assignments from a unified control panel.
        </p>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <DashboardCard
          title="Total Revenue"
          value={`₹${Number(revenue).toLocaleString()}`}
          change="+12.5%"
          icon={<Coins size={20} />}
        />

        <DashboardCard
          title="Total Orders"
          value={String(totalOrders)}
          change="+8.2%"
          icon={<ShoppingCart size={20} />}
        />

        <DashboardCard
          title="Active Products"
          value={String(totalProducts)}
          change="+4.1%"
          icon={<Package size={20} />}
        />

        <DashboardCard
          title="Registered Fleet"
          value={String(uniqueAgents.length)}
          change={`${activeAgentsCount} Online`}
          icon={<Users size={20} />}
        />
      </div>

      {/* Primary Row: Recent Orders (2/3) + Low Stock Alerts (1/3) */}
      <section className="grid gap-6 xl:grid-cols-3">
        {/* Recent Orders Table */}
        <div className="xl:col-span-2 rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
              <div>
                <h2 className="text-lg font-bold text-white font-display">Recent Orders</h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  Latest customer dispatches and transaction statuses
                </p>
              </div>
              <Link
                href="/owner/orders"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition group"
              >
                <span>View All Orders</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full min-w-[500px] text-left text-xs">
                <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-3 pl-4">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 pr-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2A2B30]/60">
                  {recentOrders.map((order) => {
                    const rawId = order.orderId || order._id;
                    const displayId = formatDisplayId(rawId);
                    const isCopied = copiedId === rawId;
                    const rawStatus = (order.status || "pending").toLowerCase();
                    const isDelivered = rawStatus === "delivered" || rawStatus === "completed";

                    return (
                      <tr key={order._id} className="hover:bg-[#111214]/60 transition">
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
                        <td className="p-3 font-semibold text-white">
                          {order.customerName || "Customer"}
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
                          ₹{Number(order.totalPrice || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {recentOrders.length === 0 && !loading && (
                <div className="p-8 text-center text-xs text-[#A1A1AA]">
                  No recent orders available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts Card */}
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-400" />
                <h2 className="text-lg font-bold text-white font-display">Stock Warnings</h2>
              </div>
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {lowStockItems.length} SKUs
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.slice(0, 4).map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-red-500/30 bg-red-500/5 p-3.5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[180px]">{item.name}</p>
                      <p className="text-[10px] text-[#A1A1AA] mt-0.5">
                        Stock: <span className="text-red-400 font-bold">{item.stock}</span> / Min: {item.minStock}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono uppercase font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
                      Reorder
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-[#A1A1AA] space-y-1.5">
                  <ShieldCheck size={20} className="mx-auto text-emerald-400" />
                  <p className="text-white font-semibold">Inventory Healthy</p>
                  <p className="text-[11px]">All SKUs are above minimum thresholds.</p>
                </div>
              )}
            </div>
          </div>

          <Link
            href="/owner/inventory"
            className="mt-4 pt-3 border-t border-[#2A2B30]/60 flex items-center justify-between text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition group"
          >
            <span>Manage Inventory</span>
            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Secondary Row: Condensed Fleet Agents Summary */}
      <section className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck size={17} className="text-[#F97316]" />
              <h2 className="text-lg font-bold text-white font-display">Delivery Fleet Summary</h2>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Available drivers and active dispatch readiness
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#A1A1AA] font-mono">
              <span className="text-white font-bold">{uniqueAgents.length}</span> Registered • <span className="text-emerald-400 font-bold">{activeAgentsCount}</span> Available
            </span>
            <Link
              href="/owner/delivery"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#111214] border border-[#2A2B30] text-xs font-semibold text-[#FDBA74] hover:border-[#F97316]/50 transition group"
            >
              <span>View Full Fleet</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Compact 3-Column Agent Chip Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueAgents.slice(0, 6).map((agent) => (
            <div
              key={agent._id}
              className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5 flex items-center justify-between hover:border-[#2A2B30]/90 transition"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] font-bold text-xs">
                  {agent.name ? agent.name[0].toUpperCase() : "A"}
                </div>
                <div>
                  <p className="font-bold text-white text-xs truncate max-w-[130px]">{agent.name}</p>
                  <p className="text-[10px] text-[#A1A1AA] mt-0.5 font-mono">{agent.contact || "Assigned Driver"}</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Ready</span>
              </span>
            </div>
          ))}

          {uniqueAgents.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-[#A1A1AA]">
              No delivery agents registered yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
