"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle2,
  X,
  Store,
  Layers,
  Sparkles,
  Check,
  Flame,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchNearbyOrders,
  bulkClaimOrders,
  NearbyOrderCandidate,
  NearbyOrdersResponse,
} from "@/lib/api";
import toast from "react-hot-toast";

interface NearbyBulkModalProps {
  isOpen: boolean;
  primaryOrderId: string;
  primaryOrderDisplayId?: string;
  agentCoords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  onClose: () => void;
  onBulkConfirmed: (result: any) => Promise<void>;
  onSkipSingleOrder: () => Promise<void>;
}

export default function NearbyBulkModal({
  isOpen,
  primaryOrderId,
  primaryOrderDisplayId,
  agentCoords,
  onClose,
  onBulkConfirmed,
  onSkipSingleOrder,
}: NearbyBulkModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nearbyData, setNearbyData] = useState<NearbyOrdersResponse | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "1km" | "2km" | "3km">("all");

  useEffect(() => {
    if (!isOpen || !primaryOrderId) return;

    let isMounted = true;
    setLoading(true);

    fetchNearbyOrders(primaryOrderId)
      .then((res) => {
        if (isMounted) {
          setNearbyData(res);
          // Default: select same-warehouse and within 1km candidates for agent convenience
          const initialSelect = (res.allCandidates || [])
            .filter((o) => o.isSameWarehouse || o.distanceKm <= 1.0)
            .map((o) => o.id);
          setSelectedOrderIds(initialSelect);
        }
      })
      .catch((err) => {
        console.warn("Failed to load nearby bulk orders:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, primaryOrderId]);

  if (!isOpen) return null;

  const allCandidates = nearbyData?.allCandidates || [];
  const within1km = nearbyData?.within1km || [];
  const within2km = nearbyData?.within2km || [];
  const within3km = nearbyData?.within3km || [];

  const displayedCandidates =
    activeTab === "1km"
      ? within1km
      : activeTab === "2km"
        ? within2km
        : activeTab === "3km"
          ? within3km
          : allCandidates;

  const handleToggleSelect = (id: string) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    setSelectedOrderIds(allCandidates.map((o) => o.id));
  };

  const handleClearAll = () => {
    setSelectedOrderIds([]);
  };

  const handleConfirmBulk = async () => {
    if (submitting) return;

    // Combine primary order + selected additional orders
    const allIdsToClaim = Array.from(
      new Set([primaryOrderId, ...selectedOrderIds]),
    );

    if (selectedOrderIds.length === 0) {
      // If none selected, continue as single order
      await onSkipSingleOrder();
      onClose();
      return;
    }

    setSubmitting(true);
    toast.loading("Optimizing multi-stop route & creating bulk delivery...", {
      id: "bulk-confirm",
    });

    try {
      const res = await bulkClaimOrders(allIdsToClaim, agentCoords);
      toast.dismiss("bulk-confirm");
      toast.success(
        `Bulk delivery activated with ${allIdsToClaim.length} orders!`,
      );
      await onBulkConfirmed(res);
      onClose();
    } catch (err: any) {
      toast.dismiss("bulk-confirm");
      toast.error(err?.message || "Failed to create bulk delivery.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] shrink-0">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#F97316] uppercase bg-[#F97316]/10 border border-[#F97316]/20 px-2 py-0.5 rounded-md">
                Optional Extension
              </span>
              {primaryOrderDisplayId && (
                <span className="text-xs font-mono text-[#A1A1AA]">
                  Anchor: {primaryOrderDisplayId}
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white font-display tracking-tight mt-1">
              Nearby Bulk Delivery Available
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-1">
              Bundle additional orders along your route to maximize earnings
              (within 3.0 km radius).
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-12 text-center text-[#A1A1AA]">
            <Loader2 className="h-6 w-6 animate-spin text-[#F97316] mx-auto mb-2" />
            <p className="text-xs font-semibold text-white">
              Scanning geospatial proximity for nearby packages...
            </p>
            <p className="text-[11px] text-[#A1A1AA] mt-1">
              Calculating coordinate distances within 3 km
            </p>
          </div>
        ) : allCandidates.length === 0 ? (
          <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-8 text-center space-y-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#A1A1AA]">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                No Additional Nearby Orders
              </h4>
              <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                There are no other unclaimed packages within 3 km of this route.
                You can proceed with your single order delivery.
              </p>
            </div>
            <div className="pt-2">
              <Button
                type="button"
                onClick={async () => {
                  await onSkipSingleOrder();
                  onClose();
                }}
                className="bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-xl px-6"
              >
                Continue Single Delivery
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Radius Group Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2A2B30] pb-3">
              <div className="flex items-center gap-1.5 bg-[#111214] p-1 rounded-xl border border-[#2A2B30]">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "all"
                      ? "bg-[#F97316] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  All ({allCandidates.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("1km")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "1km"
                      ? "bg-[#F97316] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  Within 1 km ({within1km.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("2km")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "2km"
                      ? "bg-[#F97316] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  Within 2 km ({within2km.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("3km")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    activeTab === "3km"
                      ? "bg-[#F97316] text-white shadow-sm"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  Within 3 km ({within3km.length})
                </button>
              </div>

              {/* Bulk Selection Helpers */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#F97316] hover:underline font-semibold cursor-pointer"
                >
                  Select All
                </button>
                <span className="text-[#2A2B30]">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[#A1A1AA] hover:text-white font-semibold cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* Candidate Orders List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {displayedCandidates.map((cand) => {
                const isSelected = selectedOrderIds.includes(cand.id);

                return (
                  <div
                    key={cand.id}
                    onClick={() => handleToggleSelect(cand.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? "bg-[#F97316]/10 border-[#F97316]/50 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
                        : "bg-[#111214] border-[#2A2B30] hover:border-[#F97316]/30"
                    }`}
                  >
                    {/* Checkbox */}
                    <div
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition ${
                        isSelected
                          ? "bg-[#F97316] border-[#F97316] text-white"
                          : "border-[#2A2B30] bg-[#1A1B1E]"
                      }`}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </div>

                    {/* Order Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">
                            #{cand.orderId || cand.id.slice(-4)}
                          </span>
                          <span className="text-xs font-semibold text-[#FDBA74]">
                            {cand.customer}
                          </span>
                        </div>

                        <span className="text-xs font-mono font-bold text-[#F97316] bg-[#1A1B1E] px-2 py-0.5 rounded-md border border-[#2A2B30]">
                          {cand.distanceKm} km away
                        </span>
                      </div>

                      {/* Same Warehouse Badge */}
                      {cand.isSameWarehouse && (
                        <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          <Flame className="h-3 w-3" />
                          <span>Same Pickup Warehouse (High Efficiency)</span>
                        </div>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#A1A1AA]">
                        <div className="flex items-center gap-1 truncate">
                          <Store className="h-3 w-3 text-[#A1A1AA] shrink-0" />
                          <span className="truncate">{cand.shopName}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 text-[#F97316] shrink-0" />
                          <span className="truncate">
                            {cand.deliveryAddress?.area ||
                              cand.deliveryAddress?.city ||
                              "Customer Location"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Footer */}
            <div className="border-t border-[#2A2B30] pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#A1A1AA]">
                Selected:{" "}
                <strong className="text-white font-mono">
                  {selectedOrderIds.length} additional orders
                </strong>{" "}
                (Total: {selectedOrderIds.length + 1} with current order)
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await onSkipSingleOrder();
                    onClose();
                  }}
                  className="flex-1 sm:flex-none border-[#2A2B30] bg-[#111214] hover:bg-[#1A1B1E] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Continue Single Order
                </Button>

                <Button
                  type="button"
                  disabled={submitting || selectedOrderIds.length === 0}
                  onClick={handleConfirmBulk}
                  className="flex-1 sm:flex-none bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-[0_0_14px_rgba(249,115,22,0.3)] cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  <span>
                    Confirm Bulk Delivery ({selectedOrderIds.length + 1})
                  </span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
