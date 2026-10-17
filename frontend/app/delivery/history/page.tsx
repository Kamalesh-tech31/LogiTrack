"use client";

import { useEffect, useState } from "react";
import { History, CheckCircle2, RotateCcw, Clock, Copy, Check } from "lucide-react";

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

function formatDisplayId(rawId: string) {
  if (!rawId) return "#ORD";
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

export default function HistoryPage() {
  const [history, setHistory] = useState<DeliveryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const handleCopyId = (id: string) => {
    if (!id) return;
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
          Fulfillment Archive
        </p>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Delivery History
        </h1>
        <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
          Comprehensive log of completed handoffs, route durations, and fulfillment records.
        </p>
      </div>

      {/* Top Stat Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatsCard
          title="Delivered Handoffs"
          value={String(completedCount)}
          description="Shipments successfully verified and delivered"
          icon={CheckCircle2}
        />

        <StatsCard
          title="Returned Packages"
          value={String(returnCount)}
          description="Parcels returned to depot or re-routed"
          icon={RotateCcw}
        />

        <StatsCard
          title="Average Transit Time"
          value={averageDeliveryTime ?? "--"}
          description={
            history.length === 0
              ? "Awaiting first completed delivery"
              : "Calculated from actual dispatch to delivery timestamps"
          }
          icon={Clock}
        />
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316] mb-3 animate-pulse">
            <History size={20} />
          </div>
          <p className="text-sm font-medium text-white">Loading delivery history...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : history.length === 0 ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
            <History size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No Delivery History Yet</h3>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            Fulfilled shipments and completed handoffs will be permanently logged here.
          </p>
        </div>
      ) : (
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-4 pl-6">Order ID</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Destination</th>
                  <th className="p-4">Transit Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Completion Time</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#2A2B30]/60">
                {history.map((delivery) => {
                  const rawId = delivery.id;
                  const displayId = formatDisplayId(rawId);
                  const isCopied = copiedId === rawId;

                  return (
                    <tr
                      key={delivery.id}
                      className="hover:bg-[#111214]/60 transition-colors"
                    >
                      <td className="p-4 pl-6 font-mono text-white">
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
                      <td className="p-4 font-bold text-white font-display">
                        {delivery.customer}
                      </td>
                      <td className="p-4 text-[#A1A1AA]">
                        {delivery.city || delivery.address || "--"}
                      </td>
                      <td className="p-4 text-[#FDBA74] font-medium">
                        {delivery.eta || "--"}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="p-4 pr-6 text-right text-[#A1A1AA] font-mono">
                        {delivery.lastUpdated || "--"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
