"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import toast from "react-hot-toast";
import {
  MapPin,
  Navigation,
  Compass,
  Radio,
  RotateCcw,
  CheckCircle2,
  Store,
  Truck,
  KeyRound,
  ShieldCheck,
  Send,
} from "lucide-react";

import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import { TwoStageDeliveryMap } from "@/components/customer/TwoStageDeliveryMap";
import { BulkTwoStageDeliveryMap } from "@/components/delivery/BulkTwoStageDeliveryMap";
import type { BulkMapStop } from "@/components/delivery/BulkTwoStageDeliveryMapInner";
import {
  fetchDeliveries,
  sendAgentTelemetry,
  reachedPickupWarehouse,
  reachedCustomerLocation,
  requestDeliveryOtp,
  verifyCustomerDeliveryOtp,
  updateDeliveryStatus,
} from "@/lib/api";

export default function TrackingPage() {
  const [activeRoute, setActiveRoute] = useState<DeliveryRecord | null>(null);
  const [activeRoutes, setActiveRoutes] = useState<DeliveryRecord[]>([]);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [isLiveWatching, setIsLiveWatching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

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

  const loadActiveDeliveries = async () => {
    try {
      setIsLoading(true);
      const deliveries = await fetchDeliveries();
      // MUST only include deliveries assigned to THIS agent and currently active, sorted by sequenceOrder
      const myActive = deliveries
        .filter((d) => {
          const isMine = d.isMyDelivery || isAssignedToCurrentUser(d);
          const isOngoing =
            d.status !== "delivered" &&
            d.status !== "completed" &&
            d.deliveryStage !== "DELIVERED";
          return isMine && isOngoing && !d.isClaimable;
        })
        .sort((a, b) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1));

      setActiveRoutes(myActive);
      if (myActive.length > 0) {
        setActiveRoute((prev) => {
          if (prev) {
            const found = myActive.find((d) => d.id === prev.id);
            if (
              found &&
              found.status !== "delivered" &&
              found.deliveryStage !== "DELIVERED"
            ) {
              return found;
            }
          }
          // Active assignment is always the first uncompleted stop in sequence (Stop 1, Customer 1)
          return myActive[0];
        });
        const selected = myActive[0];
        if (selected.agentLocation?.latitude && selected.agentLocation?.longitude) {
          setCurrentCoords({
            latitude: selected.agentLocation.latitude,
            longitude: selected.agentLocation.longitude,
          });
        }
      } else {
        setActiveRoute(null);
      }
    } catch (err) {
      console.error("Error loading deliveries:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadActiveDeliveries();
  }, []);

  // Continuous live GPS watch
  const startLiveGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation not supported on this device.");
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setIsLiveWatching(true);
    toast.success("Live GPS broadcasting activated!");

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || undefined,
          heading: pos.coords.heading || undefined,
        };
        setCurrentCoords(coords);

        if (activeRoute?.id) {
          try {
            await sendAgentTelemetry(activeRoute.id, coords);
          } catch (e) {
            // Silently retry next tick
          }
        }
      },
      (err) => {
        console.warn("GPS watch error:", err);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );
  };

  const stopLiveGps = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsLiveWatching(false);
    toast("Live GPS broadcast stopped.", { icon: "ℹ️" });
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleAcquireCurrentLocation = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.loading("Acquiring GPS fix...", { id: "gps-fix" });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setCurrentCoords(coords);
        toast.dismiss("gps-fix");
        toast.success("GPS location updated!");

        if (activeRoute?.id) {
          try {
            await sendAgentTelemetry(activeRoute.id, coords);
          } catch (err: any) {
            console.error("Telemetry push failed:", err);
          }
        }
      },
      (err) => {
        toast.dismiss("gps-fix");
        toast.error("Failed to acquire GPS. Please allow location access.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handleReachedWarehouse = async () => {
    if (!activeRoute?.id) return;
    setActionLoading(true);
    try {
      await reachedPickupWarehouse(activeRoute.id);
      toast.success("Confirmed pickup arrival! Now heading to customer.");
      await loadActiveDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReachedCustomer = async () => {
    if (!activeRoute?.id) return;
    setActionLoading(true);
    try {
      await reachedCustomerLocation(activeRoute.id);
      toast.success("Arrived at customer location! You can now request OTP.");
      await loadActiveDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!activeRoute?.id || actionLoading || resendCooldown > 0) return;
    setActionLoading(true);
    try {
      const res = await requestDeliveryOtp(activeRoute.id);
      setResendCooldown(30);
      toast.success(res?.message || "OTP dispatched to customer email!");
      await loadActiveDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Failed to request OTP.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoute?.id || !otpInput.trim()) {
      toast.error("Please enter 6-digit OTP.");
      return;
    }
    setActionLoading(true);
    try {
      await verifyCustomerDeliveryOtp(activeRoute.id, otpInput.trim());
      toast.success("OTP verified! Delivery completed successfully.");
      setOtpInput("");
      await loadActiveDeliveries();
    } catch (err: any) {
      toast.error(err?.message || "Invalid OTP code.");
    } finally {
      setActionLoading(false);
    }
  };

  const stage =
    activeRoute?.deliveryStage ||
    (activeRoute?.status === "delivered" || activeRoute?.status === "completed"
      ? "DELIVERED"
      : activeRoute?.status === "out-for-delivery"
        ? "AT_CUSTOMER"
        : activeRoute?.status === "shipped"
          ? "TO_CUSTOMER"
          : "TO_WAREHOUSE");

  // Derive the agent marker position from the persisted delivery stage.
  // This is what makes the marker move when stage transitions happen —
  // we do NOT depend on live GPS or local React state for this.
  const agentPositionForMap = useMemo(() => {
    if (!activeRoute) return null;

    const wLat = activeRoute.pickupLatitude ? Number(activeRoute.pickupLatitude) : null;
    const wLng = activeRoute.pickupLongitude ? Number(activeRoute.pickupLongitude) : null;
    const cLat = activeRoute.latitude ? Number(activeRoute.latitude) : null;
    const cLng = activeRoute.longitude ? Number(activeRoute.longitude) : null;

    // AT_CUSTOMER or OTP stage → snap to customer location
    if (stage === "AT_CUSTOMER" || stage === "OTP_REQUESTED" || stage === "DELIVERED") {
      if (cLat != null && cLng != null && !isNaN(cLat) && !isNaN(cLng)) {
        return { lat: cLat, lng: cLng, name: "At Customer" };
      }
    }

    // In a multi-stop bulk batch:
    // If activeRoute is Stop > 1 and en route (TO_CUSTOMER), origin is the last delivered customer location!
    if ((activeRoute.sequenceOrder || 1) > 1 && stage === "TO_CUSTOMER") {
      if (
        activeRoute.agentLocation?.latitude != null &&
        activeRoute.agentLocation?.longitude != null &&
        !isNaN(Number(activeRoute.agentLocation.latitude)) &&
        !isNaN(Number(activeRoute.agentLocation.longitude))
      ) {
        return {
          lat: Number(activeRoute.agentLocation.latitude),
          lng: Number(activeRoute.agentLocation.longitude),
          name: "En route from previous stop",
        };
      }

      const prevOrder = activeRoutes.find(
        (r) => (r.sequenceOrder || 1) === (activeRoute.sequenceOrder || 1) - 1,
      );
      if (prevOrder && prevOrder.latitude && prevOrder.longitude) {
        return {
          lat: Number(prevOrder.latitude),
          lng: Number(prevOrder.longitude),
          name: `Departed from ${prevOrder.customer}`,
        };
      }
    }

    // AT_WAREHOUSE or en-route to FIRST customer (Stop 1) → snap to warehouse
    if (
      stage === "AT_WAREHOUSE" ||
      (stage === "TO_CUSTOMER" && (activeRoute.sequenceOrder || 1) === 1)
    ) {
      if (wLat != null && wLng != null && !isNaN(wLat) && !isNaN(wLng)) {
        return { lat: wLat, lng: wLng, name: "At Warehouse" };
      }
    }

    // TO_WAREHOUSE / UNCLAIMED → use the persisted agentLocation from DB
    if (activeRoute.agentLocation?.latitude && activeRoute.agentLocation?.longitude) {
      return {
        lat: Number(activeRoute.agentLocation.latitude),
        lng: Number(activeRoute.agentLocation.longitude),
        name: "Delivery Partner",
      };
    }

    // Final fallback: warehouse coords
    if (wLat != null && wLng != null && !isNaN(wLat) && !isNaN(wLng)) {
      return { lat: wLat, lng: wLng, name: "Delivery Partner" };
    }

    return null;
  }, [activeRoute, activeRoutes, stage]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
            Navigation & Routing
          </p>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Active Route Telemetry
          </h1>
          <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
            Live two-stage navigation from your GPS position to merchant warehouse and customer destination.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAcquireCurrentLocation}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1A1B1E] border border-[#2A2B30] text-xs font-bold text-[#FDBA74] hover:text-white hover:border-[#F97316]/50 transition cursor-pointer"
          >
            <Compass size={14} className="text-[#F97316]" />
            <span>Update GPS Fix</span>
          </button>

          <button
            type="button"
            onClick={isLiveWatching ? stopLiveGps : startLiveGps}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer ${
              isLiveWatching
                ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)] animate-pulse"
                : "bg-[#F97316] text-white hover:bg-[#EA580C] shadow-[0_0_12px_rgba(249,115,22,0.3)]"
            }`}
          >
            <Radio size={14} />
            <span>{isLiveWatching ? "Live GPS Active" : "Start Live Broadcast"}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          Loading active route telemetry...
        </div>
      ) : activeRoute ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Active Delivery Details & Stage Controls */}
          <div className="space-y-4 lg:col-span-1">
            {/* Active Order Card */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F97316]">
                    Active Assignment
                  </span>
                  <h2 className="text-lg font-bold text-white font-display mt-0.5">
                    Order #{activeRoute.orderId || activeRoute.id.slice(-6)}
                  </h2>
                  <p className="text-xs text-[#A1A1AA]">
                    Customer: {activeRoute.customer}
                  </p>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#F97316]/10 text-[#FDBA74] border border-[#F97316]/30">
                  {stage}
                </span>
              </div>

              {/* Waypoint 1: Warehouse */}
              <div className="p-3.5 rounded-2xl border border-sky-500/20 bg-sky-500/5 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold">
                  <Store size={14} />
                  <span>Pickup Origin</span>
                </div>
                <p className="text-white font-medium truncate">
                  {activeRoute.pickupName || "Merchant Warehouse"}
                </p>
                <p className="text-[11px] text-[#A1A1AA] truncate">
                  {activeRoute.pickupAddress?.fullAddress || "Verified Business Location"}
                </p>
              </div>

              {/* Waypoint 2: Customer */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <MapPin size={14} />
                  <span>Customer Destination</span>
                </div>
                <p className="text-white font-medium truncate">
                  {activeRoute.customer}
                </p>
                <p className="text-[11px] text-[#A1A1AA] truncate">
                  {activeRoute.address}
                </p>
              </div>

              {/* Active Stage Action Box */}
              <div className="pt-3 border-t border-[#2A2B30]/60 space-y-3">
                <p className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  Workflow Progression
                </p>

                {stage === "TO_WAREHOUSE" && (
                  <button
                    type="button"
                    onClick={handleReachedWarehouse}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(249,115,22,0.35)] cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    <span>{actionLoading ? "Updating..." : "Confirm: Reached Warehouse"}</span>
                  </button>
                )}

                {(stage === "TO_CUSTOMER" || stage === "AT_WAREHOUSE") && (
                  <button
                    type="button"
                    onClick={handleReachedCustomer}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(16,185,129,0.35)] cursor-pointer disabled:opacity-50"
                  >
                    <MapPin size={16} />
                    <span>{actionLoading ? "Updating..." : "Confirm: Reached Customer"}</span>
                  </button>
                )}

                {stage === "AT_CUSTOMER" && (
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={actionLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_0_14px_rgba(147,51,234,0.35)] cursor-pointer disabled:opacity-50"
                  >
                    <KeyRound size={16} />
                    <span>{actionLoading ? "Generating..." : "Request Delivery OTP"}</span>
                  </button>
                )}

                {stage === "OTP_REQUESTED" && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                        <KeyRound size={14} className="text-[#F97316]" />
                        <span>Doorstep OTP Verification</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={actionLoading || resendCooldown > 0}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FDBA74] hover:text-[#F97316] transition cursor-pointer disabled:opacity-50"
                      >
                        <Send size={10} />
                        <span>
                          {resendCooldown > 0
                            ? `Resend OTP (${resendCooldown}s)`
                            : actionLoading
                              ? "Sending..."
                              : "Resend OTP"}
                        </span>
                      </button>
                    </div>

                    <form onSubmit={handleVerifyOtp} className="space-y-2">
                      <p className="text-[11px] text-[#A1A1AA]">
                        Enter 6-digit OTP emailed to customer:
                      </p>
                      <div className="flex gap-2">
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
                          disabled={actionLoading || otpInput.length < 6}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white transition disabled:opacity-40 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                        >
                          {actionLoading ? "Verifying..." : "Verify & Complete"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Other Active Deliveries in Queue */}
            {activeRoutes.length > 1 && (
              <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-4 space-y-2">
                <p className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Queued Stops ({activeRoutes.length - 1})
                </p>
                {activeRoutes
                  .filter((r) => r.id !== activeRoute.id)
                  .sort((a, b) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1))
                  .map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setActiveRoute(r)}
                      className="p-3 rounded-2xl border border-[#2A2B30] bg-[#111214] hover:border-[#F97316]/40 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="text-white font-bold">
                          Stop #{r.sequenceOrder || 2}: {r.customer}
                        </p>
                        <p className="text-[#A1A1AA] truncate text-[11px]">
                          {r.address}
                        </p>
                      </div>
                      <span className="text-[#FDBA74] font-mono text-[10px]">
                        Switch
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Right: Interactive 2-Segment Live Map */}
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] overflow-hidden shadow-sm">
              <div className="p-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                  <Navigation size={15} className="text-[#F97316]" />
                  <span>Live Two-Segment Driver Navigation</span>
                </h3>
                <div className="flex items-center gap-2 text-xs font-mono text-[#FDBA74]">
                  <span>GPS: {currentCoords ? "Locked" : "Acquiring..."}</span>
                </div>
              </div>

              <div className="h-[460px] overflow-hidden">
                {activeRoute?.batchId || (activeRoute?.sequenceOrder && activeRoute.sequenceOrder > 1) || activeRoutes.length > 1 ? (
                  <BulkTwoStageDeliveryMap
                    agentPosition={agentPositionForMap}
                    warehousePosition={
                      activeRoute.pickupLatitude && activeRoute.pickupLongitude
                        ? {
                            lat: Number(activeRoute.pickupLatitude),
                            lng: Number(activeRoute.pickupLongitude),
                            name: activeRoute.pickupName || "Merchant Warehouse",
                            address: activeRoute.pickupAddress?.fullAddress,
                          }
                        : null
                    }
                    stops={activeRoutes.map((r, idx) => ({
                      id: r.id,
                      orderId: r.orderId,
                      customer: r.customer,
                      lat: Number(r.latitude) || (r.deliveryAddress?.latitude ? Number(r.deliveryAddress.latitude) : 13.0827),
                      lng: Number(r.longitude) || (r.deliveryAddress?.longitude ? Number(r.deliveryAddress.longitude) : 80.2707),
                      sequenceOrder: r.sequenceOrder || idx + 1,
                      isCompleted: r.status === "delivered" || r.status === "completed" || r.deliveryStage === "DELIVERED",
                      isActive: r.id === activeRoute.id,
                      address: r.address || r.deliveryAddress?.fullAddress,
                    }))}
                    deliveryStage={stage}
                  />
                ) : (
                  <TwoStageDeliveryMap
                    agentPosition={agentPositionForMap}
                    warehousePosition={
                      activeRoute.pickupLatitude && activeRoute.pickupLongitude
                        ? {
                            lat: Number(activeRoute.pickupLatitude),
                            lng: Number(activeRoute.pickupLongitude),
                            name: activeRoute.pickupName || "Merchant Warehouse",
                            address: activeRoute.pickupAddress?.fullAddress,
                          }
                        : null
                    }
                    customerPosition={
                      activeRoute.latitude && activeRoute.longitude
                        ? {
                            lat: Number(activeRoute.latitude),
                            lng: Number(activeRoute.longitude),
                            name: activeRoute.customer,
                            address: activeRoute.address,
                          }
                        : null
                    }
                    deliveryStage={stage}
                    isDelivered={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-16 text-center space-y-3">
          <Truck size={36} className="mx-auto text-[#A1A1AA]" />
          <h3 className="text-lg font-bold text-white">No Active Deliveries</h3>
          <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
            You do not have any active shipments. Go to the Deliveries tab to claim available orders from the fleet pool.
          </p>
        </div>
      )}
    </div>
  );
}
