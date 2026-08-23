"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { TwoStageDeliveryMap } from "@/components/customer/TwoStageDeliveryMap";
import {
  fetchDeliveryByOrderId,
  fetchCustomerOrders as fetchOrders,
} from "@/lib/api";
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Copy,
  Check,
  Navigation,
  AlertCircle,
  Clock,
  Store,
  KeyRound,
  ShieldCheck,
} from "lucide-react";

const statusConfig = {
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle2,
  },
  "out-for-delivery": {
    label: "Arrived at Destination",
    color: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    icon: MapPin,
  },
  shipped: {
    label: "Heading to You",
    color: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    icon: Truck,
  },
  assigned: {
    label: "Driver Claimed",
    color: "bg-orange-500/10 text-orange-400 border border-orange-500/30",
    icon: Navigation,
  },
  pending: {
    label: "Order Placed",
    color: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    icon: Clock,
  },
};

type TrackingOrder = {
  id: string;
  customer: string;
  status: string;
  amount: number;
  date: string;
  sequenceOrder?: number | null;
};

function formatDisplayId(rawId: string | null | undefined) {
  if (!rawId) return "--";
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

function TrackingContent() {
  const searchParams = useSearchParams();
  const orderIdQuery = searchParams.get("orderId");
  const [orders, setOrders] = useState<TrackingOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [deliveryRoute, setDeliveryRoute] = useState<any>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
  } | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const normalizeOrder = (order: any, index: number): TrackingOrder => ({
    id: String(order.id || order._id || order.orderId || `order-${index}`),
    customer:
      order.customer ||
      order.customerName ||
      order.customer_name ||
      "Customer",
    status: order.status || "pending",
    amount:
      typeof order.amount === "number"
        ? order.amount
        : typeof order.totalPrice === "number"
          ? order.totalPrice
          : 0,
    date:
      order.date ||
      order.createdAt ||
      order.updatedAt ||
      new Date().toISOString(),
    sequenceOrder: order.sequenceOrder || order.raw?.sequenceOrder || null,
  });

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const loadOrders = async () => {
      setLoadingOrders(true);
      setError(null);

      try {
        const ordersData = await fetchOrders();
        const normalizedOrders = Array.isArray(ordersData)
          ? ordersData.map(normalizeOrder)
          : [];
        setOrders(normalizedOrders);
        const firstActiveOrder = normalizedOrders.find(
          (order) => order.status !== "delivered",
        );
        const selectedFromQuery =
          orderIdQuery &&
          normalizedOrders.some((order) => order.id === orderIdQuery)
            ? orderIdQuery
            : null;
        setSelectedOrderId(
          selectedFromQuery || (firstActiveOrder ? firstActiveOrder.id : null),
        );
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load orders",
        );
      } finally {
        setLoadingOrders(false);
      }
    };

    void loadOrders();
  }, [orderIdQuery]);

  const fetchRouteSummary = async (currentPosition: any, destination: any) => {
    if (!currentPosition || !destination) return null;
    if (
      typeof currentPosition.lat !== "number" ||
      typeof currentPosition.lng !== "number" ||
      typeof destination.lat !== "number" ||
      typeof destination.lng !== "number"
    ) {
      return null;
    }

    // Identical coordinates check (0m distance)
    if (
      Math.abs(currentPosition.lat - destination.lat) < 0.00005 &&
      Math.abs(currentPosition.lng - destination.lng) < 0.00005
    ) {
      return {
        distance: 0,
        duration: 0,
      };
    }

    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${currentPosition.lng},${currentPosition.lat};${destination.lng},${destination.lat}?overview=false&geometries=geojson`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "LogiTrack/1.0",
          },
        },
      );

      if (!response.ok) return { distance: 0, duration: 0 };
      const data = await response.json();
      if (!data.routes || data.routes.length === 0) return { distance: 0, duration: 0 };

      const route = data.routes[0];
      return {
        distance: Math.round((route.distance / 1000) * 10) / 10,
        duration: Math.round(route.duration / 60),
      };
    } catch {
      return { distance: 0, duration: 0 };
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadDeliveryRoute = async () => {
      if (!selectedOrderId) {
        setDeliveryRoute(null);
        setRouteInfo(null);
        return;
      }

      try {
        const deliveryData = await fetchDeliveryByOrderId(selectedOrderId);
        if (isCancelled) return;

        setDeliveryRoute(deliveryData);

        if (deliveryData.isClaimed && deliveryData.currentPosition && deliveryData.destination) {
          const target =
            deliveryData.deliveryStage === "TO_WAREHOUSE"
              ? deliveryData.origin
              : deliveryData.destination;

          const routeSummary = await fetchRouteSummary(
            deliveryData.currentPosition,
            target,
          );
          if (!isCancelled) {
            setRouteInfo(routeSummary);
          }
        } else {
          setRouteInfo(null);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load delivery tracking data",
          );
          setDeliveryRoute(null);
          setRouteInfo(null);
        }
      }
    };

    void loadDeliveryRoute();

    // Auto-poll live telemetry every 6 seconds for active claimed deliveries
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(() => {
      if (selectedOrderId) {
        void loadDeliveryRoute();
      }
    }, 6000);

    return () => {
      isCancelled = true;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [selectedOrderId, refreshKey]);

  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const selectedOrder =
    activeOrders.find((order) => order.id === selectedOrderId) ||
    orders.find((order) => order.id === selectedOrderId) ||
    activeOrders[0] ||
    null;

  useEffect(() => {
    if (!selectedOrderId && selectedOrder) {
      setSelectedOrderId(selectedOrder.id);
    }
  }, [selectedOrder, selectedOrderId]);

  const refreshTracking = () => {
    if (selectedOrderId) {
      setRefreshKey((value) => value + 1);
    }
  };

  const isOrderClaimed = Boolean(
    deliveryRoute?.isClaimed &&
      deliveryRoute?.deliveryStage !== "UNCLAIMED",
  );

  const stage = deliveryRoute?.deliveryStage || "UNCLAIMED";
  const isDelivered =
    deliveryRoute?.status === "delivered" || stage === "DELIVERED";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Customer-Friendly Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Live Telemetry & Milestones
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Track Your Shipment
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Monitor your package in real time across the two-stage pickup and customer delivery route.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Orders List */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Shipments ({orders.length})
          </h2>

          {loadingOrders ? (
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 text-center text-xs text-[#A1A1AA]">
              Loading orders...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-red-400" />
              <p className="text-xs text-red-300 font-medium">{error}</p>
            </div>
          ) : orders.length > 0 ? (
            orders.map((order) => {
              const statusKey = order.status as keyof typeof statusConfig;
              const status = statusConfig[statusKey] || statusConfig.pending;
              const isSelected = order.id === selectedOrder?.id;
              const displayId = formatDisplayId(order.id);

              return (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`cursor-pointer rounded-3xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? "border-[#F97316] bg-[#F97316]/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                      : "border-[#2A2B30] bg-[#1A1B1E] hover:border-[#2A2B30]/90 hover:bg-[#1A1B1E]/80"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-white text-sm font-display">
                        Order {displayId}
                      </p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">
                        {order.customer}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs border-t border-[#2A2B30]/60 pt-3">
                    <span className="text-[#A1A1AA] font-mono">
                      {new Date(order.date).toLocaleDateString()}
                    </span>
                    <span className="font-extrabold text-white font-display">
                      ₹{order.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 text-center text-[#A1A1AA] space-y-2">
              <CheckCircle2 size={24} className="mx-auto text-emerald-400" />
              <p className="text-sm font-bold text-white">No active orders</p>
              <p className="text-xs text-[#A1A1AA]">
                Your placed orders will appear here for live tracking.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Live Map & State Machine */}
        <div className="space-y-4 lg:col-span-2">
          {selectedOrder ? (
            <div className="space-y-4">
              {/* Order Header Box */}
              <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-white font-display">
                      Order {formatDisplayId(selectedOrder.id)}
                    </h2>
                    <button
                      type="button"
                      onClick={() => handleCopyId(selectedOrder.id)}
                      title={`Copy full ID: ${selectedOrder.id}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
                    >
                      <span>
                        {selectedOrder.id
                          ? `#${selectedOrder.id.slice(-6)}`
                          : "COPY"}
                      </span>
                      {copiedId === selectedOrder.id ? (
                        <Check size={10} className="text-green-400" />
                      ) : (
                        <Copy size={10} />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    Customer: {selectedOrder.customer}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={refreshTracking}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#111214] border border-[#2A2B30] text-xs font-semibold text-[#FDBA74] hover:text-white hover:border-[#F97316]/50 transition cursor-pointer self-start sm:self-auto"
                >
                  <RefreshCw
                    size={13}
                    className={loadingTracking ? "animate-spin" : ""}
                  />
                  <span>Refresh Telemetry</span>
                </button>
              </div>

              {/* Delivery State Machine & Timeline */}
              {isOrderClaimed ? (
                <div className="space-y-4">
                  {/* Step Progress Milestone Bar */}
                  <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                        Delivery Milestones
                      </h3>
                      <span className="text-[11px] font-mono text-[#F97316]">
                        {isDelivered
                          ? "Fulfillment Completed"
                          : stage === "TO_WAREHOUSE"
                            ? "Stage 1: En Route to Pickup Warehouse"
                            : stage === "TO_CUSTOMER"
                              ? "Stage 2: En Route to Your Address"
                              : stage === "AT_CUSTOMER"
                                ? "Driver Arrived at Destination"
                                : stage === "OTP_REQUESTED"
                                  ? "Awaiting OTP Verification"
                                  : "In Transit"}
                      </span>
                    </div>

                    {/* Step Dots */}
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px] font-mono">
                      {/* Step 1: Claimed */}
                      <div className="space-y-1">
                        <div className="h-1.5 rounded-full bg-[#F97316]"></div>
                        <p className="text-white font-semibold">Claimed</p>
                      </div>

                      {/* Step 2: Pickup */}
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            stage === "TO_WAREHOUSE"
                              ? "bg-[#F97316] animate-pulse"
                              : "bg-[#F97316]"
                          }`}
                        ></div>
                        <p
                          className={
                            stage === "TO_WAREHOUSE"
                              ? "text-[#FDBA74] font-bold"
                              : "text-white font-semibold"
                          }
                        >
                          Pickup Hub
                        </p>
                      </div>

                      {/* Step 3: Traveling */}
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            stage === "TO_CUSTOMER"
                              ? "bg-[#10B981] animate-pulse"
                              : stage === "AT_CUSTOMER" ||
                                  stage === "OTP_REQUESTED" ||
                                  isDelivered
                                ? "bg-[#10B981]"
                                : "bg-[#2A2B30]"
                          }`}
                        ></div>
                        <p
                          className={
                            stage === "TO_CUSTOMER"
                              ? "text-emerald-400 font-bold"
                              : stage === "AT_CUSTOMER" ||
                                  stage === "OTP_REQUESTED" ||
                                  isDelivered
                                ? "text-white"
                                : "text-[#A1A1AA]"
                          }
                        >
                          Out for Delivery
                        </p>
                      </div>

                      {/* Step 4: Arrived */}
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            stage === "AT_CUSTOMER" || stage === "OTP_REQUESTED"
                              ? "bg-purple-500 animate-pulse"
                              : isDelivered
                                ? "bg-[#10B981]"
                                : "bg-[#2A2B30]"
                          }`}
                        ></div>
                        <p
                          className={
                            stage === "AT_CUSTOMER" || stage === "OTP_REQUESTED"
                              ? "text-purple-400 font-bold"
                              : isDelivered
                                ? "text-white"
                                : "text-[#A1A1AA]"
                          }
                        >
                          Arrived
                        </p>
                      </div>

                      {/* Step 5: Delivered */}
                      <div className="space-y-1">
                        <div
                          className={`h-1.5 rounded-full ${
                            isDelivered ? "bg-emerald-400" : "bg-[#2A2B30]"
                          }`}
                        ></div>
                        <p
                          className={
                            isDelivered
                              ? "text-emerald-400 font-bold"
                              : "text-[#A1A1AA]"
                          }
                        >
                          Delivered
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Information Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Driver Card */}
                    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <Navigation className="h-4 w-4 text-[#F97316]" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Delivery Agent
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white font-display">
                        {deliveryRoute.agent?.name || "Assigned Driver"}
                      </p>
                      <p className="text-xs text-[#A1A1AA]">
                        {deliveryRoute.agent?.phone || "Contact via LogiTrack"}
                      </p>
                    </div>

                    {/* Warehouse Origin Card */}
                    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <Store className="h-4 w-4 text-sky-400" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Pickup Warehouse
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white font-display truncate">
                        {deliveryRoute.origin?.name || "Merchant Warehouse"}
                      </p>
                      <p className="text-xs text-[#A1A1AA] truncate">
                        {deliveryRoute.origin?.fullAddress || "Verified Business Hub"}
                      </p>
                    </div>

                    {/* Customer Destination Card */}
                    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm space-y-1">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <MapPin className="h-4 w-4 text-emerald-400" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">
                          Your Address
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white font-display truncate">
                        {deliveryRoute.destination?.name || "Customer Destination"}
                      </p>
                      <p className="text-xs text-[#A1A1AA] truncate">
                        {deliveryRoute.destination?.fullAddress ||
                          selectedOrder.customer}
                      </p>
                    </div>
                  </div>

                  {/* OTP Notification Banner when driver arrives */}
                  {stage === "OTP_REQUESTED" && (
                    <div className="rounded-3xl border border-purple-500/40 bg-purple-500/10 p-5 flex items-center gap-4">
                      <div className="h-10 w-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                        <KeyRound size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          Delivery Verification OTP Dispatched
                        </h4>
                        <p className="text-xs text-purple-200/80 mt-0.5">
                          A 6-digit delivery handoff passcode has been emailed to you. Please provide it to your delivery agent upon package handover.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Two-Stage Interactive Map Container */}
                  <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        <MapPin size={15} className="text-[#F97316]" />
                        <span>Live Two-Stage Delivery Route</span>
                      </h3>
                      {routeInfo && (
                        <div className="flex items-center gap-3 text-xs font-mono text-[#FDBA74]">
                          <span>{routeInfo.distance} km</span>
                          <span>•</span>
                          <span>~{routeInfo.duration} mins</span>
                        </div>
                      )}
                    </div>
                    <div className="h-96 overflow-hidden">
                      <TwoStageDeliveryMap
                        agentPosition={
                          deliveryRoute.currentPosition
                            ? {
                                lat: deliveryRoute.currentPosition.lat,
                                lng: deliveryRoute.currentPosition.lng,
                                name: deliveryRoute.agent?.name,
                              }
                            : null
                        }
                        warehousePosition={
                          deliveryRoute.origin
                            ? {
                                lat: deliveryRoute.origin.lat,
                                lng: deliveryRoute.origin.lng,
                                name: deliveryRoute.origin.name,
                                address: deliveryRoute.origin.fullAddress,
                              }
                            : null
                        }
                        customerPosition={
                          deliveryRoute.destination
                            ? {
                                lat: deliveryRoute.destination.lat,
                                lng: deliveryRoute.destination.lng,
                                name: deliveryRoute.destination.name,
                                address: deliveryRoute.destination.fullAddress,
                              }
                            : null
                        }
                        deliveryStage={stage}
                        isDelivered={isDelivered}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Unclaimed Order Standby State: No Fake Map, No Fake Route */
                <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center space-y-4">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] animate-pulse">
                    <Clock size={32} />
                  </div>
                  <div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      Standby • Dispatch Queue
                    </span>
                    <h3 className="text-xl font-bold text-white font-display mt-3">
                      Waiting for a Delivery Agent to Claim Your Order
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A1A1AA] mt-2 max-w-lg mx-auto leading-relaxed">
                      Your order has been confirmed and placed in the fleet dispatch queue. Live telemetry and the interactive two-segment route map will begin as soon as a delivery driver claims your shipment.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#2A2B30]/60 max-w-md mx-auto flex items-center justify-between text-xs font-mono text-[#A1A1AA]">
                    <span>Status: Pending Dispatch</span>
                    <span>Auto-checking for driver updates...</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA] space-y-2">
              <Package size={28} className="mx-auto text-[#A1A1AA]/40" />
              <p className="text-sm font-bold text-white">Select an order to track</p>
              <p className="text-xs text-[#A1A1AA]">
                Choose an active shipment from the list on the left.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-xs text-[#A1A1AA]">Loading tracking...</div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}
