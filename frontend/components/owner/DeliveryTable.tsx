"use client";

import { useState } from "react";
import { Copy, Check, PackageCheck } from "lucide-react";
import type { DeliveryItem } from "@/lib/api";

interface DeliveryTableProps {
  deliveries: DeliveryItem[];
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

export default function DeliveryTable({ deliveries }: DeliveryTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
        <div>
          <h2 className="text-lg font-bold text-white font-display">Delivery Dispatches</h2>
          <p className="text-xs text-[#A1A1AA] mt-0.5">Live tracking records and destination logs</p>
        </div>
        <span className="text-xs text-[#A1A1AA] font-mono">
          <span className="text-white font-bold">{deliveries.length}</span> Records
        </span>
      </div>

      <div className="space-y-3">
        {deliveries.length > 0 ? (
          deliveries.map((delivery) => {
            const orderObj = delivery.order ?? {
              orderId: delivery.orderId ?? delivery.id ?? "",
              customerName: delivery.customer ?? "",
            };
            const rawId = String(orderObj.orderId || delivery.id || "");
            const displayId = formatDisplayId(rawId);
            const isCopied = copiedId === rawId;
            const status = (delivery.status || "pending").toLowerCase();
            const isDelivered = status === "delivered" || status === "completed";
            const isInTransit = status === "in_transit" || status === "out for delivery";

            return (
              <div
                key={String(
                  delivery._id ??
                    delivery.id ??
                    orderObj.orderId ??
                    `${Math.random()}`,
                )}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-[#2A2B30]/90 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyId(rawId)}
                      title={`Copy full ID: ${rawId}`}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#1A1B1E] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
                    >
                      <span>{displayId}</span>
                      {isCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                    </button>
                    <span className="text-xs font-bold text-white font-display">
                      {orderObj.customerName || "Customer"}
                    </span>
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      isDelivered
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : isInTransit
                          ? "bg-[#F97316]/10 text-[#FDBA74] border border-[#F97316]/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDelivered
                          ? "bg-emerald-400"
                          : isInTransit
                            ? "bg-[#F97316] animate-pulse"
                            : "bg-amber-400 animate-pulse"
                      }`}
                    />
                    <span className="capitalize">{status}</span>
                  </span>

                  <span className="text-[11px] text-[#A1A1AA] font-mono hidden sm:inline-block">
                    ETA: {delivery.eta || "Standard"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-[#A1A1AA] space-y-2">
            <PackageCheck size={24} className="mx-auto text-[#A1A1AA]/40" />
            <p className="text-sm font-bold text-white">No delivery orders on record</p>
            <p className="text-xs text-[#A1A1AA]">When orders are dispatched, live tracking entries will populate here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
