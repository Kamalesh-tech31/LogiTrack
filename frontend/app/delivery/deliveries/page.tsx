"use client";

import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Package,
  Truck,
  Check,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Layers,
} from "lucide-react";

import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import {
  fetchDeliveries,
  claimDelivery,
  requestDeliveryOtp,
  verifyCustomerDeliveryOtp,
  acceptDelivery,
  addOrderToBatch,
  updateDeliveryStatus,
  reachedPickupWarehouse,
  reachedCustomerLocation,
} from "@/lib/api";
import DeliveryCard from "@/components/delivery/DeliveryCard";
import BulkDeliveryCard from "@/components/delivery/BulkDeliveryCard";
import ClaimLocationModal from "@/components/delivery/ClaimLocationModal";
import NearbyBulkModal from "@/components/delivery/NearbyBulkModal";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "available">("my");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim modal state
  const [claimModalOrder, setClaimModalOrder] = useState<{
    id: string;
    orderId?: string;
  } | null>(null);

  // Nearby Bulk Delivery Modal state
  const [nearbyModalData, setNearbyModalData] = useState<{
    orderId: string;
    orderDisplayId?: string;
    coords: { latitude: number; longitude: number; accuracy?: number };
  } | null>(null);

  const loadDeliveries = async () => {
    try {
      setError(null);
      const data = await fetchDeliveries();
      setDeliveries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load deliveries.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeliveries();
  }, []);

  const isAssignedToCurrentUser = (delivery: DeliveryRecord) => {
    if (delivery.isMyDelivery) return true;
    if (typeof window === "undefined") return false;
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return false;
    const agent =
      delivery.agent ||
      delivery.raw?.assignedAgent ||
      delivery.raw?.claimedBy;
    if (!agent) return false;
    if (typeof agent === "string") return String(agent) === currentUserId;
    if (agent._id) return String(agent._id) === currentUserId;
    if (agent.id) return String(agent.id) === currentUserId;
    return false;
  };

  // Split into Available (unassigned) vs My Deliveries (assigned to current agent)
  const availableDeliveries = deliveries.filter(
    (d) =>
      (d.isClaimable || (!d.agent && !d.raw?.assignedAgent && !d.isClaimed)) &&
      !d.isMyDelivery &&
      !isAssignedToCurrentUser(d) &&
      d.status !== "delivered" &&
      d.status !== "completed",
  );

  const myDeliveries = deliveries.filter(
    (d) =>
      (d.isMyDelivery || isAssignedToCurrentUser(d)) &&
      !d.isClaimable &&
      d.status !== "delivered" &&
      d.status !== "completed",
  );

  // Group myDeliveries into Bulk Batches (multiple orders with same batchId) vs Individual Deliveries
  const { batchGroups, individualDeliveries } = useMemo(() => {
    const batches: Record<string, DeliveryRecord[]> = {};
    const singles: DeliveryRecord[] = [];

    myDeliveries.forEach((d) => {
      const bId = d.batchId || d.raw?.batchId;
      if (bId) {
        if (!batches[bId]) batches[bId] = [];
        batches[bId].push(d);
      } else {
        singles.push(d);
      }
    });

    const realBatches: { batchId: string; orders: DeliveryRecord[] }[] = [];
    for (const [bId, ords] of Object.entries(batches)) {
      if (ords.length > 1) {
        realBatches.push({
          batchId: bId,
          orders: ords.sort((a, b) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1)),
        });
      } else {
        singles.push(...ords);
      }
    }

    return { batchGroups: realBatches, individualDeliveries: singles };
  }, [myDeliveries]);

  const handleClaim = async (id: string) => {
    const targetOrder = deliveries.find((d) => d.id === id);
    setClaimModalOrder({
      id,
      orderId: targetOrder?.orderId || id,
    });
  };

  const handleConfirmClaimModal = async (coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: "GPS" | "Manual" | "Saved" | "Map";
  }) => {
    if (!claimModalOrder) return;
    const id = claimModalOrder.id;
    const orderDisplayId = claimModalOrder.orderId;

    toast.loading("Assigning delivery & activating route...", { id: "claim-submit" });
    try {
      await claimDelivery(id, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
      });
      toast.dismiss("claim-submit");
      toast.success("Order claimed successfully!");

      setClaimModalOrder(null);
      await loadDeliveries();
      setActiveTab("my");

      // Open Nearby Bulk Modal to check if agent wants to bundle nearby packages
      setNearbyModalData({
        orderId: id,
        orderDisplayId,
        coords: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        },
      });
    } catch (err: any) {
      toast.dismiss("claim-submit");
      toast.error(err?.message || "Failed to claim delivery.");
      throw err;
    }
  };

  const handleReachedWarehouse = async (id: string) => {
    try {
      await reachedPickupWarehouse(id);
      toast.success("Pickup arrival confirmed! En route to customer.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update pickup status.");
      throw err;
    }
  };

  const handleReachedCustomer = async (id: string) => {
    try {
      await reachedCustomerLocation(id);
      toast.success("Arrival confirmed! You can now request the delivery OTP.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update arrival status.");
      throw err;
    }
  };

  const handleRequestOtp = async (id: string) => {
    try {
      await requestDeliveryOtp(id);
      toast.success("New verification OTP sent to customer email.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to request OTP.");
      throw err;
    }
  };

  const handleVerifyOtp = async (id: string, otp: string) => {
    try {
      await verifyCustomerDeliveryOtp(id, otp);
      toast.success("Customer OTP verified! Delivery completed successfully.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Invalid verification OTP.");
      throw err;
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const response: any = await acceptDelivery(id);
      if (response?.batchable) {
        if (window.confirm(response.message || "Order is nearby. Add to batch?")) {
          const batchRes = await addOrderToBatch(id);
          toast.success(batchRes.message || "Added to batch!");
          await loadDeliveries();
        }
        return;
      }
      toast.success("Delivery accepted! Status updated to Shipped.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Unable to accept delivery.");
      throw err;
    }
  };

  const handleStatusUpdate = async (
    id: string,
    status: string,
    otp?: string,
  ) => {
    try {
      await updateDeliveryStatus(id, status, otp);
      if (status === "delivered") {
        toast.success("Delivery verified & completed successfully!");
      } else {
        toast.success(`Delivery status updated to ${status}.`);
      }
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
      throw err;
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header & Section Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
            Logistics Pipeline
          </p>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Deliveries & Dispatch
          </h1>
          <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
            Claim unassigned orders with live GPS, bundle nearby bulk deliveries, execute two-stage routing, and verify customer handoff OTPs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void loadDeliveries()}
            title="Refresh Deliveries"
            className="p-2.5 rounded-2xl bg-[#1A1B1E] border border-[#2A2B30] text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
          >
            <RefreshCw size={16} />
          </button>

          {/* Tab Filter Pills */}
          <div className="flex items-center bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-1">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "my"
                  ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              <span>My Deliveries</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#111214]/60 text-[10px] font-mono">
                {myDeliveries.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("available")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                activeTab === "available"
                  ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                  : "text-[#A1A1AA] hover:text-white"
              }`}
            >
              <span>Available to Claim</span>
              <span className="px-1.5 py-0.2 rounded-md bg-[#111214]/60 text-[10px] font-mono">
                {availableDeliveries.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316] mb-3 animate-pulse">
            <Package size={20} />
          </div>
          <p className="text-sm font-medium text-white">Loading delivery telemetry...</p>
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error}
        </div>
      ) : activeTab === "my" ? (
        myDeliveries.length === 0 ? (
          <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
              <Package size={24} />
            </div>
            <h3 className="text-base font-bold text-white">
              No Assigned Deliveries
            </h3>
            <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
              You do not have any active shipments assigned. Check 'Available to Claim' to pick up new orders.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Render Multi-Order Bulk Delivery Blocks */}
            {batchGroups.map((bg) => (
              <BulkDeliveryCard
                key={bg.batchId}
                batchId={bg.batchId}
                orders={bg.orders}
                onReachedWarehouse={handleReachedWarehouse}
                onReachedCustomer={handleReachedCustomer}
                onRequestOtp={handleRequestOtp}
                onVerifyOtp={handleVerifyOtp}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}

            {/* Render Individual Orders */}
            {individualDeliveries.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2">
                {individualDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    id={delivery.id}
                    orderId={delivery.orderId}
                    customer={delivery.customer}
                    address={delivery.address}
                    eta={delivery.eta}
                    status={delivery.status}
                    deliveryStage={
                      delivery.deliveryStage ||
                      (delivery.status === "delivered" || delivery.status === "completed"
                        ? "DELIVERED"
                        : delivery.status === "out-for-delivery"
                          ? "AT_CUSTOMER"
                          : delivery.status === "shipped"
                            ? "TO_CUSTOMER"
                            : "TO_WAREHOUSE")
                    }
                    pickupName={delivery.pickupName}
                    pickupAddress={delivery.pickupAddress}
                    priority={delivery.priority || "Standard"}
                    contact={delivery.contact}
                    location={delivery.city || delivery.address}
                    lastUpdated={delivery.lastUpdated || "Live"}
                    customerVerified={delivery.customerVerified}
                    hasActiveOtp={delivery.hasActiveOtp}
                    sequenceOrder={delivery.sequenceOrder || delivery.raw?.sequenceOrder}
                    batchId={delivery.batchId || delivery.raw?.batchId}
                    isClaimable={false}
                    isMyDelivery={true}
                    onClaim={handleClaim}
                    onReachedWarehouse={handleReachedWarehouse}
                    onReachedCustomer={handleReachedCustomer}
                    onRequestOtp={handleRequestOtp}
                    onVerifyOtp={handleVerifyOtp}
                    onAccept={handleAccept}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        )
      ) : availableDeliveries.length === 0 ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-white">
            No Orders to Claim
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            All customer orders have been claimed by the fleet. New orders will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {availableDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              id={delivery.id}
              orderId={delivery.orderId}
              customer={delivery.customer}
              address={delivery.address}
              eta={delivery.eta}
              status={delivery.status}
              deliveryStage={
                delivery.deliveryStage ||
                (delivery.status === "delivered" || delivery.status === "completed"
                  ? "DELIVERED"
                  : delivery.status === "out-for-delivery"
                    ? "AT_CUSTOMER"
                    : delivery.status === "shipped"
                      ? "TO_CUSTOMER"
                      : "TO_WAREHOUSE")
              }
              pickupName={delivery.pickupName}
              pickupAddress={delivery.pickupAddress}
              priority={delivery.priority || "Standard"}
              contact={delivery.contact}
              location={delivery.city || delivery.address}
              lastUpdated={delivery.lastUpdated || "Live"}
              customerVerified={delivery.customerVerified}
              hasActiveOtp={delivery.hasActiveOtp}
              sequenceOrder={delivery.sequenceOrder || delivery.raw?.sequenceOrder}
              batchId={delivery.batchId || delivery.raw?.batchId}
              isClaimable={true}
              isMyDelivery={false}
              onClaim={handleClaim}
              onReachedWarehouse={handleReachedWarehouse}
              onReachedCustomer={handleReachedCustomer}
              onRequestOtp={handleRequestOtp}
              onVerifyOtp={handleVerifyOtp}
              onAccept={handleAccept}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}

      {/* 3-Way Location Selector Modal for Order Claim */}
      {claimModalOrder && (
        <ClaimLocationModal
          isOpen={Boolean(claimModalOrder)}
          orderId={claimModalOrder.id}
          orderDisplayId={claimModalOrder.orderId}
          onClose={() => setClaimModalOrder(null)}
          onConfirmClaim={handleConfirmClaimModal}
        />
      )}

      {/* Nearby Bulk Delivery Modal */}
      {nearbyModalData && (
        <NearbyBulkModal
          isOpen={Boolean(nearbyModalData)}
          primaryOrderId={nearbyModalData.orderId}
          primaryOrderDisplayId={nearbyModalData.orderDisplayId}
          agentCoords={nearbyModalData.coords}
          onClose={() => setNearbyModalData(null)}
          onBulkConfirmed={async () => {
            await loadDeliveries();
            setActiveTab("my");
          }}
          onSkipSingleOrder={async () => {
            await loadDeliveries();
            setActiveTab("my");
          }}
        />
      )}
    </div>
  );
}
