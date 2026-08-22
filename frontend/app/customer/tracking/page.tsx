"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { DeliveryMap } from "@/components/customer/delivery-map";
import {
  fetchDeliveryByOrderId,
  fetchCustomerOrders as fetchOrders,
  fetchLatestLocationUpdate,
} from "@/lib/api";
import { Package, Truck, CheckCircle2, MapPin, RefreshCw, Copy, Check, Navigation, AlertCircle } from "lucide-react";

const statusConfig = {
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle2,
  },
  shipped: {
    label: "In Transit",
    color: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    icon: Truck,
  },
  pending: {
    label: "Processing",
    color: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
    icon: Package,
  },
};

type TrackingOrder = {
  id: string;
  customer: string;
  status: string;
  amount: number;
  date: string;
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
  }, []);

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

    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${currentPosition.lng},${currentPosition.lat};${destination.lng},${destination.lat}?overview=false&geometries=geojson`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "LogiTrack/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Unable to calculate distance/time");
    }

    const data = await response.json();
    if (!data.routes || data.routes.length === 0) {
      throw new Error("Route not available");
    }

    const route = data.routes[0];
    return {
      distance: Math.round((route.distance / 1000) * 10) / 10,
      duration: Math.round(route.duration / 60),
    };
  };

  useEffect(() => {
    const loadDeliveryRoute = async () => {
      if (!selectedOrderId) {
        setDeliveryRoute(null);
        setRouteInfo(null);
        return;
      }

      setLoadingTracking(true);
      setError(null);

      try {
        const deliveryData = await fetchDeliveryByOrderId(selectedOrderId);
        let currentPosition = deliveryData.currentPosition;

        try {
          const latestUpdate = await fetchLatestLocationUpdate(selectedOrderId);
          if (
            latestUpdate &&
            typeof latestUpdate.latitude === "number" &&
            typeof latestUpdate.longitude === "number"
          ) {
            currentPosition = {
              lat: latestUpdate.latitude,
              lng: latestUpdate.longitude,
              displayName: latestUpdate.displayName,
              formattedAddress: latestUpdate.formattedAddress,
              city: latestUpdate.city,
              state: latestUpdate.state,
              country: latestUpdate.country,
            };
          }
        } catch {
          // fallback to initial position
        }

        const routeSummary = await fetchRouteSummary(
          currentPosition,
          deliveryData.destination,
        );

        setDeliveryRoute({
          ...deliveryData,
          currentPosition,
        });
        setRouteInfo(routeSummary);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load delivery tracking data",
        );
        setDeliveryRoute(null);
        setRouteInfo(null);
      } finally {
        setLoadingTracking(false);
      }
    };

    void loadDeliveryRoute();
  }, [selectedOrderId, refreshKey]);

  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const selectedOrder =
    activeOrders.find((order) => order.id === selectedOrderId) ||
    orders.find((order) => order.id === selectedOrderId) ||
    activeOrders[0] ||
    null;

  const customerMapRoute = deliveryRoute
    ? {
        origin: deliveryRoute.currentPosition,
        destination: deliveryRoute.destination,
        currentPosition: deliveryRoute.currentPosition,
        waypoints: deliveryRoute.waypoints || [],
      }
    : undefined;

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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Customer-Friendly Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Live Tracking
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Track Your Order
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Monitor your shipment with live GPS telemetry, estimated delivery times, and driver milestones.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Active Orders Selector */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Active Shipments
          </h2>

          {loadingOrders ? (
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 text-center text-xs text-[#A1A1AA]">
              Loading active orders...
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-2">
              <AlertCircle size={20} className="mx-auto text-red-400" />
              <p className="text-xs text-red-300 font-medium">{error}</p>
            </div>
          ) : activeOrders.length > 0 ? (
            activeOrders.map((order) => {
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
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
              <p className="text-sm font-bold text-white">All orders fulfilled</p>
              <p className="text-xs text-[#A1A1AA]">No pending deliveries right now.</p>
            </div>
          )}
        </div>

        {/* Right Column: Live Map & Milestones */}
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
                      <span>{selectedOrder.id ? `#${selectedOrder.id.slice(-6)}` : "COPY"}</span>
                      {copiedId === selectedOrder.id ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
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
                  <RefreshCw size={13} className={loadingTracking ? "animate-spin" : ""} />
                  <span>Refresh GPS</span>
                </button>
              </div>

              {/* Status / Telemetry Cards */}
              {loadingTracking ? (
                <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-xs text-[#A1A1AA]">
                  Connecting to live delivery telemetry...
                </div>
              ) : error ? (
                <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-8 text-center space-y-2">
                  <Navigation size={24} className="mx-auto text-[#F97316]" />
                  <p className="text-sm font-bold text-white">Live Telemetry Pending</p>
                  <p className="text-xs text-[#A1A1AA] max-w-md mx-auto">
                    Live GPS coordinates will activate automatically once your delivery driver begins the route.
                  </p>
                </div>
              ) : deliveryRoute ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <MapPin className="h-4 w-4 text-[#F97316]" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Driver Location</span>
                      </div>
                      <p className="mt-2 text-base font-bold text-white font-display">
                        {deliveryRoute.currentPosition?.formattedAddress ||
                          deliveryRoute.currentPosition?.displayName ||
                          "In Transit"}
                      </p>
                      <p className="mt-1 text-xs text-[#A1A1AA]">
                        {deliveryRoute.currentPosition?.city
                          ? `${deliveryRoute.currentPosition.city}, ${deliveryRoute.currentPosition.state}`
                          : "Location updated recently"}
                      </p>
                    </div>

                    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm">
                      <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                        <Truck className="h-4 w-4 text-[#FDBA74]" />
                        <span className="font-semibold uppercase tracking-wider text-[10px]">Destination</span>
                      </div>
                      <p className="mt-2 text-base font-bold text-white font-display">
                        {deliveryRoute.destination?.name ||
                          deliveryRoute.destination?.formattedAddress ||
                          selectedOrder.customer}
                      </p>
                      {deliveryRoute.destination?.formattedAddress && (
                        <p className="mt-1 text-xs text-[#A1A1AA]">
                          {deliveryRoute.destination.formattedAddress}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Map Container */}
                  <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#2A2B30]/60 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
                        <MapPin size={15} className="text-[#F97316]" />
                        <span>Live Delivery Map</span>
                      </h3>
                      {routeInfo && (
                        <div className="flex items-center gap-3 text-xs font-mono text-[#FDBA74]">
                          <span>{routeInfo.distance} km</span>
                          <span>•</span>
                          <span>~{routeInfo.duration} mins</span>
                        </div>
                      )}
                    </div>
                    <div className="h-80 overflow-hidden">
                      <DeliveryMap route={customerMapRoute} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA] space-y-2">
                  <Navigation size={28} className="mx-auto text-[#F97316]/50" />
                  <p className="text-sm font-bold text-white">Live Tracking Standby</p>
                  <p className="text-xs text-[#A1A1AA]">
                    Live telemetry will start as soon as dispatch assigns a route partner.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA] space-y-2">
              <Package size={28} className="mx-auto text-[#A1A1AA]/40" />
              <p className="text-sm font-bold text-white">Select an order to track</p>
              <p className="text-xs text-[#A1A1AA]">Choose an active shipment from the list on the left.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-xs text-[#A1A1AA]">Loading tracking...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
