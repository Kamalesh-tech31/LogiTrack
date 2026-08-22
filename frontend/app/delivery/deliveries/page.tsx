"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Package, Truck, Check, AlertCircle, ShieldCheck, RefreshCw } from "lucide-react";

import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import {
  fetchDeliveries,
  claimDelivery,
  requestDeliveryOtp,
  verifyCustomerDeliveryOtp,
  acceptDelivery,
  updateDeliveryStatus,
} from "@/lib/api";
import DeliveryCard from "@/components/delivery/DeliveryCard";

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"my" | "available">("my");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    if (typeof window === "undefined") return false;
    const currentUserId = localStorage.getItem("userId");
    const agent = delivery.agent || delivery.raw?.assignedAgent;
    if (!agent) return false;
    if (typeof agent === "string") return String(agent) === currentUserId;
    if (agent._id) return String(agent._id) === currentUserId;
    if (agent.id) return String(agent.id) === currentUserId;
    return false;
  };

  // Split into Available (unassigned) vs My Deliveries (assigned to current agent)
  const availableDeliveries = deliveries.filter(
    (d) => !d.agent && !d.raw?.assignedAgent,
  );
  const myDeliveries = deliveries.filter(
    (d) => isAssignedToCurrentUser(d) || (d.agent && !availableDeliveries.includes(d)),
  );

  const handleClaim = async (id: string) => {
    try {
      const claimed = await claimDelivery(id);
      toast.success("Order claimed! Verification OTP dispatched to customer.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to claim delivery.");
      throw err;
    }
  };

  const handleRequestOtp = async (id: string) => {
    try {
      await requestDeliveryOtp(id);
      toast.success("New verification OTP sent to customer email.");
    } catch (err: any) {
      toast.error(err?.message || "Failed to request OTP.");
      throw err;
    }
  };

  const handleVerifyOtp = async (id: string, otp: string) => {
    try {
      await verifyCustomerDeliveryOtp(id, otp);
      toast.success("Customer OTP verified! Full address and contact unlocked.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Invalid verification OTP.");
      throw err;
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptDelivery(id);
      toast.success("Delivery accepted! Status updated to Shipped.");
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Customer OTP verification required before accepting.");
      throw err;
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await updateDeliveryStatus(id, status);
      toast.success(`Delivery status updated to ${status}.`);
      await loadDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
      throw err;
    }
  };

  const currentList = activeTab === "my" ? myDeliveries : availableDeliveries;

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
            Claim unassigned orders from the fleet pool, verify customer handoff codes, and execute verified deliveries.
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
      ) : currentList.length === 0 ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-white">
            {activeTab === "my" ? "No Assigned Deliveries" : "No Orders to Claim"}
          </h3>
          <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
            {activeTab === "my"
              ? "You do not have any active shipments assigned. Check 'Available to Claim' to pick up new orders."
              : "All customer orders have been claimed by the fleet. New orders will appear here automatically."}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {currentList.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              id={delivery.id}
              orderId={delivery.orderId}
              customer={delivery.customer}
              address={delivery.address}
              eta={delivery.eta}
              status={delivery.status}
              priority={delivery.priority || "Standard"}
              contact={delivery.contact}
              location={delivery.city || delivery.address}
              lastUpdated={delivery.lastUpdated || "Live"}
              customerVerified={delivery.customerVerified}
              hasActiveOtp={delivery.hasActiveOtp}
              isClaimable={activeTab === "available"}
              isMyDelivery={activeTab === "my"}
              onClaim={handleClaim}
              onRequestOtp={handleRequestOtp}
              onVerifyOtp={handleVerifyOtp}
              onAccept={handleAccept}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
