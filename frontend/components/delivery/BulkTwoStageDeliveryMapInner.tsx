"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface BulkMapStop {
  id: string;
  orderId?: string;
  customer: string;
  lat: number;
  lng: number;
  sequenceOrder: number;
  isCompleted: boolean;
  isActive: boolean;
  address?: string;
}

export interface BulkTwoStageRouteProps {
  agentPosition?: { lat: number; lng: number; name?: string } | null;
  warehousePosition?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null;
  stops: BulkMapStop[];
  deliveryStage?: string;
}

// Safely auto-fit bounds on waypoint changes without 60fps re-render loops
function AutoFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;

    try {
      const first = points[0];
      const isSingleLocation = points.every(
        (p) =>
          Math.abs(p[0] - first[0]) < 0.0001 &&
          Math.abs(p[1] - first[1]) < 0.0001,
      );

      if (isSingleLocation || points.length === 1) {
        map.setView(first, 14, { animate: false });
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: false });
      }
    } catch (e) {
      console.warn("[Map] fitBounds error suppressed:", e);
    }
  }, [points, map]);

  return null;
}

// Custom DivIcons
const createVehicleIcon = () =>
  L.divIcon({
    className: "custom-agent-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(249, 115, 22, 0.3); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #F97316; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.5); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
          🛵
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });

const createWarehouseIcon = (isCompleted: boolean) =>
  L.divIcon({
    className: "custom-warehouse-marker",
    html: `
      <div style="width: 36px; height: 36px; border-radius: 12px; background: ${isCompleted ? "#10B981" : "#0EA5E9"}; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px ${isCompleted ? "rgba(16, 185, 129, 0.4)" : "rgba(14, 165, 233, 0.4)"}; display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
        ${isCompleted ? "✓" : "🏪"}
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });

const createCustomerStopIcon = (
  stopNum: number,
  isCompleted: boolean,
  isActive: boolean,
) => {
  const bg = isCompleted
    ? "#10B981" // Emerald for completed
    : isActive
      ? "#F97316" // Orange for active
      : "#6B7280"; // Slate for upcoming
  const shadow = isCompleted
    ? "rgba(16, 185, 129, 0.5)"
    : isActive
      ? "rgba(249, 115, 22, 0.5)"
      : "rgba(107, 114, 128, 0.3)";

  return L.divIcon({
    className: "custom-stop-marker",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: ${bg}; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px ${shadow}; display: flex; align-items: center; justify-content: center;">
          <span style="transform: rotate(45deg); font-size: 11px; font-weight: 800; color: white; font-family: monospace;">
            ${isCompleted ? "✓" : stopNum}
          </span>
        </div>
      </div>
    `,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42],
  });
};

// Road Network Geometry Fetcher using OSRM driving API with AbortSignal
async function fetchRoadGeometry(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
  signal?: AbortSignal,
): Promise<[number, number][]> {
  if (
    !p1 ||
    !p2 ||
    isNaN(Number(p1.lat)) ||
    isNaN(Number(p1.lng)) ||
    isNaN(Number(p2.lat)) ||
    isNaN(Number(p2.lng))
  ) {
    return [];
  }

  // Identical points check
  if (
    Math.abs(p1.lat - p2.lat) < 0.00005 &&
    Math.abs(p1.lng - p2.lng) < 0.00005
  ) {
    return [[p1.lat, p1.lng], [p2.lat, p2.lng]];
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${p1.lng},${p1.lat};${p2.lng},${p2.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    const data = await res.json();

    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number],
      );
    }
  } catch (err: any) {
    if (err?.name !== "AbortError") {
      console.warn("OSRM road route fetch fallback:", err);
    }
  }

  // Fallback to straight line if OSRM is unreachable
  return [[p1.lat, p1.lng], [p2.lat, p2.lng]];
}

export default function BulkTwoStageDeliveryMapInner({
  agentPosition,
  warehousePosition,
  stops,
  deliveryStage = "TO_WAREHOUSE",
}: BulkTwoStageRouteProps) {
  // Sort stops by sequenceOrder
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => (a.sequenceOrder || 1) - (b.sequenceOrder || 1)),
    [stops],
  );

  const isPickupCompleted =
    deliveryStage !== "TO_WAREHOUSE" && deliveryStage !== "UNCLAIMED";

  // Identify the active stop (first non-delivered stop)
  const activeStop = sortedStops.find((s) => !s.isCompleted);
  const allStopsCompleted = sortedStops.length > 0 && !activeStop;

  // Active Origin & Destination determination:
  // 1. If pickup in progress: Agent -> Warehouse
  // 2. If pickup completed and heading to Stop 1: Warehouse -> Stop 1
  // 3. If Stop 1 is completed and heading to Stop 2: Customer 1 (or agentPosition) -> Customer 2 (WAREHOUSE FULLY GONE)
  // 4. If Stop 2 is completed and heading to Stop 3: Customer 2 (or agentPosition) -> Customer 3 (WAREHOUSE FULLY GONE)
  // 5. If all stops completed: null (no active route)
  const activeRouteOrigin = useMemo(() => {
    if (allStopsCompleted) return null;

    if (!isPickupCompleted) {
      return agentPosition || warehousePosition;
    }

    if (!activeStop) return null;

    // If activeStop is Stop 1: origin is Warehouse
    if ((activeStop.sequenceOrder || 1) === 1) {
      return warehousePosition;
    }

    // If activeStop is Stop > 1: origin is the PREVIOUS customer stop or current agent position
    const prevStop = sortedStops.find(
      (s) => (s.sequenceOrder || 1) === (activeStop.sequenceOrder || 1) - 1,
    );
    if (prevStop) {
      return { lat: prevStop.lat, lng: prevStop.lng, name: prevStop.customer };
    }

    if (agentPosition) {
      return agentPosition;
    }

    return null;
  }, [isPickupCompleted, activeStop, sortedStops, agentPosition, warehousePosition, allStopsCompleted]);

  const activeRouteDestination = useMemo(() => {
    if (allStopsCompleted) return null;

    if (!isPickupCompleted) {
      return warehousePosition;
    }
    if (activeStop) {
      return { lat: activeStop.lat, lng: activeStop.lng, name: activeStop.customer };
    }
    return null;
  }, [isPickupCompleted, activeStop, warehousePosition, allStopsCompleted]);

  // Road geometry states
  const [activeLegRoad, setActiveLegRoad] = useState<[number, number][]>([]);
  const [upcomingLegsRoad, setUpcomingLegsRoad] = useState<Record<number, [number, number][]>>({});

  // Request-Guard for Active Road (prevents stale in-flight responses from overwriting newer routes)
  const activeRequestIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++activeRequestIdRef.current;
    const controller = new AbortController();

    if (activeRouteOrigin && activeRouteDestination && !allStopsCompleted) {
      fetchRoadGeometry(activeRouteOrigin, activeRouteDestination, controller.signal)
        .then((pts) => {
          if (reqId === activeRequestIdRef.current) {
            setActiveLegRoad(pts);
          }
        })
        .catch((err) => {
          if (err?.name !== "AbortError") {
            console.warn("Road route error:", err);
          }
        });
    } else {
      setActiveLegRoad([]);
    }

    return () => {
      controller.abort();
    };
  }, [
    activeRouteOrigin?.lat,
    activeRouteOrigin?.lng,
    activeRouteDestination?.lat,
    activeRouteDestination?.lng,
    allStopsCompleted,
  ]);

  // Request-Guard for Upcoming Inter-Customer Legs
  const upcomingRequestIdRef = useRef(0);

  useEffect(() => {
    const reqId = ++upcomingRequestIdRef.current;
    const controller = new AbortController();

    if (sortedStops.length > 1 && !allStopsCompleted) {
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const fromStop = sortedStops[i];
        const toStop = sortedStops[i + 1];

        // Only compute for upcoming legs
        if (!toStop.isCompleted) {
          fetchRoadGeometry(
            { lat: fromStop.lat, lng: fromStop.lng },
            { lat: toStop.lat, lng: toStop.lng },
            controller.signal,
          ).then((pts) => {
            if (reqId === upcomingRequestIdRef.current) {
              setUpcomingLegsRoad((prev) => ({ ...prev, [i]: pts }));
            }
          });
        }
      }
    } else {
      setUpcomingLegsRoad({});
    }

    return () => {
      controller.abort();
    };
  }, [sortedStops, allStopsCompleted]);

  // Warehouse visibility rule:
  // Visible ONLY before pickup and while en route to Stop 1.
  // Once Customer 1 is completed (or when activeStop.sequenceOrder > 1), warehouse disappears completely.
  const showWarehouseMarker =
    warehousePosition &&
    (!isPickupCompleted || (activeStop && (activeStop.sequenceOrder || 1) === 1 && !activeStop.isCompleted));

  // Static coordinate points for bounds fitting
  const allWaypoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (showWarehouseMarker && warehousePosition) {
      pts.push([warehousePosition.lat, warehousePosition.lng]);
    }
    sortedStops.forEach((s) => {
      if (s.lat && s.lng) pts.push([s.lat, s.lng]);
    });
    if (agentPosition) pts.push([agentPosition.lat, agentPosition.lng]);
    return pts;
  }, [showWarehouseMarker, warehousePosition, sortedStops, agentPosition?.lat, agentPosition?.lng]);

  const defaultCenter: [number, number] = allWaypoints[0] || [13.0827, 80.2707];

  return (
    <div className="relative h-full w-full isolate">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#111214", height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds points={allWaypoints} />

        {/* 1. Active Navigation Road Route (Replaced on each transition with dynamic key, preventing layer stacking) */}
        {activeLegRoad.length > 1 && activeRouteOrigin && activeRouteDestination && !allStopsCompleted && (
          <Polyline
            key={`active-road-leg-${activeRouteOrigin.lat.toFixed(4)}-${activeRouteOrigin.lng.toFixed(4)}-to-${activeRouteDestination.lat.toFixed(4)}-${activeRouteDestination.lng.toFixed(4)}`}
            positions={activeLegRoad}
            pathOptions={{
              color: !isPickupCompleted ? "#0EA5E9" : "#F97316",
              weight: 5,
              opacity: 0.95,
            }}
          />
        )}

        {/* 2. Upcoming Customer Legs (Dashed Lines) */}
        {sortedStops.length > 1 && !allStopsCompleted &&
          sortedStops.slice(0, -1).map((fromStop, idx) => {
            const roadPts = upcomingLegsRoad[idx];
            if (!roadPts || roadPts.length < 2) return null;

            const toStop = sortedStops[idx + 1];
            // Don't duplicate the currently active leg
            if (activeStop?.id === toStop.id) return null;

            return (
              <Polyline
                key={`upcoming-leg-${fromStop.id}-${toStop.id}`}
                positions={roadPts}
                pathOptions={{
                  color: toStop.isCompleted ? "#10B981" : "#FDBA74",
                  weight: 3,
                  dashArray: "5, 6",
                  opacity: toStop.isCompleted ? 0.4 : 0.65,
                }}
              />
            );
          })}

        {/* Warehouse Reference Marker (Shown only before Customer 1 is completed) */}
        {showWarehouseMarker && warehousePosition && (
          <Marker
            key="pickup-warehouse-marker"
            position={[warehousePosition.lat, warehousePosition.lng]}
            icon={createWarehouseIcon(isPickupCompleted)}
          >
            <Popup>
              <div className="text-xs p-1">
                <strong className="text-sky-400 font-bold block">
                  🏪 {warehousePosition.name || "Pickup Warehouse Hub"}
                </strong>
                {warehousePosition.address && (
                  <p className="text-gray-600 mt-1">
                    {warehousePosition.address}
                  </p>
                )}
                <div className="mt-1 text-[10px] font-bold uppercase">
                  {isPickupCompleted ? (
                    <span className="text-emerald-600">
                      ✓ Pickup Completed (All Packages Collected)
                    </span>
                  ) : (
                    <span className="text-sky-500">
                      🎯 Active Pickup Origin
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Stop Markers */}
        {sortedStops.map((stop, idx) => (
          <Marker
            key={`customer-stop-${stop.id}`}
            position={[stop.lat, stop.lng]}
            icon={createCustomerStopIcon(
              idx + 1,
              stop.isCompleted,
              isPickupCompleted && activeStop?.id === stop.id,
            )}
          >
            <Popup>
              <div className="text-xs p-1">
                <div className="flex items-center gap-1 font-bold">
                  <span
                    className={
                      stop.isCompleted
                        ? "text-emerald-500"
                        : isPickupCompleted && activeStop?.id === stop.id
                          ? "text-[#F97316]"
                          : "text-gray-600"
                    }
                  >
                    📍 Stop #{idx + 1}: {stop.customer}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5 font-mono">
                  Order #{stop.orderId || stop.id.slice(-4)}
                </div>
                {stop.address && (
                  <p className="text-gray-700 mt-1">{stop.address}</p>
                )}
                <div className="mt-1 text-[10px] font-bold uppercase">
                  {stop.isCompleted ? (
                    <span className="text-emerald-600">✓ Delivered</span>
                  ) : isPickupCompleted && activeStop?.id === stop.id ? (
                    <span className="text-[#F97316]">
                      🎯 Current Active Destination
                    </span>
                  ) : (
                    <span className="text-gray-500">⏳ Next in Route</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Agent Vehicle Marker */}
        {agentPosition && (
          <Marker
            key="agent-vehicle-marker"
            position={[agentPosition.lat, agentPosition.lng]}
            icon={createVehicleIcon()}
          >
            <Popup>
              <div className="text-xs p-1">
                <strong className="text-[#F97316] font-bold block">
                  🛵 {agentPosition?.name || "Your Current Location"}
                </strong>
                <span className="text-gray-500 text-[10px]">
                  Live GPS route navigation
                </span>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
