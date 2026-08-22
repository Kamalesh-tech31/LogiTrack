"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeliveryMap } from "@/components/customer/delivery-map";
import {
  fetchDeliveryByOrderId,
  fetchCustomerOrders as fetchOrders,
  fetchLatestLocationUpdate,
} from "@/lib/api";
import { Package, Truck, CheckCircle, MapPin, RefreshCw } from "lucide-react";

const statusConfig = {
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle,
  },
  shipped: {
    label: "Shipped",
    color: "bg-blue-500/10 text-blue-600",
    icon: Truck,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-600",
    icon: Package,
  },
};

type TrackingOrder = {
  id: string;
  customer: string;
  status: string;
  amount: number;
  date: string;
  sequenceOrder?: number;
};

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

  const normalizeOrder = (order: any, index: number): TrackingOrder => ({
    id: String(order.id || order._id || order.orderId || `order-${index}`),
    customer:
      order.customer ||
      order.customerName ||
      order.customer_name ||
      "Unknown customer",
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
    sequenceOrder: order.sequenceOrder,
  });

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

    loadOrders();
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
          "User-Agent": "Devfusion-LogiTrack/1.0",
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
        } catch (updateError) {
          console.warn(
            "Unable to fetch latest driver location update:",
            updateError,
          );
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

    loadDeliveryRoute();
  }, [selectedOrderId, refreshKey]);

  const activeOrders = orders.filter((order) => order.status !== "delivered");
  const selectedOrder =
    activeOrders.find((order) => order.id === selectedOrderId) ||
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

  const refreshTracking = async () => {
    if (selectedOrderId) {
      setRefreshKey((value) => value + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Order Tracking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Track your orders in real-time with live delivery updates
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h2 className="font-semibold text-foreground">Active Orders</h2>
          {loadingOrders ? (
            <Card className="border-none shadow-sm">
              <CardContent className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  Loading orders...
                </p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-foreground">
                  Unable to load orders
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{error}</p>
              </CardContent>
            </Card>
          ) : activeOrders.length > 0 ? (
            activeOrders.map((order) => {
              const status = statusConfig[
                order.status as keyof typeof statusConfig
              ] || {
                label:
                  order.status?.charAt(0).toUpperCase() +
                    order.status?.slice(1) || "Unknown",
                color: "bg-slate-100 text-slate-700",
                icon: Package,
              };
              const StatusIcon = status.icon;
              const isSelected = order.id === selectedOrder?.id;
              return (
                <Card
                  key={order.id}
                  className={`cursor-pointer border-none shadow-sm transition-all hover:shadow-md ${
                    isSelected ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          Order #{order.id}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {order.customer}
                        </p>
                      </div>
                      <Badge
                        className={`gap-1.5 ${status.color}`}
                        variant="secondary"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(order.date).toLocaleDateString()}
                      </span>
                      <span className="font-semibold">
                        ₹{order.amount.toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
                <p className="mt-3 font-medium text-foreground">
                  All orders delivered
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No active orders to track
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          {selectedOrder ? (
            <>
              <Card className="border-none shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Order #{selectedOrder.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedOrder.customer}
                      </p>
                      {selectedOrder.sequenceOrder && selectedOrder.sequenceOrder > 1 && (
                        <p className="text-xs font-medium text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded-full inline-block border border-amber-200">
                          Your order is stop #{selectedOrder.sequenceOrder} on the route.
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={refreshTracking}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTracking ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-sm text-muted-foreground">
                        Loading latest delivery location...
                      </p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-lg font-medium text-foreground">
                        Unable to load delivery location
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {error}
                      </p>
                    </div>
                  ) : deliveryRoute ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                          <MapPin className="h-4 w-4" />
                          <p>Delivery partner location</p>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-foreground">
                          {deliveryRoute.currentPosition?.formattedAddress ||
                            deliveryRoute.currentPosition?.displayName ||
                            "Current driver location"}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {deliveryRoute.currentPosition?.city
                            ? `${deliveryRoute.currentPosition.city}, ${deliveryRoute.currentPosition.state}`
                            : deliveryRoute.currentPosition?.formattedAddress ||
                              "Address details are not available yet."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-5">
                        <p className="text-sm text-[#A1A1AA]">
                          Delivery destination
                        </p>
                        <p className="mt-3 text-lg font-semibold text-foreground">
                          {deliveryRoute.destination?.name ||
                            deliveryRoute.destination?.formattedAddress ||
                            selectedOrder.customer}
                        </p>
                        {deliveryRoute.destination?.formattedAddress && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {deliveryRoute.destination.formattedAddress}
                          </p>
                        )}
                      </div>

                      <Card className="border-none shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <MapPin className="h-5 w-5 text-primary" />
                            Live Delivery Map
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="h-80 overflow-hidden rounded-b-lg">
                            <DeliveryMap route={customerMapRoute} />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                      <p className="text-lg font-medium text-foreground">
                        No delivery location found
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        The delivery will appear here once the driver shares a
                        live location.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-none shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-lg font-medium text-foreground">
                  Select an active order to track
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose an active order from the list on the left.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense fallback={<div className="space-y-6">Loading...</div>}>
      <TrackingContent />
    </Suspense>
  );
}
