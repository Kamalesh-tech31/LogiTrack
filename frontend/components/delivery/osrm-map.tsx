"use client";

import { useEffect, useState, useRef } from "react";
import {
  Map,
  MapMarker,
  MarkerContent,
  MapRoute,
  MarkerPopup,
  type MapRef,
} from "@/components/ui/map";
import { Loader2, Clock, Route } from "lucide-react";
import { MapPin, Navigation } from "lucide-react";

interface RouteData {
  coordinates: [number, number][];
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

export function OsrmMap({
  waypoints,
}: {
  waypoints: Waypoint[];
}) {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [webglError, setWebglError] = useState(false);
  const mapRef = useRef<MapRef>(null);

  useEffect(() => {
    // Check WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) setWebglError(true);
    } catch (e) {
      setWebglError(true);
    }

    async function fetchRoutes() {
      if (!waypoints || waypoints.length < 2) return;
      setIsLoading(true);
      try {
        const coordsStr = waypoints.map((wp) => `${wp.lng},${wp.lat}`).join(";");
        // OSRM does not support alternatives=true for > 2 coordinates.
        const alternatives = waypoints.length === 2 ? "true" : "false";
        
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&alternatives=${alternatives}`
        );
        const data = await response.json();

        if (data.routes?.length > 0) {
          const routeData: RouteData[] = data.routes.map(
            (route: {
              geometry: { coordinates: [number, number][] };
              duration: number;
              distance: number;
            }) => ({
              coordinates: route.geometry.coordinates,
              duration: route.duration,
              distance: route.distance,
            })
          );
          setRoutes(routeData);

          // Fit bounds to the first route
          if (mapRef.current && routeData[0].coordinates.length > 0) {
            const coords = routeData[0].coordinates;
            const minLng = Math.min(...coords.map((p) => p[0]));
            const maxLng = Math.max(...coords.map((p) => p[0]));
            const minLat = Math.min(...coords.map((p) => p[1]));
            const maxLat = Math.max(...coords.map((p) => p[1]));
            const bounds: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];

            const fit = () => {
              try {
                mapRef.current?.resize(); // Force map to recalculate dimensions
                mapRef.current?.fitBounds(bounds, { padding: 50, duration: 1000 });
              } catch (e) {
                console.warn("fitBounds failed", e);
              }
            };

            if (mapRef.current.isStyleLoaded()) {
              fit();
            } else {
              mapRef.current.once("styledata", fit);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch routes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRoutes();
  }, [waypoints]);

  // Sort routes: non-selected first, selected last (renders on top)
  const sortedRoutes = routes
    .map((route, index) => ({ route, index }))
    .sort((a, b) => {
      if (a.index === selectedIndex) return 1;
      if (b.index === selectedIndex) return -1;
      return 0;
    });

  const center: [number, number] = waypoints.length >= 2 
    ? [(waypoints[0].lng + waypoints[waypoints.length - 1].lng) / 2, (waypoints[0].lat + waypoints[waypoints.length - 1].lat) / 2]
    : [80.27, 13.08];

  if (webglError) {
    return (
      <div className="h-full min-h-[400px] w-full flex flex-col items-center justify-center p-6 text-center bg-zinc-900 border border-red-900 rounded-xl">
        <h3 className="text-red-500 font-bold text-lg mb-2">WebGL is Disabled</h3>
        <p className="text-zinc-300 max-w-md">
          The <code className="bg-black px-1 rounded">mapcn.dev</code> library uses MapLibre GL, which requires <strong>Hardware Acceleration (WebGL)</strong> to render.
        </p>
        <p className="text-zinc-400 text-sm mt-4">
          Please enable Hardware Acceleration in your browser settings, or switch back to the Leaflet (2D) map.
        </p>
      </div>
    );
  }

  const rasterStyle = {
    version: 8,
    sources: {
      osm: {
        type: "raster",
        tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "osm",
        type: "raster",
        source: "osm",
      },
    ],
  };

  return (
    <div className="h-full min-h-[400px] w-full relative">
      <Map
        ref={mapRef}
        className="absolute inset-0"
        center={center}
        zoom={13}
        styles={{
          light: rasterStyle as any,
          dark: rasterStyle as any,
        }}
      >
        {sortedRoutes.map(({ route, index }) => {
          const isSelected = index === selectedIndex;
          return (
            <MapRoute
              key={index}
              coordinates={route.coordinates}
              color={isSelected ? "#3b82f6" : "#94a3b8"}
              width={isSelected ? 5 : 4}
              opacity={isSelected ? 1 : 0.6}
              onClick={() => setSelectedIndex(index)}
            />
          );
        })}

        {waypoints.map((wp, i) => {
          const isStart = i === 0;
          const isEnd = i === waypoints.length - 1;

          return (
            <MapMarker key={i} longitude={wp.lng} latitude={wp.lat}>
              <MarkerContent>
                {isStart ? (
                  <div className="relative flex items-center justify-center bg-blue-500 rounded-full p-2 border-2 border-white shadow-lg animate-pulse">
                    <Navigation className="text-white h-4 w-4" />
                  </div>
                ) : isEnd ? (
                  <div className="relative -mt-6">
                    <MapPin className="text-red-600 fill-red-100 h-8 w-8 drop-shadow-md" />
                  </div>
                ) : (
                  <div className="relative -mt-6">
                    <MapPin className="text-amber-500 fill-amber-100 h-6 w-6 drop-shadow-md" />
                  </div>
                )}
              </MarkerContent>
              <MarkerPopup>
                <p className="font-medium text-sm text-foreground">
                  {wp.name || (isStart ? "Your Location" : `Stop ${i}`)}
                </p>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>

      {routes.length > 0 && (
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {routes.map((route, index) => {
            const isActive = index === selectedIndex;
            const isFastest = index === 0;
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex flex-col items-start gap-1 p-2.5 rounded-xl border text-sm transition-all shadow-sm ${
                  isActive
                    ? "bg-blue-600 text-white border-blue-700"
                    : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className={`h-4 w-4 ${isActive ? "text-blue-200" : "text-slate-500"}`} />
                  <span className="font-semibold">
                    {formatDuration(route.duration)}
                  </span>
                  {isFastest && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-blue-800 text-blue-100"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      Fastest
                    </span>
                  )}
                </div>
                <div className={`flex items-center gap-2 text-xs ${isActive ? "text-blue-100" : "text-slate-500"}`}>
                  <Route className="h-3 w-3" />
                  {formatDistance(route.distance)} route
                </div>
              </button>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20 backdrop-blur-sm rounded-xl">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
}
