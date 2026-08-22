"use client";

import DashboardCard from "@/components/owner/DashboardCard";
// DeliveryMap removed per owner's request
import { Currency, ShoppingCart, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

export default function OwnerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      setError(null);

      try {
        const products = await fetchOwnerProducts();
        const businessOrders = await fetchOwnerOrders();
        const inventoryData = await fetchOwnerInventory();
        const analyticsData = await fetchAnalytics();
        // Fetch active deliveries (non-terminal) and completed/delivered deliveries
        const activeDeliveries = await fetchOwnerDeliveries({ owner: true });
        const completedList = await fetchOwnerDeliveries({
          owner: true,
          status: "completed",
        });
        const deliveredList = await fetchOwnerDeliveries({
          owner: true,
          status: "delivered",
        });

        // Merge lists and dedupe by id
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

    loadAll();
  }, []);

  // Safe derived stats
  const totalProducts = products.length;
  // Always derive total orders directly from the orders array
  const totalOrders = orders.length;
  // Total revenue for owner dashboard: use sum of actual order totals (realised revenue)
  const revenue =
    orders && orders.length > 0
      ? orders.reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0)
      : (analytics?.totalRevenue ?? 0);
  const lowStockCount =
    analytics?.lowStockCount ??
    inventory.filter((p) => p.stock <= p.minStock).length;
  const activeDeliveries = deliveries.length;
  const deliveredOrders = orders.filter((o) =>
    ["completed", "delivered"].includes(
      ((o.status ?? "") as string).toLowerCase(),
    ),
  ).length;

  // Recent orders: take first 4 (backend should ideally return newest first)
  const recentOrders = useMemo(() => orders.slice(0, 4), [orders]);

  // Top products by stock (descending)
  const topProducts = useMemo(
    () =>
      [...products].sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0)).slice(0, 5),
    [products],
  );

  // Low stock items (stock < minStock) from inventory endpoint
  const lowStockItems = useMemo(
    () => inventory.filter((p) => p.stock < p.minStock),
    [inventory],
  );

  // Agents derived from backend delivery agent list plus any delivery-assigned agents
  const uniqueAgents = useMemo(() => {
    const map = new Map<string, any>();
    // start with explicit delivery agents
    deliveryAgents.forEach((agent) => {
      if (agent && agent._id) map.set(String(agent._id), agent);
    });

    // include agents referenced on deliveries (raw.assignedAgent or agent)
    deliveries.forEach((d) => {
      const a = d.agent || d.raw?.assignedAgent;
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

  // Helper to extract assigned agent id from a delivery record
  const getAssignedAgentId = (d: any) => {
    if (!d) return null;
    if (d.agent && (d.agent._id || d.agent.id))
      return String(d.agent._id || d.agent.id);
    const a = d.raw?.assignedAgent;
    if (!a) return null;
    if (typeof a === "string") return String(a);
    return String(a._id || a.id || a);
  };

  // For UI parity: create delivery-related quick access values (keeps layout unchanged)
  const driversOnline = uniqueAgents.length;

  return (
    <div className="p-8 space-y-8">
      <section className="space-y-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Dashboard Overview
            </h1>
            <p className="text-neutral-400 mt-2 max-w-2xl">
              Track shipments, monitor driver performance, and keep your
              logistics operations running smoothly with actionable insights.
            </p>
          </div>
          {/* Live performance removed per request */}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DashboardCard
            title="Total Revenue"
            value={`₹${Number(revenue).toLocaleString()}`}
            change="+12.5%"
            icon={<Currency size={24} />}
          />

          <DashboardCard
            title="Orders"
            value={String(totalOrders)}
            change="+8.2%"
            icon={<ShoppingCart size={24} />}
          />

          <DashboardCard
            title="Products"
            value={String(totalProducts)}
            change="+4.1%"
            icon={<Package size={24} />}
          />

          {/* On-time Rate removed — showing agent-focused details below */}
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-1">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[#A1A1AA]">
                Fleet & Agents
              </p>
              <h2 className="mt-3 text-3xl font-bold text-white">
                Agents Overview
              </h2>
              <p className="text-[#A1A1AA] mt-2 max-w-2xl">
                Key driver metrics and assignment counts.
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#A1A1AA]">Total agents</p>
              <p className="text-2xl font-bold text-white mt-1">
                {uniqueAgents.length}
              </p>
              <p className="text-sm text-[#A1A1AA]">{driversOnline} online</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {uniqueAgents.length > 0 ? (
              uniqueAgents.map((agent) => {
                // Assigned: deliveries currently assigned to this agent and not completed/failed
                const assignedCount = deliveries.filter((d) => {
                  const id = getAssignedAgentId(d);
                  const status = (d.status || "").toLowerCase();
                  return (
                    id === String(agent._id) &&
                    !["completed", "delivered", "failed"].includes(status)
                  );
                }).length;

                // Completed: deliveries completed/delivered by this agent
                const completedCount = deliveries.filter((d) => {
                  const id = getAssignedAgentId(d);
                  const status = (d.status || "").toLowerCase();
                  return (
                    id === String(agent._id) &&
                    ["completed", "delivered"].includes(status)
                  );
                }).length;
                return (
                  <div
                    key={agent._id}
                    className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{agent.name}</p>
                      <p className="text-sm text-[#A1A1AA] mt-1">
                        {agent.contact || agent.email || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[#A1A1AA]">Assigned</p>
                      <p className="font-bold text-white">{assignedCount}</p>
                      <p className="text-sm text-[#A1A1AA]">Completed</p>
                      <p className="font-bold text-white">{completedCount}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400 text-center py-6">
                No agents found
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Active Fleet and Shipment Pulse removed per request */}

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-lg shadow-black/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Recent Orders</h2>
              <p className="text-[#A1A1AA] mt-2">
                Today’s most important shipments and order status.
              </p>
            </div>
            <a
              href="/owner/orders"
              className="rounded-2xl bg-[#F97316] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#EA580C] shadow-[0_0_15px_rgba(249,115,22,0.3)]"
            >
              View all
            </a>
          </div>

          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex flex-col gap-4 rounded-3xl border border-[#2A2B30] bg-[#111214] p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-white font-semibold">{order.orderId}</p>
                    <p className="text-sm text-[#A1A1AA] mt-1">
                      {order.customerName} ·{" "}
                      {order.items[0]?.product?.name ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                    <span>₹{Number(order.totalPrice).toLocaleString()}</span>
                    <span className="rounded-full bg-[#F97316]/15 px-3 py-1 text-[#FDBA74] border border-[#F97316]/20">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-6">
                No recent orders
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-lg shadow-black/10">
          <h2 className="text-2xl font-bold text-white">Low Stock Alerts</h2>
          <p className="text-[#A1A1AA] mt-2">
            Keep an eye on inventory that needs restocking soon.
          </p>

          <div className="mt-6 space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((p) => (
                <div
                  key={p._id}
                  className="rounded-3xl border border-red-900/50 bg-[#111214] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-white font-semibold">{p.name}</h3>
                      <p className="text-sm text-[#A1A1AA] mt-1">
                        Running low — reorder soon.
                      </p>
                    </div>
                    <span className="rounded-full bg-red-500/15 border border-red-500/20 px-3 py-1 text-sm text-red-300">
                      Critical
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400 text-center py-6">
                No low stock items
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
