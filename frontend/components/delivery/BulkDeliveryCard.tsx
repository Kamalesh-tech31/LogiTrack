"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Store,
  MapPin,
  CheckCircle2,
  Clock,
  KeyRound,
  Send,
  Truck,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  Navigation,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DeliveryRecord } from "./deliveryData";
import toast from "react-hot-toast";

interface BulkDeliveryCardProps {
  batchId: string;
  orders: DeliveryRecord[];
  onReachedWarehouse: (id: string) => Promise<void>;
  onReachedCustomer: (id: string) => Promise<void>;
  onRequestOtp: (id: string) => Promise<void>;
  onVerifyOtp: (id: string, otp: string) => Promise<void>;
  onStatusUpdate?: (id: string, status: string, otp?: string) => Promise<void>;
}

export default function BulkDeliveryCard({
  batchId,
  orders,
  onReachedWarehouse,
  onReachedCustomer,
  onRequestOtp,
  onVerifyOtp,
}: BulkDeliveryCardProps) {
  const [activeOtpOrderId, setActiveOtpOrderId] = useState<string | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const [resendCooldowns, setResendCooldowns] = useState<Record<string, number>>({});

  // Sort orders by sequenceOrder
  const sortedOrders = [...orders].sort(
    (a, b) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1),
  );

  const completedCount = sortedOrders.filter(
    (o) =>
      o.status === "delivered" ||
      o.status === "completed" ||
      o.deliveryStage === "DELIVERED",
  ).length;

  const totalCount = sortedOrders.length;

  const remainingUnvisited = sortedOrders.filter(
    (o) =>
      o.status !== "delivered" &&
      o.status !== "completed" &&
      o.deliveryStage !== "DELIVERED",
  );

  const activeOrder = remainingUnvisited[0];
  const nextOrder = remainingUnvisited[1];

  // Common pickup warehouse
  const pickupWarehouse =
    sortedOrders[0]?.pickupAddress?.fullName ||
    sortedOrders[0]?.pickupAddress?.fullAddress ||
    sortedOrders[0]?.pickupName ||
    "Central Merchant Warehouse";

  // Resend cooldown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setResendCooldowns((prev) => {
        const next: Record<string, number> = {};
        let changed = false;
        for (const [key, val] of Object.entries(prev)) {
          if (val > 0) {
            next[key] = val - 1;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReachedWarehouseAll = async () => {
    if (!activeOrder) return;
    setLoadingOrderId(activeOrder.id);
    try {
      // Reaching warehouse updates the warehouse arrival
      await onReachedWarehouse(activeOrder.id);
      toast.success("Pickup arrival confirmed for bulk batch!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update warehouse arrival.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleReachedCustomerSingle = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      await onReachedCustomer(orderId);
      toast.success("Arrived at customer location! You can now request the OTP.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update arrival status.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleRequestOtpSingle = async (orderId: string) => {
    setLoadingOrderId(orderId);
    try {
      await onRequestOtp(orderId);
      setActiveOtpOrderId(orderId);
      setResendCooldowns((prev) => ({ ...prev, [orderId]: 30 }));
      toast.success("OTP sent to customer's email!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to request OTP.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const handleVerifyOtpSingle = async (orderId: string) => {
    const otp = (otpInputs[orderId] || "").trim();
    if (!otp || otp.length < 4) {
      toast.error("Please enter the 6-digit verification OTP.");
      return;
    }

    setLoadingOrderId(orderId);
    try {
      await onVerifyOtp(orderId, otp);
      setOtpInputs((prev) => ({ ...prev, [orderId]: "" }));
      setActiveOtpOrderId(null);
      toast.success("Customer delivery verified & completed successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP code.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-[#F97316]/30 bg-[#1A1B1E] shadow-[0_0_30px_rgba(249,115,22,0.1)] overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#F97316]/15 via-[#F97316]/5 to-transparent p-5 sm:p-6 border-b border-[#2A2B30] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-[#F97316] uppercase tracking-wider bg-[#F97316]/10 border border-[#F97316]/30 px-2 py-0.5 rounded-md">
                Bulk Delivery Block
              </span>
              <span className="text-xs font-mono font-bold text-white">
                #{batchId}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white font-display tracking-tight mt-0.5">
              {totalCount} Orders Bundled Route
            </h3>
          </div>
        </div>

        {/* Progress Bar & Status Pill */}
        <div className="flex flex-wrap items-center gap-4 bg-[#111214] px-4 py-2.5 rounded-2xl border border-[#2A2B30]">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-[#A1A1AA]">
              Batch Progress
            </p>
            <p className="text-xs font-bold text-white font-mono">
              {completedCount} / {totalCount} Completed
            </p>
          </div>
          <div className="w-16 h-2 bg-[#2A2B30] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F97316] transition-all duration-500 rounded-full"
              style={{
                width: `${Math.round((completedCount / totalCount) * 100)}%`,
              }}
            />
          </div>
          {activeOrder && (
            <div className="pl-3 border-l border-[#2A2B30] text-left text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#F97316]">
                <span className="text-[10px] uppercase tracking-wider font-mono text-[#A1A1AA]">
                  Active:
                </span>
                <span>{activeOrder.customer}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#A1A1AA] mt-0.5">
                <span className="text-[10px] uppercase tracking-wider font-mono">
                  Next:
                </span>
                <span>{nextOrder ? nextOrder.customer : "Final Destination"}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pickup Warehouse Bar */}
      <div className="p-4 px-6 bg-[#111214]/60 border-b border-[#2A2B30] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-[#A1A1AA]">
          <Store className="h-4 w-4 text-[#F97316] shrink-0" />
          <span>Pickup Hub:</span>
          <strong className="text-white font-medium">{pickupWarehouse}</strong>
        </div>

        {/* Global Warehouse Button if all stops still TO_WAREHOUSE */}
        {activeOrder &&
          (activeOrder.deliveryStage === "TO_WAREHOUSE" ||
            activeOrder.deliveryStage === "UNCLAIMED") && (
            <Button
              type="button"
              size="sm"
              disabled={loadingOrderId === activeOrder.id}
              onClick={handleReachedWarehouseAll}
              className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer"
            >
              Confirm Pickup Arrival at Hub
            </Button>
          )}
      </div>

      {/* Stops Sequence */}
      <div className="p-5 sm:p-6 space-y-4">
        <p className="text-[11px] uppercase tracking-wider font-mono text-[#A1A1AA]">
          Delivery Stops Sequence (Optimized Itinerary)
        </p>

        <div className="space-y-3.5">
          {sortedOrders.map((order, idx) => {
            const isCompleted =
              order.status === "delivered" ||
              order.status === "completed" ||
              order.deliveryStage === "DELIVERED";
            const isActive = activeOrder?.id === order.id;
            const isNext =
              !isCompleted &&
              !isActive &&
              idx ===
                sortedOrders.findIndex(
                  (o) =>
                    o.status !== "delivered" &&
                    o.status !== "completed" &&
                    o.deliveryStage !== "DELIVERED",
                ) +
                  1;

            const stage = order.deliveryStage || "UNCLAIMED";
            const orderOtp = otpInputs[order.id] || "";
            const isCooldown = (resendCooldowns[order.id] || 0) > 0;

            return (
              <div
                key={order.id}
                className={`rounded-2xl border p-4 sm:p-5 transition-all ${
                  isActive
                    ? "bg-[#1A1B1E] border-[#F97316]/50 shadow-[0_0_20px_rgba(249,115,22,0.15)] ring-1 ring-[#F97316]/30"
                    : isCompleted
                      ? "bg-[#111214]/50 border-emerald-500/20 opacity-80"
                      : "bg-[#111214] border-[#2A2B30] opacity-60"
                }`}
              >
                {/* Stop Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#2A2B30]/60">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-mono font-bold ${
                        isCompleted
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isActive
                            ? "bg-[#F97316] text-white"
                            : "bg-[#2A2B30] text-[#A1A1AA]"
                      }`}
                    >
                      {idx + 1}
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-bold text-white">
                          {order.customer}
                        </strong>
                        <span className="text-xs font-mono text-[#A1A1AA]">
                          #{order.orderId || order.id.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                        <Check className="h-3 w-3 stroke-[3]" />
                        <span>Delivered</span>
                      </span>
                    ) : isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#F97316] bg-[#F97316]/10 border border-[#F97316]/30 px-2.5 py-1 rounded-full animate-pulse">
                        <Navigation className="h-3 w-3" />
                        <span>Active Destination</span>
                      </span>
                    ) : isNext ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                        <span>Next Stop</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#A1A1AA] bg-[#1A1B1E] border border-[#2A2B30] px-2 py-0.5 rounded-full">
                        <span>Stop #{idx + 1}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stop Details */}
                <div className="pt-3 text-xs text-[#A1A1AA] space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#F97316] shrink-0 mt-0.5" />
                    <span className="text-[#F4F4F5]">
                      {order.deliveryAddress?.fullAddress ||
                        order.address ||
                        "Customer Address"}
                    </span>
                  </div>

                  {order.contact && (
                    <div className="pl-5 text-[11px] text-[#A1A1AA]">
                      Recipient Contact: {order.contact}
                    </div>
                  )}
                </div>

                {/* Active Stop Action Controls (Strictly per-customer OTP flow) */}
                {isActive && (
                  <div className="mt-4 pt-3.5 border-t border-[#2A2B30] space-y-3">
                    {/* Stage 1: Heading to Customer */}
                    {stage === "TO_CUSTOMER" && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#111214] p-3 rounded-xl border border-[#2A2B30]">
                        <div className="flex items-center gap-2 text-xs text-white">
                          <Truck className="h-4 w-4 text-[#F97316]" />
                          <span>En route to {order.customer}</span>
                        </div>
                        <Button
                          type="button"
                          disabled={loadingOrderId === order.id}
                          onClick={() => handleReachedCustomerSingle(order.id)}
                          className="w-full sm:w-auto bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl px-4 py-2"
                        >
                          Reached Customer Destination
                        </Button>
                      </div>
                    )}

                    {/* Stage 2: At Customer Location (Request OTP & Enter OTP) */}
                    {(stage === "AT_CUSTOMER" || stage === "OTP_REQUESTED") && (
                      <div className="space-y-3 bg-[#111214] p-3.5 sm:p-4 rounded-xl border border-[#F97316]/30">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-white">
                            <KeyRound className="h-4 w-4 text-[#F97316]" />
                            <span>Customer Delivery Verification</span>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                              loadingOrderId === order.id || isCooldown
                            }
                            onClick={() => handleRequestOtpSingle(order.id)}
                            className="border-[#2A2B30] text-xs font-semibold text-white hover:border-[#F97316] rounded-lg"
                          >
                            {isCooldown
                              ? `Resend in ${resendCooldowns[order.id]}s`
                              : order.hasActiveOtp || stage === "OTP_REQUESTED"
                                ? "Resend OTP"
                                : "Send Verification OTP"}
                          </Button>
                        </div>

                        {/* OTP Input Form */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={orderOtp}
                            onChange={(e) =>
                              setOtpInputs((prev) => ({
                                ...prev,
                                [order.id]: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                            className="flex-1 h-10 rounded-xl bg-[#1A1B1E] border border-[#2A2B30] px-3 text-center text-sm font-mono tracking-widest text-white focus:border-[#F97316] focus:outline-none"
                          />

                          <Button
                            type="button"
                            disabled={
                              loadingOrderId === order.id ||
                              orderOtp.length < 4
                            }
                            onClick={() => handleVerifyOtpSingle(order.id)}
                            className="h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl px-5 shadow-sm"
                          >
                            Verify & Complete
                          </Button>
                        </div>

                        <p className="text-[11px] text-[#A1A1AA]">
                          Ask the customer for the 6-digit security code sent to
                          their registered email address.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
