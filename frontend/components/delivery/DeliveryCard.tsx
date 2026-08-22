"use client";

import { useState } from "react";
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
  sequenceOrder?: number | null;
  batchId?: string | null;
  onClaim?: (id: string) => Promise<void>;
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
  sequenceOrder,
  batchId,
  onClaim,
  onRequestOtp,
  onVerifyOtp,
  onStatusUpdate,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpRequested, setOtpRequested] = useState(hasActiveOtp);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const displayId = formatDisplayId(orderId || id);

  const normalizedStatus = (status || "").toLowerCase();
  const isDelivered =
    normalizedStatus === "delivered" || normalizedStatus === "completed";

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
      setActionSuccess("Order claimed! Moved to My Deliveries.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to claim delivery.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRequestOtpClick = async () => {
    if (!onRequestOtp) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onRequestOtp(id);
      setOtpRequested(true);
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
              {isDelivered ? "Delivery Completed" : isMyDelivery ? "Active Delivery Route" : "Available in Network"}
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

        {/* Address Telemetry */}
        <div className="mt-4 pt-3.5 border-t border-[#2A2B30]/60 space-y-2.5 text-xs text-[#A1A1AA]">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-[#F97316] shrink-0 mt-0.5" />
            <span className="text-[#F4F4F5] font-medium leading-relaxed">
              {address || "Address not provided"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Truck size={14} />
              <span>Telemetry Linked</span>
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

        {/* Doorstep OTP Handover (My Deliveries Tab) */}
        {isMyDelivery && !isDelivered && (
          <div className="mt-4 rounded-2xl border border-[#F97316]/40 bg-[#F97316]/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <ShieldCheck size={14} className="text-[#F97316]" />
                <span>Doorstep OTP Verification</span>
              </div>
              <button
                type="button"
                onClick={handleRequestOtpClick}
                disabled={loadingAction}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FDBA74] hover:text-[#F97316] transition cursor-pointer"
              >
                <Send size={10} />
                <span>{otpRequested ? "Resend OTP" : "Request OTP"}</span>
              </button>
            </div>

            <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
              Ask customer for their 6-digit delivery passcode to confirm handoff.
            </p>

            <form onSubmit={handleCompleteDeliveryClick} className="flex gap-2">
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
                {loadingAction ? "Verifying..." : "Confirm & Deliver"}
              </button>
            </form>
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
            <span>Claim Delivery</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default DeliveryCard;
