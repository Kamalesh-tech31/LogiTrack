"use client";

import { useEffect, useState } from "react";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { deliveryRoute } from "@/lib/mock-data";

// DO NOT import MapContainer, Marker, etc. at module level
// DO NOT create Icon objects at module level

export function MapContent({ route }: { route?: any }) {
  const currentRoute = route || deliveryRoute;
  const [isClient, setIsClient] = useState(false);
  const [MapComponent, setMapComponent] =
    useState<React.ComponentType<any> | null>(null);

  // Lazy load Leaflet only after client hydration
  useEffect(() => {
    setIsClient(true);

    // Dynamic import of Leaflet components - ONLY on client
    Promise.all([
      import("react-leaflet").then((m) => m),
      import("leaflet").then((m) => m),
    ])
      .then(async ([leafletModule, leafletLib]) => {
        const { MapContainer, TileLayer, Marker, Polyline, Popup } =
          leafletModule;
        const { Icon } = leafletLib;

        // Create icons ONLY after client-side import
        const warehouseIcon = new Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const destinationIcon = new Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        const deliveryIcon = new Icon({
          iconUrl:
            "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        });

        // Create the map component function
        const MapComponent = () => {
          const originLocation =
            currentRoute.origin?.lat != null && currentRoute.origin?.lng != null
              ? currentRoute.origin
              : currentRoute.currentPosition;
          const destinationLocation =
            currentRoute.destination?.lat != null &&
            currentRoute.destination?.lng != null
              ? currentRoute.destination
              : currentRoute.currentPosition;

          const routePath: LatLngExpression[] =
            Array.isArray(currentRoute.waypoints) &&
            currentRoute.waypoints.length > 0
              ? currentRoute.waypoints.map(
                  (point: { lat: number; lng: number }) =>
                    [point.lat, point.lng] as LatLngExpression,
                )
              : originLocation && destinationLocation
                ? [
                    [originLocation.lat, originLocation.lng],
                    [destinationLocation.lat, destinationLocation.lng],
                  ]
                : [];

          const center: LatLngExpression = routePath.length
            ? routePath[Math.floor(routePath.length / 2)]
            : originLocation
              ? [originLocation.lat, originLocation.lng]
              : [13.0827, 80.2707];

          const bounds = routePath.length > 0 ? routePath : undefined;
          const showOriginMarker =
            !!originLocation && originLocation !== currentRoute.currentPosition;
          const showCurrentPositionMarker =
            currentRoute.currentPosition?.lat != null &&
            currentRoute.currentPosition?.lng != null;

          return (
            <MapContainer
              center={center}
              zoom={13}
              bounds={bounds}
              boundsOptions={{ padding: [50, 50] }}
              className="h-full w-full"
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {showOriginMarker && originLocation && (
                <Marker
                  position={[originLocation.lat, originLocation.lng]}
                  icon={warehouseIcon}
                >
                  <Popup>{originLocation.name || "Start location"}</Popup>
                </Marker>
              )}

              {destinationLocation && (
                <Marker
                  position={[destinationLocation.lat, destinationLocation.lng]}
                  icon={destinationIcon}
                >
                  <Popup>{destinationLocation.name || "Destination"}</Popup>
                </Marker>
              )}

              {showCurrentPositionMarker && (
                <Marker
                  position={[
                    currentRoute.currentPosition.lat,
                    currentRoute.currentPosition.lng,
                  ]}
                  icon={deliveryIcon}
                >
                  <Popup>
                    {currentRoute.currentPosition.name ||
                      "Delivery Partner - In Transit"}
                  </Popup>
                </Marker>
              )}

              {routePath.length > 1 && (
                <Polyline
                  positions={routePath}
                  color="#ef4444"
                  weight={3}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              )}
            </MapContainer>
          );
        };

        setMapComponent(() => MapComponent);
      })
      .catch((err) => {
        console.error("Failed to load map:", err);
      });
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  if (!MapComponent) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  return <MapComponent />;
}
