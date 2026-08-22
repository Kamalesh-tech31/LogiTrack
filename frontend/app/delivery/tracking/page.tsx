"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MapPin, Navigation, Compass, Radio, Map, RotateCcw } from "lucide-react";

import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import { DeliveryMap } from "@/components/customer/delivery-map";
import { fetchDashboard, saveLocationUpdate } from "@/lib/api";

interface LocationDetails {
  displayName: string;
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  source: "manual" | "browser";
  timestamp: string;
}

interface RouteInfo {
  distance: number;
  duration: number;
  polyline: string;
}

export default function TrackingPage() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationDetails, setLocationDetails] =
    useState<LocationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoute, setActiveRoute] = useState<DeliveryRecord | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const destinationName =
    activeRoute?.address || activeRoute?.customer || "Customer destination";

  const deliveryMapRoute =
    activeRoute &&
    typeof activeRoute.latitude === "number" &&
    typeof activeRoute.longitude === "number"
      ? {
          origin:
            locationDetails != null
              ? {
                  lat: locationDetails.latitude,
                  lng: locationDetails.longitude,
                  name: locationDetails.displayName,
                }
              : undefined,
          destination: {
            lat: activeRoute.latitude,
            lng: activeRoute.longitude,
            name: destinationName,
          },
          currentPosition:
            locationDetails != null
              ? {
                  lat: locationDetails.latitude,
                  lng: locationDetails.longitude,
                  name: locationDetails.displayName,
                }
              : undefined,
          waypoints:
            locationDetails != null
              ? [
                  {
                    lat: locationDetails.latitude,
                    lng: locationDetails.longitude,
                  },
                  {
                    lat: activeRoute.latitude,
                    lng: activeRoute.longitude,
                  },
                ]
              : [],
        }
      : null;

  useEffect(() => {
    let isMounted = true;

    async function loadActiveRoute() {
      try {
        const data = await fetchDashboard();

        if (isMounted) {
          if (data.activeRoutes && data.activeRoutes.length > 0) {
            setActiveRoute(data.activeRoutes[0]);
          } else {
            toast("No active deliveries. Accept an order to start tracking.", {
              icon: "ℹ️",
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error loading deliveries:", err);
          toast("Unable to load active deliveries.", {
            icon: "ℹ️",
          });
        }
      }
    }

    void loadActiveRoute();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchRoute = async (
    agentLat: number,
    agentLon: number,
    customerLat: number,
    customerLon: number,
  ) => {
    const routeUrl = `https://router.project-osrm.org/route/v1/driving/${agentLon},${agentLat};${customerLon},${customerLat}?overview=false&geometries=geojson&steps=true`;
    try {
      const response = await fetch(routeUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "Devfusion-LogiTrack/1.0",
        },
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        console.error("OSRM route failed", response.status, body, routeUrl);
        toast.error("Route calculation failed. Showing map only.");
        setRouteInfo(null);
        return;
      }

      const data = (await response.json()) as {
        routes?: Array<{
          distance: number;
          duration: number;
          geometry?: string;
        }>;
      };

      if (!data.routes || data.routes.length === 0) {
        console.error("OSRM returned no route", data, routeUrl);
        toast.error("No route found. Showing map only.");
        setRouteInfo(null);
        return;
      }

      const route = data.routes[0];
      setRouteInfo({
        distance: Math.round((route.distance / 1000) * 10) / 10,
        duration: Math.round(route.duration / 60),
        polyline: route.geometry || "",
      });
    } catch (error) {
      console.error("Route error:", error);
      toast.error("Unable to calculate route");
    }
  };

  const resolveLocation = async (
    lat: number,
    lon: number,
    source: "manual" | "browser",
  ) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Devfusion-LogiTrack/1.0",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding request failed");
      }

      const data = (await response.json()) as {
        display_name?: string;
        address?: {
          city?: string;
          town?: string;
          village?: string;
          state?: string;
          country?: string;
          postcode?: string;
          neighbourhood?: string;
        };
      };

      const address = data.address ?? {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.neighbourhood ||
        "Unknown city";
      const state = address.state || "Unknown state";
      const country = address.country || "Unknown country";
      const postalCode = address.postcode || "N/A";

      const result: LocationDetails = {
        displayName: data.display_name || `${city}, ${state}`,
        formattedAddress: `${city}, ${state}, ${country}${
          postalCode !== "N/A" ? ` ${postalCode}` : ""
        }`,
        city,
        state,
        country,
        postalCode,
        latitude: lat,
        longitude: lon,
        source,
        timestamp: new Date().toLocaleString(),
      };

      setLocationDetails(result);

      if (!activeRoute) {
        toast.success("Location resolved!");
        setShowMap(true);
        return;
      }

      setShowMap(true);

      if (
        activeRoute.latitude &&
        activeRoute.longitude &&
        typeof activeRoute.latitude === "number" &&
        typeof activeRoute.longitude === "number"
      ) {
        await fetchRoute(lat, lon, activeRoute.latitude, activeRoute.longitude);
        toast.success("Location resolved and route calculated!");
      } else {
        toast(
          "Delivery address coordinates not available. Showing your location only.",
          {
            icon: "ℹ️",
          },
        );
      }

      await saveLocationUpdate({
        deliveryId: activeRoute.id,
        latitude: lat,
        longitude: lon,
        source,
        displayName: result.displayName,
        formattedAddress: result.formattedAddress,
        city: result.city,
        state: result.state,
        country: result.country,
        postalCode: result.postalCode,
        timestamp: result.timestamp,
      });
    } catch (error) {
      console.error("Location resolution error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to resolve this location. Check the coordinates and try again.",
      );
      setLocationDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateLocation = async () => {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (!latitude || !longitude) {
      toast.error("Please enter both latitude and longitude.");
      return;
    }

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      toast.error("Latitude and longitude must be valid numbers.");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error(
        "Coordinates are out of range. Use valid latitude and longitude values.",
      );
      return;
    }

    setShowMap(true);
    await resolveLocation(lat, lon, "manual");
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setLatitude(lat.toFixed(6));
        setLongitude(lon.toFixed(6));
        toast.success(
          "Current location coordinates loaded. Click 'Preview Route' to update map.",
        );
      },
      () => {
        toast.error(
          "Unable to access your current location. Try entering coordinates manually.",
        );
      },
      {
        enableHighAccuracy: true,
      },
    );
  };

  const mapBbox = locationDetails
    ? `${Math.min(locationDetails.longitude, activeRoute?.longitude || locationDetails.longitude) - 0.02},${Math.min(locationDetails.latitude, activeRoute?.latitude || locationDetails.latitude) - 0.02},${Math.max(locationDetails.longitude, activeRoute?.longitude || locationDetails.longitude) + 0.02},${Math.max(locationDetails.latitude, activeRoute?.latitude || locationDetails.latitude) + 0.02}`
    : null;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
            Telemetry Stream
          </p>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Live GPS & Route Telemetry
          </h1>
          <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
            Synchronize real-time driver coordinates with the customer live tracking map and compute turn-by-turn routes.
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] px-4 py-2.5 flex items-center gap-3">
          <span className="flex h-2 w-2 rounded-full bg-[#F97316] animate-pulse" />
          <span className="text-xs text-[#A1A1AA]">Active Target:</span>
          <span className="text-xs font-bold text-white truncate max-w-44">
            {activeRoute?.customer || "No Active Target"}
          </span>
        </div>
      </div>

      {/* Main Grid: Map View + Telemetry Console */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Left Column: Interactive Map Preview */}
        <div className="rounded-3xl bg-[#1A1B1E] border border-[#2A2B30] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
              <div>
                <h2 className="text-lg font-bold text-white font-display">
                  Live Navigation Map
                </h2>
                <p className="text-xs text-[#A1A1AA] mt-0.5">
                  {locationDetails
                    ? `Resolved: ${locationDetails.city}, ${locationDetails.state}`
                    : "Awaiting coordinate telemetry"}
                </p>
              </div>

              {locationDetails && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F97316]/10 text-[#FDBA74] border border-[#F97316]/30">
                  <Radio size={12} className="animate-pulse text-[#F97316]" />
                  <span>GPS Active</span>
                </span>
              )}
            </div>

            {/* Map Box or Styled Empty Radar State */}
            <div className="mt-5 rounded-2xl border border-[#2A2B30] bg-[#111214] overflow-hidden min-h-[380px] flex flex-col items-center justify-center relative">
              {showMap && locationDetails ? (
                <div className="w-full h-full flex flex-col">
                  {/* Route Summary Pill if Available */}
                  {activeRoute && routeInfo && (
                    <div className="p-3 bg-[#1A1B1E]/90 backdrop-blur-md border-b border-[#2A2B30] flex items-center justify-around text-xs">
                      <div>
                        <span className="text-[#A1A1AA]">Est. Distance:</span>{" "}
                        <strong className="text-[#F97316] font-bold">{routeInfo.distance} km</strong>
                      </div>
                      <div className="h-3 w-px bg-[#2A2B30]" />
                      <div>
                        <span className="text-[#A1A1AA]">Duration:</span>{" "}
                        <strong className="text-[#F97316] font-bold">{routeInfo.duration} mins</strong>
                      </div>
                    </div>
                  )}

                  <div className="flex-1 w-full min-h-[340px]">
                    {deliveryMapRoute ? (
                      <DeliveryMap route={deliveryMapRoute} />
                    ) : (
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        src={
                          mapBbox
                            ? `https://www.openstreetmap.org/export/embed.html?bbox=${mapBbox}&layer=mapnik&marker=${locationDetails.latitude},${locationDetails.longitude}`
                            : `https://www.openstreetmap.org/export/embed.html?bbox=${locationDetails.longitude - 0.01},${locationDetails.latitude - 0.01},${locationDetails.longitude + 0.01}&layer=mapnik&marker=${locationDetails.latitude},${locationDetails.longitude}`
                        }
                        className="w-full h-full min-h-[340px]"
                        title="Route Map"
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 max-w-sm mx-auto space-y-3">
                  <div className="relative inline-flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center text-[#F97316] animate-pulse">
                      <Compass size={28} />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white">Awaiting Telemetry Stream</h3>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    Capture your device coordinates or input custom latitude/longitude to stream real-time telemetry to the customer map.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Location Summary Strip */}
          {locationDetails && (
            <div className="mt-4 pt-3 border-t border-[#2A2B30]/60 flex flex-wrap items-center justify-between text-xs text-[#A1A1AA] gap-2">
              <div className="flex items-center gap-1.5 text-white">
                <MapPin size={13} className="text-[#F97316]" />
                <span className="truncate max-w-md">{locationDetails.formattedAddress}</span>
              </div>
              <span className="font-mono text-[11px] text-[#A1A1AA]">{locationDetails.timestamp}</span>
            </div>
          )}
        </div>

        {/* Right Column: Coordinate Input & Telemetry Controls */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#1A1B1E] border border-[#2A2B30] p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white font-display">
                GPS Position Input
              </h2>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Set manual coordinates or trigger device geolocation
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Latitude
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12.971598"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2A2B30] focus:border-[#F97316] rounded-2xl px-4 py-3 text-xs text-white outline-none transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
                  Longitude
                </label>
                <input
                  type="text"
                  placeholder="e.g. 77.594566"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full bg-[#111214] border border-[#2A2B30] focus:border-[#F97316] rounded-2xl px-4 py-3 text-xs text-white outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] py-3 px-4 text-xs font-bold text-white shadow-[0_0_15px_rgba(249,115,22,0.3)] transition cursor-pointer disabled:opacity-50"
              >
                <Navigation size={14} />
                <span>{isLoading ? "Locating Device..." : "Use Current GPS"}</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleUpdateLocation()}
                  disabled={isLoading || !latitude || !longitude}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 py-2.5 text-xs font-semibold text-white transition cursor-pointer disabled:opacity-40"
                >
                  <Map size={13} />
                  <span>Preview Route</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setLatitude("");
                    setLongitude("");
                    setLocationDetails(null);
                    setShowMap(false);
                    setRouteInfo(null);
                  }}
                  className="px-3 rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-red-500/40 text-[#A1A1AA] hover:text-white text-xs transition cursor-pointer"
                  title="Clear telemetry"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Target Delivery Spec Card */}
            {activeRoute && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 space-y-1.5">
                <p className="text-[11px] uppercase font-semibold tracking-wider text-[#A1A1AA]">
                  Target Destination
                </p>
                <p className="text-sm font-bold text-white">{activeRoute.customer}</p>
                <p className="text-xs text-[#A1A1AA] line-clamp-2">{activeRoute.address}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
