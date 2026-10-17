"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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

export interface TwoStageRouteProps {
  agentPosition?: { lat: number; lng: number; name?: string } | null;
  warehousePosition?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null;
  customerPosition?: {
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null;
  deliveryStage?: string;
  isDelivered?: boolean;
}

// Bounds updater component that safely handles 1 point, identical points, or multiple points
function AutoFitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (!points || points.length === 0) return;

    try {
      // Check if all points are virtually identical
      const first = points[0];
      const isSingleLocation = points.every(
        (p) =>
          Math.abs(p[0] - first[0]) < 0.0001 &&
          Math.abs(p[1] - first[1]) < 0.0001,
      );

      if (isSingleLocation || points.length === 1) {
        map.setView(first, 15, { animate: false });
      } else {
        const bounds = L.latLngBounds(points);
        map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16, animate: false });
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
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
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

const createWarehouseIcon = () =>
  L.divIcon({
    className: "custom-warehouse-marker",
    html: `
      <div style="width: 34px; height: 34px; border-radius: 12px; background: #0EA5E9; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
        🏪
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

const createCustomerIcon = () =>
  L.divIcon({
    className: "custom-customer-marker",
    html: `
      <div style="width: 34px; height: 34px; border-radius: 12px; background: #10B981; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
        🏠
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  });

export default function TwoStageDeliveryMapInner({
  agentPosition,
  warehousePosition,
  customerPosition,
  deliveryStage = "TO_WAREHOUSE",
  isDelivered = false,
}: TwoStageRouteProps) {
  const [segment1Points, setSegment1Points] = useState<[number, number][]>([]);
  const [segment2Points, setSegment2Points] = useState<[number, number][]>([]);

  const vehicleIcon = useMemo(() => createVehicleIcon(), []);
  const warehouseIcon = useMemo(() => createWarehouseIcon(), []);
  const customerIcon = useMemo(() => createCustomerIcon(), []);

  // Fetch OSRM geometry for Segment 1 (Agent -> Warehouse)
  useEffect(() => {
    let cancelled = false;

    async function fetchSegment1() {
      if (
        !agentPosition ||
        !warehousePosition ||
        isNaN(agentPosition.lat) ||
        isNaN(agentPosition.lng) ||
        isNaN(warehousePosition.lat) ||
        isNaN(warehousePosition.lng)
      ) {
        setSegment1Points([]);
        return;
      }

      // Check if coordinates are identical
      const isIdentical =
        Math.abs(agentPosition.lat - warehousePosition.lat) < 0.00005 &&
        Math.abs(agentPosition.lng - warehousePosition.lng) < 0.00005;

      if (isIdentical) {
        setSegment1Points([
          [agentPosition.lat, agentPosition.lng],
          [warehousePosition.lat, warehousePosition.lng],
        ]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${agentPosition.lng},${agentPosition.lat};${warehousePosition.lng},${warehousePosition.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (!cancelled && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number],
          );
          setSegment1Points(coords);
        } else if (!cancelled) {
          setSegment1Points([
            [agentPosition.lat, agentPosition.lng],
            [warehousePosition.lat, warehousePosition.lng],
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setSegment1Points([
            [agentPosition.lat, agentPosition.lng],
            [warehousePosition.lat, warehousePosition.lng],
          ]);
        }
      }
    }

    void fetchSegment1();
    return () => {
      cancelled = true;
    };
  }, [
    agentPosition?.lat,
    agentPosition?.lng,
    warehousePosition?.lat,
    warehousePosition?.lng,
  ]);

  // Fetch OSRM geometry for Segment 2 (Warehouse -> Customer)
  useEffect(() => {
    let cancelled = false;

    async function fetchSegment2() {
      if (
        !warehousePosition ||
        !customerPosition ||
        isNaN(warehousePosition.lat) ||
        isNaN(warehousePosition.lng) ||
        isNaN(customerPosition.lat) ||
        isNaN(customerPosition.lng)
      ) {
        setSegment2Points([]);
        return;
      }

      // Check if coordinates are identical
      const isIdentical =
        Math.abs(warehousePosition.lat - customerPosition.lat) < 0.00005 &&
        Math.abs(warehousePosition.lng - customerPosition.lng) < 0.00005;

      if (isIdentical) {
        setSegment2Points([
          [warehousePosition.lat, warehousePosition.lng],
          [customerPosition.lat, customerPosition.lng],
        ]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${warehousePosition.lng},${warehousePosition.lat};${customerPosition.lng},${customerPosition.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (!cancelled && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number],
          );
          setSegment2Points(coords);
        } else if (!cancelled) {
          setSegment2Points([
            [warehousePosition.lat, warehousePosition.lng],
            [customerPosition.lat, customerPosition.lng],
          ]);
        }
      } catch (err) {
        if (!cancelled) {
          setSegment2Points([
            [warehousePosition.lat, warehousePosition.lng],
            [customerPosition.lat, customerPosition.lng],
          ]);
        }
      }
    }

    void fetchSegment2();
    return () => {
      cancelled = true;
    };
  }, [
    warehousePosition?.lat,
    warehousePosition?.lng,
    customerPosition?.lat,
    customerPosition?.lng,
  ]);

  // Raw coordinate points for bounds fitting
  const allPoints = useMemo(() => {
    const pts: [number, number][] = [];
    if (agentPosition?.lat != null && agentPosition?.lng != null) {
      pts.push([agentPosition.lat, agentPosition.lng]);
    }
    if (warehousePosition?.lat != null && warehousePosition?.lng != null) {
      pts.push([warehousePosition.lat, warehousePosition.lng]);
    }
    if (customerPosition?.lat != null && customerPosition?.lng != null) {
      pts.push([customerPosition.lat, customerPosition.lng]);
    }
    return pts;
  }, [agentPosition, warehousePosition, customerPosition]);

  // Visual marker positions: if points are identical or overlapping, offset slightly for visual clarity
  const { visualAgent, visualWarehouse, visualCustomer } = useMemo(() => {
    let a = agentPosition ? { ...agentPosition } : null;
    let w = warehousePosition ? { ...warehousePosition } : null;
    let c = customerPosition ? { ...customerPosition } : null;

    const areOverlap = (
      p1: { lat: number; lng: number } | null,
      p2: { lat: number; lng: number } | null,
    ) => {
      if (!p1 || !p2) return false;
      return (
        Math.abs(p1.lat - p2.lat) < 0.00015 &&
        Math.abs(p1.lng - p2.lng) < 0.00015
      );
    };

    const awOverlap = areOverlap(a, w);
    const wcOverlap = areOverlap(w, c);
    const acOverlap = areOverlap(a, c);

    if (a && w && c && awOverlap && wcOverlap) {
      // All 3 locations are identical! Offset agent to top-left and customer to bottom-right
      return {
        visualAgent: { ...a, lat: a.lat + 0.00015, lng: a.lng - 0.00015 },
        visualWarehouse: w,
        visualCustomer: { ...c, lat: c.lat - 0.00015, lng: c.lng + 0.00015 },
      };
    }

    if (a && w && awOverlap) {
      return {
        visualAgent: { ...a, lat: a.lat + 0.00012, lng: a.lng - 0.00012 },
        visualWarehouse: w,
        visualCustomer: c,
      };
    }

    if (w && c && wcOverlap) {
      return {
        visualAgent: a,
        visualWarehouse: w,
        visualCustomer: { ...c, lat: c.lat - 0.00012, lng: c.lng + 0.00012 },
      };
    }

    if (a && c && acOverlap) {
      return {
        visualAgent: { ...a, lat: a.lat + 0.00012, lng: a.lng - 0.00012 },
        visualWarehouse: w,
        visualCustomer: { ...c, lat: c.lat - 0.00012, lng: c.lng + 0.00012 },
      };
    }

    return {
      visualAgent: a,
      visualWarehouse: w,
      visualCustomer: c,
    };
  }, [agentPosition, warehousePosition, customerPosition]);

  // Smooth Marker Animation when stage transitions occur
  const [animatedAgentPos, setAnimatedAgentPos] = useState<{
    lat: number;
    lng: number;
  } | null>(visualAgent ? { lat: visualAgent.lat, lng: visualAgent.lng } : null);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!visualAgent) {
      setAnimatedAgentPos(null);
      prevPosRef.current = null;
      return;
    }

    const prev = prevPosRef.current;
    if (!prev) {
      setAnimatedAgentPos(visualAgent);
      prevPosRef.current = visualAgent;
      return;
    }

    const dLat = visualAgent.lat - prev.lat;
    const dLng = visualAgent.lng - prev.lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng);

    // If movement is negligible or identical, set directly
    if (dist < 0.00003) {
      setAnimatedAgentPos(visualAgent);
      prevPosRef.current = visualAgent;
      return;
    }

    // Smooth ease-out animation over 1000ms
    const startTime = performance.now();
    const duration = 1000;
    const startLat = prev.lat;
    const startLng = prev.lng;
    const endLat = visualAgent.lat;
    const endLng = visualAgent.lng;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);

      const curLat = startLat + (endLat - startLat) * ease;
      const curLng = startLng + (endLng - startLng) * ease;

      setAnimatedAgentPos({ lat: curLat, lng: curLng });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevPosRef.current = visualAgent;
      }
    };

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [visualAgent?.lat, visualAgent?.lng]);

  const defaultCenter: [number, number] =
    allPoints.length > 0 ? allPoints[0] : [13.0827, 80.2707];

  const isStage1Active =
    deliveryStage === "TO_WAREHOUSE" || deliveryStage === "UNCLAIMED";
  const isStage2Active =
    deliveryStage === "TO_CUSTOMER" ||
    deliveryStage === "AT_WAREHOUSE";
  const isAtCustomer =
    deliveryStage === "AT_CUSTOMER" ||
    deliveryStage === "OTP_REQUESTED";

  const currentMarkerPos = animatedAgentPos || visualAgent;

  return (
    <div className="relative h-full w-full min-h-[360px] bg-[#111214] rounded-2xl overflow-hidden">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{
          height: "100%",
          width: "100%",
          minHeight: "360px",
          zIndex: 0,
        }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoFitBounds points={allPoints} />

        {/* Segment 1 Polyline: Agent -> Warehouse (Orange) */}
        {segment1Points.length > 0 && (
          <Polyline
            positions={segment1Points}
            color="#F97316"
            weight={isStage1Active ? 6 : 3}
            opacity={isStage1Active ? 0.95 : 0.4}
            dashArray={isStage1Active ? undefined : "6, 8"}
          />
        )}

        {/* Segment 2 Polyline: Warehouse -> Customer (Green) */}
        {segment2Points.length > 0 && (
          <Polyline
            positions={segment2Points}
            color="#10B981"
            weight={isStage2Active || isDelivered ? 6 : 4}
            opacity={isStage2Active || isDelivered ? 0.95 : 0.45}
            dashArray={isStage2Active || isDelivered ? undefined : "6, 8"}
          />
        )}

        {/* Agent Vehicle Marker */}
        {currentMarkerPos && (
          <Marker
            position={[currentMarkerPos.lat, currentMarkerPos.lng]}
            icon={vehicleIcon}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-[#F97316]">
                  🛵 {agentPosition?.name || "Delivery Partner"}
                </p>
                <p className="text-gray-600 mt-0.5">
                  {isStage1Active
                    ? "En route to Merchant Warehouse"
                    : isAtCustomer
                      ? "Arrived at Customer Location"
                      : isStage2Active
                        ? "En route to Customer Delivery"
                        : isDelivered
                          ? "Delivery Completed"
                          : "In Transit"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Warehouse Marker */}
        {visualWarehouse && (
          <Marker
            position={[visualWarehouse.lat, visualWarehouse.lng]}
            icon={warehouseIcon}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-sky-600">
                  🏪 {warehousePosition?.name || "Merchant Warehouse"}
                </p>
                <p className="text-gray-600 mt-0.5">
                  {warehousePosition?.address || "Pickup Location"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Customer Destination Marker */}
        {visualCustomer && (
          <Marker
            position={[visualCustomer.lat, visualCustomer.lng]}
            icon={customerIcon}
          >
            <Popup>
              <div className="text-xs font-sans">
                <p className="font-bold text-emerald-600">
                  🏠 {customerPosition?.name || "Customer Destination"}
                </p>
                <p className="text-gray-600 mt-0.5">
                  {customerPosition?.address || "Delivery Drop-off"}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Route Legend Box */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-[#111214]/90 backdrop-blur-md border border-[#2A2B30] rounded-xl p-3 text-[11px] font-mono text-white shadow-xl space-y-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-1.5 rounded-full bg-[#F97316]"></span>
          <span
            className={
              isStage1Active ? "text-[#FDBA74] font-bold" : "text-[#A1A1AA]"
            }
          >
            Route 1: Agent &rarr; Warehouse {isStage1Active ? "(Active)" : "(Completed)"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-1.5 rounded-full bg-[#10B981]"></span>
          <span
            className={
              isStage2Active ? "text-emerald-400 font-bold" : "text-[#A1A1AA]"
            }
          >
            Route 2: Warehouse &rarr; Customer{" "}
            {isStage2Active
              ? "(Active)"
              : isStage1Active
                ? "(Pending)"
                : "(Completed)"}
          </span>
        </div>
      </div>
    </div>
  );
}
