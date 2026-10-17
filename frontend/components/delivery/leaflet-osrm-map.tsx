"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, Clock, Route, Maximize, Minimize } from "lucide-react";

interface RouteData {
  coordinates: [number, number][]; // [lat, lng] for Leaflet
  duration: number; // seconds
  distance: number; // meters
}

export type Waypoint = { lng: number; lat: number; name?: string };

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Map Bounds updater component
function BoundsUpdater({ routes }: { routes: RouteData[] }) {
  const map = useMap();
  useEffect(() => {
    if (routes.length > 0 && routes[0].coordinates.length > 0) {
      const bounds = L.latLngBounds(routes[0].coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [routes, map]);
  return null;
}

export function LeafletOsrmMap({ waypoints }: { waypoints: Waypoint[] }) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Custom icons
  const createIcon = (color: string) =>
    L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: ${color}; width: 1.5rem; height: 1.5rem; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

  const blueIcon = createIcon("#3b82f6");
  const redIcon = createIcon("#dc2626");
  const amberIcon = createIcon("#f59e0b");

  useEffect(() => {
    async function fetchRoutes() {
      if (!waypoints || waypoints.length < 2) return;
      setIsLoading(true);
      try {
        const coordsStr = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(";");
        const alternatives = waypoints.length === 2 ? "true" : "false";
        
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=${alternatives}`
        );
        const data = await response.json();

        if (data.routes?.length > 0) {
          const routeData: RouteData[] = data.routes.map(
            (route: any) => ({
              // Leaflet uses [lat, lng], but OSRM returns [lng, lat]
              coordinates: route.geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]),
              duration: route.duration,
              distance: route.distance,
            })
          );
          setRoutes(routeData);
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, [waypoints]);

  const center: [number, number] = waypoints.length >= 2 
    ? [(waypoints[0].lat + waypoints[waypoints.length - 1].lat) / 2, (waypoints[0].lng + waypoints[waypoints.length - 1].lng) / 2]
    : [13.08, 80.27];

  return (
    <div 
      className={
        isFullscreen 
          ? "fixed inset-0 z-[9999] bg-[#0b0b0b]" 
          : "h-full min-h-[400px] w-full relative"
      }
    >
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: "100%", width: "100%", minHeight: "400px", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <BoundsUpdater routes={routes} />

        {routes.map((route, index) => {
          const isSelected = index === selectedIndex;
          return (
            <Polyline
              key={index}
              positions={route.coordinates}
              color={isSelected ? "#F97316" : "#94a3b8"}
              weight={isSelected ? 6 : 4}
              opacity={isSelected ? 0.9 : 0.5}
              eventHandlers={{
                click: () => setSelectedIndex(index),
              }}
            />
          );
        })}

        {waypoints.map((wp, i) => {
          const isStart = i === 0;
          const isEnd = i === waypoints.length - 1;
          const icon = isStart ? blueIcon : isEnd ? redIcon : amberIcon;
          const label = wp.name || (isStart ? "Your Location" : isEnd ? "Final Destination" : `Stop ${i}`);

          return (
            <Marker key={i} position={[wp.lat, wp.lng]} icon={icon}>
              <Popup>{label}</Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {routes.length > 0 && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-[1000]">
          {routes.map((route, index) => {
            const isActive = index === selectedIndex;
            const isFastest = index === 0;
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-sm transition-all shadow-md ${
                  isActive
                    ? "bg-[#F97316] text-white border-[#EA580C]"
                    : "bg-[#1A1B1E] text-[#E4E4E7] border-[#2A2B30] hover:bg-[#25262B]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isActive ? "text-orange-100" : "text-[#A1A1AA]"}`} />
                  <span className="font-semibold">
                    {formatDuration(route.duration)}
                  </span>
                  {isFastest && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-[#C2410C] text-orange-100"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      Fastest
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-xs ${isActive ? "text-orange-100" : "text-[#A1A1AA]"}`}>
                  <Route className="h-3 w-3" />
                  {formatDistance(route.distance)} route
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="absolute top-3 right-3 z-[1000] p-2 bg-[#1A1B1E] rounded-xl shadow-md text-[#E4E4E7] hover:bg-[#25262B] transition-colors border border-[#2A2B30] cursor-pointer"
        title={isFullscreen ? "Exit Fullscreen" : "Maximize Map"}
      >
        {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
      </button>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-[2000] backdrop-blur-sm rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-[#F97316]" />
        </div>
      )}
    </div>
  );
}
