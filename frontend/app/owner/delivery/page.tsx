"use client";

import { useEffect, useState } from "react";
import DeliveryMap from "@/components/owner/DeliveryMap";
import DeliveryTable from "@/components/owner/DeliveryTable";
import { Truck, Users, PackageCheck, Clock3, AlertCircle } from "lucide-react";
import { fetchOwnerDeliveries, fetchOwnerDeliveryAgents } from "@/lib/api";

interface Tracking {
  status: string;
  location?: string;
  message?: string;
  timestamp: string;
}

interface OrderItem {
  product?: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
  };
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
}

interface DeliveryAgent {
  _id: string;
  name: string;
  contact: string;
  isAvailable: boolean;
  vehicle?: string;
}

interface Delivery {
  _id: string;
  order: Order;
  agent?: DeliveryAgent;
  status: "pending" | "assigned" | "in_transit" | "delivered" | "failed";
  tracking: Tracking[];
  estimatedDelivery?: string;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<DeliveryAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const [activeDeliveries, completedList, deliveredList, agentsData] =
          await Promise.all([
            fetchOwnerDeliveries({ owner: true }),
            fetchOwnerDeliveries({ owner: true, status: "completed" }),
            fetchOwnerDeliveries({ owner: true, status: "delivered" }),
            fetchOwnerDeliveryAgents(),
          ]);

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

        setDeliveries(Array.isArray(deliveriesData) ? deliveriesData : []);
        setDeliveryAgents(Array.isArray(agentsData) ? agentsData : []);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load delivery data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const totalDeliveries = deliveries.length;
  const uniqueAgents = Array.from(
    new Map<string, DeliveryAgent>([
      ...deliveryAgents.map((agent) => [agent._id, agent] as [string, DeliveryAgent]),
      ...deliveries
        .filter((d) => d.agent)
        .map((d) => [d.agent!._id, d.agent!] as [string, DeliveryAgent]),
    ]).values(),
  );

  const activeAgents = uniqueAgents.length;
  const terminalStatuses = [
    "completed",
    "delivered",
    "failed",
    "returned",
    "cancelled",
  ];
  const pendingOrders = deliveries.filter(
    (d) => !terminalStatuses.includes((d.status || "").toLowerCase()),
  ).length;
  const deliveredCount = deliveries.filter((d) =>
    ["completed", "delivered"].includes((d.status || "").toLowerCase()),
  ).length;
  const successRate =
    deliveries.length > 0
      ? Math.round((deliveredCount / deliveries.length) * 100)
      : 100;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Fleet Dispatch
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Delivery Operations
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Supervise field couriers, monitor fulfillment telemetry, and manage optimized route assignments.
        </p>
      </div>

      {loading && (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 text-center text-xs text-[#A1A1AA]">
          Loading delivery telemetry...
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
          <AlertCircle size={24} className="mx-auto text-red-400" />
          <p className="text-sm font-bold text-white">Error loading deliveries</p>
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}

      {/* 4 Metric Tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Total Deliveries</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316]">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{totalDeliveries}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Fleet Size</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#FDBA74]">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{activeAgents}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Active Shipments</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-amber-400">
              <Clock3 size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{pendingOrders}</p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Success Rate</p>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-emerald-400">
              <PackageCheck size={16} />
            </div>
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display">{successRate}%</p>
        </div>
      </div>

      {/* Redesigned Route Optimization Radar */}
      <DeliveryMap agents={uniqueAgents} deliveries={deliveries} />

      {/* Delivery Agents Compact Summary */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Field Agents</h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">Active courier assignment statuses</p>
          </div>
          <span className="text-xs text-[#A1A1AA] font-mono">
            <span className="text-white font-bold">{uniqueAgents.length}</span> Drivers Registered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uniqueAgents.map((agent) => {
            const agentDeliveries = deliveries.filter((d) => {
              const id =
                d.agent && (d.agent._id || (d.agent as any).id)
                  ? String(d.agent._id || (d.agent as any).id)
                  : null;
              return id === String(agent._id);
            }).length;

            return (
              <div
                key={agent._id}
                className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between hover:border-[#2A2B30]/90 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] font-bold text-sm">
                    {agent.name ? agent.name[0].toUpperCase() : "A"}
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs truncate max-w-[130px]">{agent.name}</p>
                    <p className="text-[10px] text-[#A1A1AA] mt-0.5 font-mono">{agent.contact || "Courier"}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>Available</span>
                  </span>
                  <p className="text-[9px] text-[#A1A1AA] mt-1 font-mono">{agentDeliveries} Today</p>
                </div>
              </div>
            );
          })}

          {uniqueAgents.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-[#A1A1AA]">
              No delivery agents found.
            </div>
          )}
        </div>
      </div>

      {/* Delivery Records Table */}
      <DeliveryTable deliveries={deliveries} />
    </div>
  );
}
