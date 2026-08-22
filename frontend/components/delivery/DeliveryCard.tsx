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

const STEP_DEFINITIONS = [
  { step: 1, label: "Claimed", shortLabel: "Claim" },
  { step: 2, label: "Accepted", shortLabel: "Accept" },
  { step: 3, label: "In Transit", shortLabel: "Transit" },
  { step: 4, label: "Out for Delivery", shortLabel: "Out" },
  { step: 5, label: "Delivered", shortLabel: "Delivered" },
];

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
  const [otpRequested, setOtpRequested] = useState(hasActiveOtp);
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const displayId = formatDisplayId(orderId || id);

  const normalizedStatus = (status || "").toLowerCase();
  const isAssigned = normalizedStatus === "assigned";
  const isShipped = normalizedStatus === "shipped";
  const isOutForDelivery = normalizedStatus === "out-for-delivery";
  const isDelivered =
    normalizedStatus === "delivered" || normalizedStatus === "completed";

  // Calculate 5-Step Stepper state and progress bar
  let currentStep = 1;
  let progressPercent = 0;

  if (isDelivered) {
    currentStep = 5;
    progressPercent = 100;
  } else if (isOutForDelivery) {
    currentStep = 5; // Out for Delivery done, awaiting final doorstep OTP handoff
    progressPercent = 80;
  } else if (isShipped) {
    currentStep = 4; // In Transit, next is Out for Delivery
    progressPercent = 60;
  } else if (isAssigned) {
    currentStep = 2; // Claimed, next is Accept
    progressPercent = 20;
  } else {
    currentStep = 1; // Available / Unassigned
    progressPercent = 0;
  }

  const isAcceptedOrBeyond = isShipped || isOutForDelivery || isDelivered;

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
      setActionSuccess("Order claimed! Move to My Deliveries to accept.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to claim delivery.");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAcceptClick = async () => {
    if (!onAccept) return;
    setLoadingAction(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await onAccept(id);
      setActionSuccess("Order accepted! Full address & contact unlocked.");
    } catch (err: any) {
      setActionError(err?.message || "Failed to accept order.");
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
      setActionSuccess("OTP dispatched to customer email!");
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || "Failed to generate OTP.");
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

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-5 hover:border-[#F97316]/50 transition-all duration-200 shadow-sm flex flex-col justify-between space-y-4">
      <div>
        {/* Persistent 5-Step Stepper for My Deliveries */}
        {isMyDelivery && (
          <div className="pb-4 mb-4 border-b border-[#2A2B30]/70">
            <div className="relative flex items-center justify-between">
              {/* Background Connecting Bar */}
              <div className="absolute top-2.5 left-3 right-3 h-[2px] bg-[#2A2B30] z-0" />
              {/* Active Gradient Fill Line */}
              <div
                className="absolute top-2.5 left-3 h-[2px] bg-gradient-to-r from-emerald-500 via-[#F97316] to-[#F97316] z-0 transition-all duration-500 ease-out"
                style={{ width: `calc(${progressPercent}% * 0.92)` }}
              />

              {STEP_DEFINITIONS.map((s) => {
                const isStepCompleted = isDelivered
                  ? true
                  : s.step < currentStep;
                const isStepActive = !isDelivered && s.step === currentStep;

                return (
                  <div
                    key={s.step}
                    className="relative z-10 flex flex-col items-center group cursor-default"
                  >
                    {/* Node Circle */}
                    <div
                      className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                        isStepCompleted
                          ? "bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                          : isStepActive
                            ? "bg-[#F97316] text-white border-2 border-[#FDBA74] shadow-[0_0_12px_rgba(249,115,22,0.6)] animate-pulse"
                            : "bg-[#111214] border border-[#2A2B30] text-[#71717A]"
                      }`}
                    >
                      {isStepCompleted ? (
                        <Check size={11} strokeWidth={3} />
                      ) : (
                        <span>{s.step}</span>
                      )}
                    </div>

                    {/* Step Label */}
                    <span
                      className={`mt-1.5 text-[9px] font-mono tracking-tight text-center whitespace-nowrap transition-colors duration-200 ${
                        isStepCompleted
                          ? "text-emerald-400 font-semibold"
                          : isStepActive
                            ? "text-[#FDBA74] font-bold"
                            : "text-[#71717A]"
                      }`}
                    >
                      <span className="hidden sm:inline">{s.label}</span>
                      <span className="sm:hidden">{s.shortLabel}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

            {/* Security Indicator Pill */}
            <div className="flex items-center gap-2 mt-1.5">
              {!isAcceptedOrBeyond ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
                  <Lock size={10} />
                  <span>Masked Data (Accept to Unlock)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                  <Unlock size={10} />
                  <span>Customer Details Unlocked</span>
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

        {/* Stage 4: Out for Delivery Doorstep OTP Handover Module */}
        {isMyDelivery && isOutForDelivery && (
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
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
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

      {/* Action Triggers Bar */}
      <div className="pt-3 border-t border-[#2A2B30]/60 flex items-center justify-between gap-3">
        {/* Stage 1: Claim Action (Available to Claim tab) */}
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

        {/* Stage 2: Accept Action (Directly enabled on claimed orders) */}
        {isMyDelivery && isAssigned && (
          <button
            type="button"
            onClick={handleAcceptClick}
            disabled={loadingAction}
            className="w-full py-2.5 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Accept & Start Dispatch</span>
            <ChevronRight size={14} />
          </button>
        )}

        {/* Stage 3: Shipped / In Transit -> Advance to Out for Delivery */}
        {isMyDelivery && isShipped && (
          <button
            type="button"
            onClick={() => handleStatusClick("out-for-delivery")}
            disabled={loadingAction}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition shadow-[0_0_12px_rgba(245,158,11,0.3)] cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span>Mark Out for Delivery</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

export default DeliveryCard;
