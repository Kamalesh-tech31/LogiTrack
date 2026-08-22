"use client";

import { useEffect, useRef, useState } from "react";
import { deliveryRoute } from "@/lib/mock-data";
import {
  Map,
  type MapRef,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  MapControls,
} from "@/components/ui/map";
import { MapPin, Navigation } from "lucide-react";

export function MapContent({ route }: { route?: any }) {
  const currentRoute = route || deliveryRoute;
  const mapRef = useRef<MapRef>(null);

  const originLocation =
    currentRoute.origin?.lat != null && currentRoute.origin?.lng != null
      ? currentRoute.origin
      : currentRoute.currentPosition;
  const destinationLocation =
    currentRoute.destination?.lat != null &&
    currentRoute.destination?.lng != null
      ? currentRoute.destination
      : currentRoute.currentPosition;

  // Convert waypoints from [lat, lng] to [lng, lat] for MapLibre
  const routePath: [number, number][] =
    Array.isArray(currentRoute.waypoints) && currentRoute.waypoints.length > 0
      ? currentRoute.waypoints.map((point: { lat: number; lng: number }) => [
          point.lng,
          point.lat,
        ])
      : originLocation && destinationLocation
        ? [
            [originLocation.lng, originLocation.lat],
            [destinationLocation.lng, destinationLocation.lat],
          ]
        : [];

  const center: [number, number] = routePath.length
    ? routePath[Math.floor(routePath.length / 2)]
    : originLocation
      ? [originLocation.lng, originLocation.lat]
      : [80.2707, 13.0827]; // Longitude, Latitude for Chennai fallback

  const showOriginMarker =
    !!originLocation && originLocation !== currentRoute.currentPosition;
  const showCurrentPositionMarker =
    currentRoute.currentPosition?.lat != null &&
    currentRoute.currentPosition?.lng != null;

  // Fit bounds whenever routePath changes
  useEffect(() => {
    if (mapRef.current && routePath.length > 1) {
      // Calculate bounding box: [minLng, minLat, maxLng, maxLat]
      const minLng = Math.min(...routePath.map((p) => p[0]));
      const maxLng = Math.max(...routePath.map((p) => p[0]));
      const minLat = Math.min(...routePath.map((p) => p[1]));
      const maxLat = Math.max(...routePath.map((p) => p[1]));

      const bounds: [number, number, number, number] = [
        minLng,
        minLat,
        maxLng,
        maxLat,
      ];
      
      mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    } else if (mapRef.current && center) {
      mapRef.current.easeTo({ center, zoom: 13, duration: 1000 });
    }
  }, [routePath, center]);

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        center={center}
        zoom={13}
        styles={{
          light: "https://tiles.openfreemap.org/styles/bright",
          dark: "https://tiles.openfreemap.org/styles/liberty",
        }}
      >
        <MapControls position="top-right" />

        {showOriginMarker && originLocation && (
          <MapMarker longitude={originLocation.lng} latitude={originLocation.lat}>
            <MarkerContent>
              <div className="relative -mt-6">
                <MapPin className="text-green-600 fill-green-100 h-8 w-8 drop-shadow-md" />
              </div>
            </MarkerContent>
            <MarkerPopup>
              <p className="font-medium text-sm text-foreground">
                {originLocation.name || "Start location"}
              </p>
            </MarkerPopup>
          </MapMarker>
        )}

        {destinationLocation && (
          <MapMarker
            longitude={destinationLocation.lng}
            latitude={destinationLocation.lat}
          >
            <MarkerContent>
              <div className="relative -mt-6">
                <MapPin className="text-red-600 fill-red-100 h-8 w-8 drop-shadow-md" />
              </div>
            </MarkerContent>
            <MarkerPopup>
              <p className="font-medium text-sm text-foreground">
                {destinationLocation.name || "Destination"}
              </p>
            </MarkerPopup>
          </MapMarker>
        )}

        {showCurrentPositionMarker && (
          <MapMarker
            longitude={currentRoute.currentPosition.lng}
            latitude={currentRoute.currentPosition.lat}
          >
            <MarkerContent>
              <div className="relative flex items-center justify-center bg-blue-500 rounded-full p-2 border-2 border-white shadow-lg animate-pulse">
                <Navigation className="text-white h-4 w-4" />
              </div>
            </MarkerContent>
            <MarkerPopup>
              <p className="font-medium text-sm text-foreground">
                {currentRoute.currentPosition.name ||
                  "Delivery Partner - In Transit"}
              </p>
            </MarkerPopup>
          </MapMarker>
        )}

        {routePath.length > 1 && (
          <MapRoute
            coordinates={routePath}
            color="#ef4444"
            width={4}
            dashArray={[2, 2]}
          />
        )}
      </Map>
    </div>
  );
}
