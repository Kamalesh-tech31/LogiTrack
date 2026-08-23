"use client";

import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface CheckoutMapPreviewInnerProps {
  latitude: number;
  longitude: number;
  address?: string;
  orderId?: string;
  zoom?: number;
  interactive?: boolean;
  zoomControl?: boolean;
}

function MapController({ lat, lng, zoom = 14 }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();

  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], zoom);
      const timer = setTimeout(() => {
        map.invalidateSize();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [lat, lng, zoom, map]);

  return null;
}

export default function CheckoutMapPreviewInner({
  latitude,
  longitude,
  address,
  orderId,
  zoom = 14,
  interactive = true,
  zoomControl = false,
}: CheckoutMapPreviewInnerProps) {
  const safeLat = typeof latitude === "number" && !isNaN(latitude) ? latitude : 13.0827;
  const safeLng = typeof longitude === "number" && !isNaN(longitude) ? longitude : 80.2707;

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: "custom-checkout-dest-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
            <div style="width: 28px; height: 28px; background: #F97316; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2.5px solid #FFFFFF; box-shadow: 0 4px 12px rgba(249,115,22,0.5);"></div>
            <div style="position: absolute; width: 10px; height: 10px; background: #FFFFFF; border-radius: 50%; top: 9px;"></div>
          </div>
        `,
        iconSize: [28, 38],
        iconAnchor: [14, 38],
      }),
    [],
  );

  return (
    <div className="h-full w-full relative overflow-hidden rounded-2xl isolate z-0">
      <MapContainer
        center={[safeLat, safeLng]}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={zoomControl}
        attributionControl={false}
        className="h-full w-full"
        style={{ background: "#111214", height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController lat={safeLat} lng={safeLng} zoom={zoom} />
        <Marker position={[safeLat, safeLng]} icon={destinationIcon}>
          <Popup className="custom-checkout-popup">
            <div className="text-xs p-1">
              <strong className="text-[#F97316] font-mono block">
                {orderId ? `Order ${orderId}` : "Delivery Destination"}
              </strong>
              {address && <p className="text-gray-700 mt-1">{address}</p>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
