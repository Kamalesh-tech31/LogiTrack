"use client";

import { useState } from "react";
import {
  Clock3,
  MapPin,
  Phone,
  Truck,
  Copy,
  Check,
  Lock,
  Unlock,
  KeyRound,
  Send,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
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
  contact: string;
  location: string;
  lastUpdated: string;
  customerVerified?: boolean;
  hasActiveOtp?: boolean;
  isClaimable?: boolean;
  isMyDelivery?: boolean;
  onClaim?: (id: string) => Promise<void>;
  onAccept?: (id: string) => Promise<void>;
  onRequestOtp?: (id: string) => Promise<void>;
  onVerifyOtp?: (id: string, otp: string) => Promise<void>;
  onStatusUpdate?: (id: string, status: string) => Promise<void>;
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
  contact,
  location,
  lastUpdated,
  customerVerified = false,
  hasActiveOtp = false,
  isClaimable = false,
  isMyDelivery = false,
  onClaim,
  onAccept,
  onRequestOtp,
  onVerifyOtp,
  onStatusUpdate,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const displayId = formatDisplayId(orderId || id);

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
      setActionSuccess("Order claimed! Verification OTP dispatched.");
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
      setActionSuccess("New OTP sent to customer email.");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || "Failed to generate OTP.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleVerifyOtpClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onVerifyOtp || !otpInput.trim()) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onVerifyOtp(id, otpInput.trim());
      setActionSuccess("Customer verified successfully!");
      setOtpInput("");
    } catch (err: any) {
      setActionError(err?.message || "Invalid verification OTP.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAcceptClick = async () => {
    if (!onAccept) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await onAccept(id);
    } catch (err: any) {
      setActionError(err?.message || "Failed to accept order.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleStatusClick = async (newStatus: string) => {
    if (!onStatusUpdate) return;
    setLoadingAction(true);
    setActionError(null);
    try {
      await onStatusUpdate(id, newStatus);
    } catch (err: any) {
      setActionError(err?.message || "Failed to update status.");
    } finally {
      setLoadingAction(false);
    }
  };

  const normalizedStatus = (status || "").toLowerCase();
  const isAssigned = normalizedStatus === "assigned";
  const isShipped = normalizedStatus === "shipped";
  const isOutForDelivery = normalizedStatus === "out-for-delivery";
  const isDelivered = normalizedStatus === "delivered" || normalizedStatus === "completed";

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
              <button
                type="button"
                onClick={handleCopyId}
                title={`Copy full ID: ${orderId || id}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
              >
                <span>{displayId}</span>
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              {!customerVerified && !isDelivered ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  <span>Masked Data (OTP Pending)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  <Unlock size={10} />
                  <span>Customer Verified</span>
                </span>
              )}
            </div>
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

        {/* Address & Contact Telemetry List */}
        <div className="mt-4 pt-3.5 border-t border-[#2A2B30]/60 space-y-2.5 text-xs text-[#A1A1AA]">
          <div className="flex items-start gap-2">
            <MapPin size={14} className="text-[#F97316] shrink-0 mt-0.5" />
            <span className="text-[#F4F4F5] font-medium leading-relaxed">{address}</span>
          </div>

          {contact && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-[#F97316] shrink-0" />
              <span className="text-[#F4F4F5] font-mono font-medium">{contact}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <Truck size={14} />
              <span>Telemetry Linked</span>
            </span>
            {lastUpdated && <span className="font-mono text-[11px]">Sync: {lastUpdated}</span>}
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

        {/* Stage 2 OTP Verification Sub-Card (When Claimed but not yet Verified) */}
        {isMyDelivery && isAssigned && !customerVerified && (
          <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <KeyRound size={13} className="text-[#F97316]" />
                <span>Customer Delivery OTP</span>
              </div>
              <button
                type="button"
                onClick={handleRequestOtpClick}
                disabled={loadingAction}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#FDBA74] hover:text-[#F97316] transition cursor-pointer"
              >
                <Send size={10} />
                <span>Resend OTP</span>
              </button>
            </div>

            <form onSubmit={handleVerifyOtpClick} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                placeholder="6-digit code"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                className="flex-1 px-3 py-1.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs font-mono text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition tracking-widest text-center"
              />
              <button
                type="submit"
                disabled={loadingAction || otpInput.length < 6}
                className="px-4 py-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.25)]"
              >
                {loadingAction ? "..." : "Verify"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Action Triggers Bar */}
      <div className="pt-3 border-t border-[#2A2B30]/60 flex items-center justify-between gap-3">
        {/* Stage 1: Claim Action */}
        {isClaimable && (
          <button
            type="button"
            onClick={handleClaimClick}
            disabled={loadingAction}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <span>Claim Delivery</span>
            <ChevronRight size={14} />
          </button>
        )}

        {/* Stage 2 & 3: My Deliveries Workflow */}
        {isMyDelivery && isAssigned && (
          <div className="w-full flex items-center gap-2">
            <button
              type="button"
              onClick={handleAcceptClick}
              disabled={!customerVerified || loadingAction}
              className={`flex-1 py-2 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                customerVerified
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_12px_rgba(52,211,153,0.3)]"
                  : "bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] cursor-not-allowed opacity-60"
              }`}
            >
              <span>{customerVerified ? "Accept & Start Dispatch" : "Accept (Verify OTP First)"}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Stage 4: In Transit / Active Route Actions */}
        {isMyDelivery && isShipped && (
          <div className="w-full flex gap-2">
            <button
              type="button"
              onClick={() => handleStatusClick("out-for-delivery")}
              disabled={loadingAction}
              className="flex-1 py-2 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition cursor-pointer"
            >
              Out for Delivery
            </button>
            <button
              type="button"
              onClick={() => handleStatusClick("delivered")}
              disabled={loadingAction}
              className="flex-1 py-2 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition cursor-pointer"
            >
              Mark Delivered
            </button>
          </div>
        )}

        {isMyDelivery && isOutForDelivery && (
          <button
            type="button"
            onClick={() => handleStatusClick("delivered")}
            disabled={loadingAction}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition shadow-[0_0_12px_rgba(52,211,153,0.3)] cursor-pointer"
          >
            Confirm Final Delivery
          </button>
        )}
      </div>
    </div>
  );
};

export default DeliveryCard;
