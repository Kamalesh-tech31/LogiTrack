"use client";

import { useEffect, useState } from "react";
import { Copy, Warehouse, Truck, MapPin, Check } from "lucide-react";
import { trackingSteps } from "@/lib/mock-data";
import { fetchOrders, fetchTrackingByOrderId } from "@/lib/api";
import { cn } from "@/lib/utils";

const stepIcons = {
  "Chennai Warehouse": Warehouse,
  "Out For Delivery": Truck,
  "Expected Delivery": MapPin,
};

const statusColors = {
  completed: "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]",
  "in-progress": "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]",
  pending: "bg-[#111214] border border-[#2A2B30] text-[#A1A1AA]",
};

function formatDisplayId(rawId: string | null) {
  if (!rawId) return "ORD-ACTIVE";
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

export function OrderTracking() {
  const [trackingData, setTrackingData] = useState(trackingSteps);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const orders = await fetchOrders();
        if (Array.isArray(orders) && orders.length > 0) {
          const activeOrder =
            orders.find((o: any) => o.status !== "delivered") || orders[0];
          const id = activeOrder.id || activeOrder._id || activeOrder.orderId;
          setActiveOrderId(id);

          const tracking = await fetchTrackingByOrderId(id);
          if (tracking && tracking.steps) {
            setTrackingData(tracking.steps);
          }
        }
      } catch (error) {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, []);

  const copyOrderId = () => {
    if (activeOrderId) {
      void navigator.clipboard.writeText(activeOrderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayId = formatDisplayId(activeOrderId);

  return (
    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#2A2B30]/60">
        <div>
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
            Live Shipment Tracker
          </p>
          <div className="flex items-center gap-2 mt-1">
            <h2 className="text-lg font-bold text-white font-display">
              Order {displayId}
            </h2>
            <button
              type="button"
              onClick={copyOrderId}
              title={`Copy full ID: ${activeOrderId || ""}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
            >
              <span>{activeOrderId ? `#${activeOrderId.slice(-6)}` : "COPY"}</span>
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative space-y-6">
        {trackingData.map((step, index) => {
          const Icon =
            stepIcons[step.title as keyof typeof stepIcons] || MapPin;
          const isLast = index === trackingData.length - 1;
          const statusKey = step.status as keyof typeof statusColors;

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-2xl transition-all",
                    statusColors[statusKey] || "bg-[#111214] border border-[#2A2B30] text-[#A1A1AA]",
                  )}
                >
                  <Icon size={18} />
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mt-2 h-10 w-0.5",
                      step.status === "completed"
                        ? "bg-emerald-500"
                        : "bg-[#2A2B30]",
                    )}
                  />
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="text-sm font-bold text-white font-display">{step.title}</h3>
                <p className="text-xs text-[#A1A1AA] mt-0.5 leading-relaxed">
                  {step.description}
                </p>
                {step.timestamp && (
                  <p className="mt-1 font-mono text-[11px] text-[#A1A1AA]/70">
                    {step.timestamp}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OrderTracking;
