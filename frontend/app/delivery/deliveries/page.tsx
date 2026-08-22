"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Package, Truck, Check, Copy, AlertCircle, ShieldCheck } from "lucide-react";

import type {
  DeliveryRecord,
  DeliveryStatus,
} from "@/components/delivery/deliveryData";
import {
  fetchDeliveries,
  updateDeliveryStatus,
  acceptDelivery,
  saveLocationUpdate,
  resendDeliveryOtp,
} from "@/lib/api";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import StatusBadge from "@/components/delivery/StatusBadge";

const statusOptions: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  Pending: ["Out for Delivery"],
  pending: ["Out for Delivery"],
  Assigned: ["Out for Delivery"],
  assigned: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  "out-for-delivery": ["Delivered"],
  Shipped: ["Delivered"],
  shipped: ["Delivered"],
  Delivered: [],
  delivered: [],
  "Failed Attempt": ["Returned"],
  "failed-attempt": ["Returned"],
  Returned: [],
  returned: [],
};

function toTitleCase(s?: string) {
  if (!s) return "";
  return s
    .split(/[- ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, DeliveryStatus>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDeliveries() {
      try {
        const data = await fetchDeliveries();

        if (isMounted) {
          setDeliveries(data);
          setSelectedStatuses(
            Object.fromEntries(
              data.map((item) => [item.id, item.status]),
            ) as Record<string, DeliveryStatus>,
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load deliveries.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeliveries();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAssignedToCurrentUser = (delivery: DeliveryRecord) => {
    if (typeof window === "undefined") return false;
    const currentUserId = localStorage.getItem("userId");
    const assigned = delivery.raw?.assignedAgent;
    if (!assigned) return false;
    if (typeof assigned === "string") return String(assigned) === currentUserId;
    if (assigned._id) return String(assigned._id) === currentUserId;
    if (assigned.id) return String(assigned.id) === currentUserId;
    return false;
  };

  const activeCount = deliveries.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return !["completed", "delivered", "returned"].includes(s);
  }).length;

  const hasActiveAssignedOrder = deliveries.some((delivery) => {
    const s = String(delivery.status || "").toLowerCase();
    return (
      !["completed", "delivered", "returned"].includes(s) &&
      isAssignedToCurrentUser(delivery)
    );
  });

  const completedCount = deliveries.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  }).length;

  const handleCopyId = (id: string) => {
    if (!id) return;
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAccept = async (id: string) => {
    const item = deliveries.find((d) => d.id === id);
    if (!item) return;
    try {
      const accepted = await acceptDelivery(id);
      setDeliveries((prev) => prev.map((p) => (p.id === id ? accepted : p)));
      toast.success("Delivery accepted. Capturing current location...");

      if (!navigator.geolocation) {
        toast.error(
          "Geolocation is not supported by your browser. Please allow location access.",
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const displayName = `Driver location ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          const formattedAddress = displayName;

          try {
            await saveLocationUpdate({
              deliveryId: accepted.id,
              latitude: lat,
              longitude: lon,
              source: "browser",
              displayName,
              formattedAddress,
              city: "Unknown city",
              state: "Unknown state",
              country: "Unknown country",
              postalCode: "N/A",
              timestamp: new Date().toLocaleString(),
            });
            toast.success(
              "Driver location saved for customer tracking.",
            );
          } catch (updateError) {
            console.error("Unable to save driver location:", updateError);
            toast.error(
              updateError instanceof Error
                ? updateError.message
                : "Unable to save current location.",
            );
          }
        },
        (error) => {
          toast.error(`Unable to capture current location: ${error.message}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to accept delivery.",
      );
    }
  };

  const [completionOtps, setCompletionOtps] = useState<Record<string, string>>(
    {},
  );

  const handleOtpChange = (id: string, otp: string) => {
    const normalized = otp.replace(/\D/g, "").slice(0, 6);
    setCompletionOtps((prev) => ({ ...prev, [id]: normalized }));
  };

  const handleComplete = async (id: string) => {
    const otp = completionOtps[id]?.trim();
    if (!otp || otp.length === 0) {
      toast.error("Please enter the delivery OTP provided by the customer.");
      return;
    }

    try {
      const updated = await updateDeliveryStatus(id, "completed", otp);
      setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedStatuses((prev) => ({
        ...prev,
        [id]: updated.status as DeliveryStatus,
      }));
      toast.success("Delivery marked completed successfully!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to complete delivery.",
      );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Quick Stat Counters */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
            Dispatch Queue
          </p>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Assigned Deliveries
          </h1>
          <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
            Manage your shipment queue, claim available orders, and execute OTP-verified handovers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] px-4 py-2.5 flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-[#F97316] animate-pulse" />
            <span className="text-xs text-[#A1A1AA]">Active:</span>
            <span className="text-sm font-bold text-white">{activeCount}</span>
          </div>

          <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] px-4 py-2.5 flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-xs text-[#A1A1AA]">Delivered:</span>
            <span className="text-sm font-bold text-white">{completedCount}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316] mb-3 animate-pulse">
            <Package size={20} />
          </div>
          <p className="text-sm font-medium text-white">Loading assigned deliveries...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : deliveries.length === 0 ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-white">No Deliveries Available</h3>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            There are currently no active deliveries in your dispatch queue. New assignments will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {deliveries.map((delivery) => {
            const rawId = delivery.orderId || delivery.id;
            const displayId = formatDisplayId(rawId);
            const isCopied = copiedId === rawId;
            const assignedToMe = isAssignedToCurrentUser(delivery);

            return (
              <div
                key={delivery.id}
                className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-sm hover:border-[#F97316]/50 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Customer + Clean ID + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white font-display">
                          {delivery.customer || "Customer"}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopyId(rawId)}
                          title={`Copy full ID: ${rawId}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[10px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
                        >
                          <span>{displayId}</span>
                          {isCopied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                        </button>
                      </div>

                      <p className="text-xs text-[#A1A1AA] mt-1 max-w-md line-clamp-1">
                        {delivery.address}
                      </p>

                      {delivery.raw?.items?.length > 0 && (
                        <p className="text-xs text-[#FDBA74] mt-1 font-medium">
                          Item: {delivery.raw.items[0].product?.name || delivery.raw.items[0].product}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={delivery.status} />
                      <p className="text-[11px] text-[#A1A1AA] mt-1">
                        ETA: <span className="text-[#F4F4F5] font-semibold">{delivery.eta || "--"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Priority & Update Timestamps */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Priority Tier</p>
                      <p className="text-white text-sm font-bold mt-1">{delivery.priority || "Standard"}</p>
                    </div>
                    <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Last Synced</p>
                      <p className="text-white text-sm font-medium mt-1 truncate">{delivery.lastUpdated || "--"}</p>
                    </div>
                  </div>
                </div>

                {/* Status Actions & OTP Handover */}
                <div className="mt-5 pt-4 border-t border-[#2A2B30]/60 space-y-4">
                  {/* Claim Button */}
                  {!delivery.raw?.assignedAgent && (
                    <div>
                      <button
                        onClick={() => void handleAccept(delivery.id)}
                        disabled={hasActiveAssignedOrder}
                        className={`w-full rounded-2xl py-3 px-4 text-xs font-bold text-white transition flex items-center justify-center gap-2 ${
                          hasActiveAssignedOrder
                            ? "bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] cursor-not-allowed"
                            : "bg-[#22C55E] hover:bg-[#16A34A] shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer"
                        }`}
                      >
                        <Truck size={14} />
                        <span>
                          {hasActiveAssignedOrder
                            ? "Complete active shipment to claim next order"
                            : "Claim & Accept Shipment"}
                        </span>
                      </button>
                    </div>
                  )}

                  {/* OTP Handover Module for Assigned Agent */}
                  {delivery.raw?.assignedAgent && assignedToMe && (
                    <div className="rounded-2xl border border-[#F97316]/30 bg-[#111214] p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#FDBA74]">
                        <ShieldCheck size={14} className="text-[#F97316]" />
                        <span>OTP Verification Handover</span>
                      </div>
                      <p className="text-[11px] text-[#A1A1AA]">
                        Enter the 6-digit cryptographic PIN provided by the recipient to finalize handoff.
                      </p>

                      <div className="pt-1">
                        <InputOTP
                          value={completionOtps[delivery.id] || ""}
                          onChange={(val: string) => handleOtpChange(delivery.id, val)}
                          maxLength={6}
                          containerClassName="gap-2 justify-center"
                          className="bg-transparent text-white"
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCompletionOtps((prev) => ({ ...prev, [delivery.id]: "" }))}
                          className="flex-1 py-2 rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#A1A1AA] hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await resendDeliveryOtp(delivery.id);
                              setCompletionOtps((prev) => ({ ...prev, [delivery.id]: "" }));
                              toast.success("OTP resent to customer email.");
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : "Unable to resend OTP.");
                            }
                          }}
                          className="flex-1 py-2 rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#FDBA74] hover:text-white text-xs font-semibold transition cursor-pointer"
                        >
                          Resend OTP
                        </button>
                        {delivery.status !== "completed" && (
                          <button
                            type="button"
                            onClick={() => void handleComplete(delivery.id)}
                            className="flex-1 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold shadow-[0_0_12px_rgba(249,115,22,0.3)] transition cursor-pointer"
                          >
                            Complete Handover
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer sync */}
                  <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-1">
                    <span>Status: <strong className="text-[#F4F4F5]">{toTitleCase(delivery.status)}</strong></span>
                    <span>Synced: {delivery.lastUpdated || "Live"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
