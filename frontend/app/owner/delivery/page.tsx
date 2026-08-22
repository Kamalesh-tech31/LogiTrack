"use client";

import { useEffect, useState } from "react";
import DeliveryMap from "@/components/owner/DeliveryMap";
import AgentCard from "@/components/owner/AgentCard";
import DeliveryTable from "@/components/owner/DeliveryTable";
import { Truck, User, PackageCheck, Clock3 } from "lucide-react";
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

interface ApiResponse {
  success: boolean;
  count: number;
  data: Delivery[];
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
        // Fetch active, completed and delivered deliveries for owner
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

  // Calculate stats
  const totalDeliveries = deliveries.length;

  const uniqueAgents = Array.from(
    new Map<string, DeliveryAgent>([
      ...deliveryAgents.map(
        (agent) => [agent._id, agent] as [string, DeliveryAgent],
      ),
      ...deliveries
        .filter((d) => d.agent)
        .map((d) => [d.agent!._id, d.agent!] as [string, DeliveryAgent]),
    ]).values(),
  );
  // Active agents: number of known agents
  const activeAgents = uniqueAgents.length;

  // Pending orders: any non-terminal status
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

  // Delivered includes 'completed' and 'delivered'
  const deliveredCount = deliveries.filter((d) =>
    ["completed", "delivered"].includes((d.status || "").toLowerCase()),
  ).length;
  const successRate =
    deliveries.length > 0
      ? Math.round((deliveredCount / deliveries.length) * 100)
      : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-5xl font-bold text-white">Delivery Management</h1>
        <p className="text-gray-400 mt-3 text-lg">
          Track agents, deliveries, and optimized routes
        </p>
      </div>

      {loading && <p className="text-gray-400">Loading deliveries...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Total Deliveries</p>
              <h2 className="text-5xl font-bold mt-4 text-white">
                {totalDeliveries}
              </h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
              <Truck className="text-[#F97316]" size={30} />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Active Agents</p>
              <h2 className="text-5xl font-bold mt-4 text-white">
                {activeAgents}
              </h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
              <User className="text-[#F97316]" size={30} />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Pending Orders</p>
              <h2 className="text-5xl font-bold mt-4 text-white">
                {pendingOrders}
              </h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
              <Clock3 className="text-[#F97316]" size={30} />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Success Rate</p>
              <h2 className="text-5xl font-bold mt-4 text-white">
                {successRate}%
              </h2>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
              <PackageCheck className="text-[#F97316]" size={30} />
            </div>
          </div>
        </div>
      </div>

      <DeliveryMap agents={uniqueAgents} />

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">Delivery Agents</h2>
            <p className="text-gray-400 mt-2">Monitor active field agents</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {uniqueAgents.length > 0 ? (
            uniqueAgents.map((agent) => {
              const agentDeliveries = deliveries.filter((d) => {
                const id =
                  d.agent && (d.agent._id || d.agent.id)
                    ? String(d.agent._id || d.agent.id)
                    : null;
                return id === String(agent._id);
              }).length;
              const agentStatus = agent.isAvailable ? "Available" : "Active";

              return (
                <AgentCard
                  key={agent._id}
                  name={agent.name}
                  deliveries={agentDeliveries}
                  status={agentStatus}
                />
              );
            })
          ) : (
            <div className="col-span-full rounded-3xl border border-[#1F1F1F] p-8 text-gray-400">
              No delivery agents found. Register delivery users to see them
              here.
            </div>
          )}
        </div>
      </div>

      <DeliveryTable deliveries={deliveries} />
    </div>
  );
}
