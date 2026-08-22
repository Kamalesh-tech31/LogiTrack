"use client";

import { useEffect, useState } from "react";

import StatsCard from "@/components/delivery/StatsCard";
import StatusBadge from "@/components/delivery/StatusBadge";
import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import { fetchHistory } from "@/lib/api";

function formatAverageDuration(ms: number) {
  if (!ms || ms <= 0) return "--";
  const totalMinutes = Math.round(ms / 60000);
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<DeliveryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const data = await fetchHistory();

        if (isMounted) {
          setHistory(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load delivery history.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const completedCount = history.filter(
    (item) => item.status === "completed" || item.status === "delivered",
  ).length;
  const returnCount = history.filter(
    (item) => item.status === "returned",
  ).length;

  const averageDeliveryTime = (() => {
    if (history.length === 0) return null;

    const durations = history
      .map((delivery) => {
        const raw = delivery as DeliveryRecord & {
          raw?: {
            assignedAt?: string;
            shippedAt?: string;
            deliveredAt?: string;
            completedAt?: string;
            createdAt?: string;
          };
        };

        const assignedAt = raw.raw?.assignedAt ? new Date(raw.raw.assignedAt).getTime() : null;
        const shippedAt = raw.raw?.shippedAt ? new Date(raw.raw.shippedAt).getTime() : null;
        const deliveredAt = raw.raw?.deliveredAt ? new Date(raw.raw.deliveredAt).getTime() : null;
        const completedAt = raw.raw?.completedAt ? new Date(raw.raw.completedAt).getTime() : null;
        const createdAt = raw.raw?.createdAt ? new Date(raw.raw.createdAt).getTime() : null;

        if (assignedAt && shippedAt && shippedAt > assignedAt) return shippedAt - assignedAt;
        if (shippedAt && deliveredAt && deliveredAt > shippedAt) return deliveredAt - shippedAt;
        if (deliveredAt && completedAt && completedAt > deliveredAt) return completedAt - deliveredAt;
        if (deliveredAt && createdAt && deliveredAt > createdAt) return deliveredAt - createdAt;
        if (completedAt && createdAt && completedAt > createdAt) return completedAt - createdAt;
        return null;
      })
      .filter((value): value is number => typeof value === "number" && value > 0);

    if (durations.length === 0) return null;

    const averageMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    return formatAverageDuration(averageMs);
  })();

  return (
    <div className="p-4 md:p-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">
          Delivery record
        </p>
        <h1 className="text-3xl font-bold text-white mt-2">
          Completed deliveries history
        </h1>
        <p className="text-[#D5D5D5] mt-3 max-w-2xl">
          Review the delivery lifecycle with premium visibility into delivery
          completion, returns, and route outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <StatsCard
          title="Completed"
          value={String(completedCount)}
          description="Successful handoffs"
        />

        <StatsCard
          title="Returned"
          value={String(returnCount)}
          description="Customer or route returns"
        />

        <StatsCard
          title="Average Delivery Time"
          value={averageDeliveryTime ?? "--"}
          description={
            history.length === 0
              ? "No completed deliveries available yet"
              : "Derived from real assigned, shipped, delivered, and completed timestamps"
          }
        />
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] p-6 text-white">
          Loading delivery history from the backend...
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : (
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl mt-8 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-175">
              <thead className="bg-[#111214]">
                <tr>
                  <th className="text-left p-4 text-[#A1A1AA]">Delivery ID</th>
                  <th className="text-left p-4 text-[#A1A1AA]">Customer</th>
                  <th className="text-left p-4 text-[#A1A1AA]">City</th>
                  <th className="text-left p-4 text-[#A1A1AA]">ETA</th>
                  <th className="text-left p-4 text-[#A1A1AA]">Status</th>
                  <th className="text-left p-4 text-[#A1A1AA]">Last sync</th>
                </tr>
              </thead>

              <tbody>
                {history.map((delivery) => (
                  <tr key={delivery.id} className="border-t border-[#2A2B30] hover:bg-[#111214]/60 transition">
                    <td className="p-4 text-white font-medium">{delivery.id}</td>
                    <td className="p-4 text-white">{delivery.customer}</td>
                    <td className="p-4 text-[#A1A1AA]">{delivery.city}</td>
                    <td className="p-4 text-[#A1A1AA]">
                      {delivery.eta || "--"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className="p-4 text-[#A1A1AA]">
                      {delivery.lastUpdated}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
