"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  Truck,
  Copy,
  Check,
  KeyRound,
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Store,
  Navigation,
} from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Props {
  id: string;
  orderId?: string;
  customer: string;
  address: string;
  eta: string;
  status: string;
  priority: string;
  contact?: string;
  location?: string;
  lastUpdated?: string;
  customerVerified?: boolean;
  hasActiveOtp?: boolean;
  isClaimable?: boolean;
  isMyDelivery?: boolean;
  deliveryStage?: string;
  pickupName?: string | null;
  pickupAddress?: any;
  sequenceOrder?: number | null;
  batchId?: string | null;
  onClaim?: (id: string) => Promise<void>;
  onReachedWarehouse?: (id: string) => Promise<void>;
  onReachedCustomer?: (id: string) => Promise<void>;
  onRequestOtp?: (id: string) => Promise<void>;
  onVerifyOtp?: (id: string, otp: string) => Promise<void>;
  onStatusUpdate?: (id: string, status: string, otp?: string) => Promise<void>;
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

const DeliveryCard = ({
  id,
  orderId,
  customer,
  address,
  eta,
  status,
  priority,
  lastUpdated,
  customerVerified = false,
  hasActiveOtp = false,
  isClaimable = false,
  isMyDelivery = false,
  deliveryStage = "UNCLAIMED",
  pickupName,
  pickupAddress,
  sequenceOrder,
  batchId,
  onClaim,
  onReachedWarehouse,
  onReachedCustomer,
  onRequestOtp,
  onVerifyOtp,
  onStatusUpdate,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const displayId = formatDisplayId(orderId || id);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const normalizedStatus = (status || "").toLowerCase();
  const isDelivered =
    normalizedStatus === "delivered" ||
    normalizedStatus === "completed" ||
    deliveryStage === "DELIVERED";

  const handleCopyId = () => {
    const fullId = orderId || id;
    if (!fullId) return;
    void navigator.clipboard.writeText(fullId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimClick = async () => {
    if (!onClaim) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onClaim(id);
      setActionSuccess("Order claimed! Head to merchant warehouse for pickup.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to claim order.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReachedWarehouseClick = async () => {
    if (!onReachedWarehouse) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onReachedWarehouse(id);
      setActionSuccess("Reached warehouse! Package picked up. Navigate to customer.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to update pickup status.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReachedCustomerClick = async () => {
    if (!onReachedCustomer) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onReachedCustomer(id);
      setActionSuccess("Arrived at customer location! You can now request the OTP.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to update arrival status.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRequestOtpClick = async () => {
    if (!onRequestOtp || loadingAction || resendCooldown > 0) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onRequestOtp(id);
      setResendCooldown(30);
      setActionSuccess("Passcode dispatched to customer email!");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || "Failed to generate passcode.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCompleteDeliveryClick = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otpInput.trim()) {
      setActionError("Please enter the 6-digit OTP provided by the customer.");
      return;
    }
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      if (onStatusUpdate) {
        await onStatusUpdate(id, "delivered", otpInput.trim());
      } else if (onVerifyOtp) {
        await onVerifyOtp(id, otpInput.trim());
      }
      setActionSuccess("Delivery verified & completed successfully!");
      setOtpInput("");
    } catch (err: any) {
      setActionError(err?.message || "Invalid OTP. Please check with customer.");
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-5 hover:border-[#F97316]/50 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Header: Customer Name, ID & Status Badge */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-display">
                {customer || "Valued Customer"}
              </h3>
              {sequenceOrder && (
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold">
                  Stop #{sequenceOrder}
                </span>
              )}
              <button
                type="button"
                onClick={handleCopyId}
                title={`Copy full ID: ${orderId || id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
              >
                <span>{displayId}</span>
                {copied ? (
                  <Check size={11} className="text-green-400" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>

            <p className="text-[11px] text-[#A1A1AA] mt-1">
              {isDelivered
                ? "Delivery Completed"
                : isMyDelivery
                  ? "Active Live Tracking"
                  : "Available in Fleet Pool"}
            </p>
          </div>

          <StatusBadge status={status} />
        </div>

        {/* 3-Tier Meta Chips */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
              Priority Tier
            </p>
            <p className="text-white text-sm font-bold mt-1">
              {priority || "Standard"}
            </p>
          </div>

          <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
              Estimated Arrival
            </p>
            <p className="text-[#FDBA74] text-sm font-bold mt-1">
              {eta || "In Transit"}
            </p>
          </div>
        </div>

        {/* Warehouse Pickup Info (if present) */}
        {(pickupName || pickupAddress?.fullAddress) && (
          <div className="mt-3 p-3 rounded-2xl border border-sky-500/20 bg-sky-500/5 text-xs text-[#A1A1AA] flex items-start gap-2">
            <Store size={14} className="text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold">
                Pickup: {pickupName || "Merchant Warehouse"}
              </p>
              <p className="text-[11px] text-[#A1A1AA] mt-0.5 truncate">
                {pickupAddress?.fullAddress || "Verified Merchant Location"}
              </p>
            </div>
          </div>
        )}

        {/* Customer Address Telemetry */}
        <div className="mt-3 pt-3 border-t border-[#2A2B30]/60 space-y-2 text-xs text-[#A1A1AA]">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-[#F97316] shrink-0 mt-0.5" />
            <span className="text-[#F4F4F5] font-medium leading-relaxed">
              Drop-off: {address || "Address not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Truck size={14} />
              <span>Live GPS Active</span>
            </span>
            {lastUpdated && (
              <span className="font-mono text-[11px]">Sync: {lastUpdated}</span>
            )}
          </div>
        </div>

        {/* Inline Feedback Alerts */}
        {actionError && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
            <AlertCircle size={14} className="shrink-0 text-red-400" />
            <span>{actionError}</span>
          </div>
        )}

        {actionSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xs text-emerald-300">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Dynamic Delivery Stage Progression Controls (My Deliveries) */}
        {isMyDelivery && !isDelivered && (
          <div className="mt-4 rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 space-y-3">
            {/* Stage 1: En route to Pickup Warehouse */}
            {deliveryStage === "TO_WAREHOUSE" && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#FDBA74]">
                  <Store size={15} className="text-[#F97316]" />
                  <span>Stage 1: En Route to Pickup Warehouse</span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Drive to the merchant warehouse to collect the order items. Confirm upon arrival.
                </p>
                <button
                  type="button"
                  onClick={handleReachedWarehouseClick}
                  disabled={loadingAction}
                  className="w-full py-2 px-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <Check size={14} />
                  <span>{loadingAction ? "Updating..." : "Reached Pickup / Warehouse"}</span>
                </button>
              </div>
            )}

            {/* Stage 2: Heading to Customer */}
            {(deliveryStage === "TO_CUSTOMER" ||
              deliveryStage === "AT_WAREHOUSE") && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Navigation size={15} className="text-emerald-400" />
                  <span>Stage 2: En Route to Customer Location</span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Items collected from warehouse. Travel to the customer drop-off address.
                </p>
                <button
                  type="button"
                  onClick={handleReachedCustomerClick}
                  disabled={loadingAction}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(16,185,129,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <MapPin size={14} />
                  <span>{loadingAction ? "Updating..." : "Reached Customer Location"}</span>
                </button>
              </div>
            )}

            {/* Stage 3: Arrived at Customer Location (Ready to request OTP) */}
            {deliveryStage === "AT_CUSTOMER" && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-400">
                  <MapPin size={15} className="text-purple-400" />
                  <span>Stage 3: Arrived at Destination</span>
                </div>
                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  You have arrived at the customer doorstep. Request a single-use verification OTP to be sent to the customer email.
                </p>
                <button
                  type="button"
                  onClick={handleRequestOtpClick}
                  disabled={loadingAction}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(147,51,234,0.3)] cursor-pointer disabled:opacity-50"
                >
                  <KeyRound size={14} />
                  <span>{loadingAction ? "Generating..." : "Request Delivery OTP"}</span>
                </button>
              </div>
            )}

            {/* Stage 4: OTP Requested (Awaiting Verification) */}
            {deliveryStage === "OTP_REQUESTED" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <ShieldCheck size={14} className="text-[#F97316]" />
                    <span>Doorstep OTP Verification</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestOtpClick}
                    disabled={loadingAction || resendCooldown > 0}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FDBA74] hover:text-[#F97316] transition cursor-pointer disabled:opacity-50"
                  >
                    <Send size={10} />
                    <span>
                      {resendCooldown > 0
                        ? `Resend OTP (${resendCooldown}s)`
                        : loadingAction
                          ? "Sending..."
                          : "Resend OTP"}
                    </span>
                  </button>
                </div>

                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  Enter the 6-digit passcode provided by the customer to confirm handoff.
                </p>

                <form
                  onSubmit={handleCompleteDeliveryClick}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit PIN"
                    value={otpInput}
                    onChange={(e) =>
                      setOtpInput(e.target.value.replace(/\D/g, ""))
                    }
                    className="flex-1 px-3 py-2 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs font-mono text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition tracking-widest text-center"
                  />
                  <button
                    type="submit"
                    disabled={loadingAction || otpInput.length < 6}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  >
                    {loadingAction ? "Verifying..." : "Verify & Complete"}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Triggers Bar (Available to Claim Tab) */}
      {isClaimable && (
        <div className="pt-3 border-t border-[#2A2B30]/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClaimClick}
            disabled={loadingAction}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>Claim Order (GPS Required)</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;
