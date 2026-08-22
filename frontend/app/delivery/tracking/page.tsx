"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import { DeliveryMap } from "@/components/customer/delivery-map";
import dynamic from "next/dynamic";
const LeafletOsrmMap = dynamic(() => import("@/components/delivery/leaflet-osrm-map").then(mod => mod.LeafletOsrmMap), { ssr: false });
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
  const [activeRoutes, setActiveRoutes] = useState<DeliveryRecord[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  const destinationName =
    activeRoute?.address || activeRoute?.customer || "Customer destination";

  const waypoints = locationDetails ? [{ lat: locationDetails.latitude, lng: locationDetails.longitude, name: "Driver Location" }] : [];
  
  if (locationDetails) {
    activeRoutes.forEach((route: any, idx) => {
      let lat = Number(route.latitude);
      let lng = Number(route.longitude);
      if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        // Prevent perfect overlap by adding a tiny micro-jitter if coordinates match an existing waypoint
        while (waypoints.some((wp) => wp.lat === lat && wp.lng === lng)) {
          lat += (Math.random() - 0.5) * 0.0003; // ~15 meters jitter
          lng += (Math.random() - 0.5) * 0.0003;
        }
        waypoints.push({ 
          lat, 
          lng, 
          name: route.address ? `${route.customer || `Stop ${idx + 1}`} - ${route.address}` : (route.customer || `Stop ${idx + 1}`)
        });
      }
    });
  }

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
        // Get the dashboard which includes active deliveries assigned to this agent
        const data = await fetchDashboard();

        if (isMounted) {
          if (data.activeRoutes && data.activeRoutes.length > 0) {
            setActiveRoute(data.activeRoutes[0]);
            setActiveRoutes(data.activeRoutes);
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
        distance: Math.round((route.distance / 1000) * 10) / 10, // km
        duration: Math.round(route.duration / 60), // minutes
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

      // Calculate route if customer has coordinates
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
          "Current location coordinates loaded. Click 'Update location' to see the map.",
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

  const mapUrl = locationDetails
    ? `https://www.openstreetmap.org/?mlat=${locationDetails.latitude}&mlon=${locationDetails.longitude}#map=15/${locationDetails.latitude}/${locationDetails.longitude}`
    : "https://www.openstreetmap.org/";

  const mapBbox = locationDetails
    ? `${Math.min(locationDetails.longitude, activeRoute?.longitude || locationDetails.longitude) - 0.02},${Math.min(locationDetails.latitude, activeRoute?.latitude || locationDetails.latitude) - 0.02},${Math.max(locationDetails.longitude, activeRoute?.longitude || locationDetails.longitude) + 0.02},${Math.max(locationDetails.latitude, activeRoute?.latitude || locationDetails.latitude) + 0.02}`
    : null;

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">
            GPS / live location
          </p>
          <h1 className="text-3xl font-bold text-white mt-2">
            Live location update UI
          </h1>
          <p className="text-[#D5D5D5] mt-3 max-w-2xl">
            Convert coordinates into location details instantly, sync the
            customer route, and keep all delivery updates aligned with the live
            operational view.
          </p>
        </div>

        <div className="rounded-2xl border border-[#27272A] bg-[#1A1A1A] px-4 py-3">
          <p className="text-sm text-[#A1A1AA]">Active route</p>
          <p className="text-lg font-semibold text-white mt-1">
            {activeRoute?.customer || "No active route available"}
          </p>
        </div>
      </div>

      <div className="bg-[#1A1A1A] border border-[#27272A] rounded-2xl p-5 mt-8">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl bg-[#111111] border border-[#27272A] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#A1A1AA]">Map preview</p>
                <h2 className="text-xl font-semibold text-white mt-1">
                  {locationDetails
                    ? "Resolved location"
                    : "Enter coordinates to preview"}
                </h2>
              </div>

              <span className="text-sm text-[#A1A1AA]">
                {locationDetails
                  ? `Source: ${locationDetails.source}`
                  : "Awaiting input"}
              </span>
            </div>

            <div className="mt-4 rounded-2xl border border-[#27272A] bg-[#0B0B0B] p-4 min-h-100 flex flex-col">
              {showMap && locationDetails ? (
                <>
                  <div className="mb-4">
                    <div>
                      <p className="text-sm text-[#A1A1AA]">
                        Delivery Person Location
                      </p>
                      <p className="text-white text-lg font-semibold mt-2">
                        {locationDetails.displayName}
                      </p>
                      <p className="text-[#D5D5D5] mt-1">
                        {locationDetails.formattedAddress}
                      </p>
                    </div>

                    {activeRoute && (
                      <div className="bg-[#0B0B0B] border border-[#27272A] rounded-xl p-3 mt-3">
                        <p className="text-sm text-[#A1A1AA]">
                          Customer Delivery Address
                        </p>
                        <p className="text-white font-semibold mt-2">
                          {activeRoute.address ||
                            "Customer address not available"}
                        </p>
                      </div>
                    )}

                    {activeRoute && routeInfo && (
                      <div className="bg-[#0B0B0B] border border-[#27272A] rounded-xl p-3 mt-3">
                        <p className="text-sm text-[#A1A1AA]">Route summary</p>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div className="rounded-lg bg-[#111111] p-3">
                            <p className="text-[#A1A1AA] text-xs">Distance</p>
                            <p className="text-white font-bold text-lg mt-1">
                              {routeInfo.distance} km
                            </p>
                          </div>
                          <div className="rounded-lg bg-[#111111] p-3">
                            <p className="text-[#A1A1AA] text-xs">Est. Time</p>
                            <p className="text-white font-bold text-lg mt-1">
                              {routeInfo.duration} min
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                      <div className="rounded-xl border border-[#27272A] bg-[#111111] p-3">
                        <p className="text-[#A1A1AA]">Latitude</p>
                        <p className="text-white font-semibold mt-2">
                          {locationDetails.latitude.toFixed(6)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-[#27272A] bg-[#111111] p-3">
                        <p className="text-[#A1A1AA]">Longitude</p>
                        <p className="text-white font-semibold mt-2">
                          {locationDetails.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 rounded-xl border border-[#27272A] overflow-hidden">
                    {waypoints.length >= 2 ? (
                      <LeafletOsrmMap waypoints={waypoints} />
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
                        className="min-h-75"
                        title="Route Map"
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-center px-4">
                  <p className="text-[#A1A1AA] text-lg">
                    Coordinates will show the map and location details here once
                    you resolve them.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#A1A1AA]">Your Location</label>
              <div className="mt-2 bg-[#111111] border border-[#27272A] rounded-2xl p-3 text-white">
                <p className="text-xs text-[#D5D5D5]">
                  Lat: {latitude || "-- "} | Lon: {longitude || "-- "}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLoading}
                className="bg-[#DC2626] hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {isLoading ? "Getting location..." : "Use current location"}
              </button>

              <button
                onClick={() => void handleUpdateLocation()}
                disabled={isLoading || !latitude || !longitude}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Map
              </button>

              <button
                onClick={() => {
                  setLatitude("");
                  setLongitude("");
                  setLocationDetails(null);
                  setShowMap(false);
                  setRouteInfo(null);
                }}
                className="bg-transparent border border-[#27272A] hover:bg-[#111111] text-white px-4 py-2 rounded-lg"
              >
                Clear
              </button>
            </div>

            <div className="bg-[#111111] border border-[#27272A] rounded-2xl p-4">
              <p className="text-sm text-[#A1A1AA]">Live status</p>
              <p className="text-white font-semibold mt-2">
                {locationDetails?.formattedAddress || "Awaiting GPS input"}
              </p>
              <p className="text-sm text-[#D5D5D5] mt-3">
                Order: {activeRoute?.customer || "No active order"}
              </p>
              <p className="text-sm text-[#D5D5D5]">
                Destination: {activeRoute?.address || "No address"}
              </p>
              <p className="text-sm text-[#D5D5D5] mt-2">
                Last resolved:{" "}
                {locationDetails?.timestamp || "No location resolved yet"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
