"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapPickerInnerProps {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Map Click & Drag Controller
function LocationMarker({
  lat,
  lng,
  onLocationSelect,
}: {
  lat: number;
  lng: number;
  onLocationSelect: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  // Sync map view when external lat/lng changes
  useEffect(() => {
    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], map.getZoom() || 14, { duration: 0.8 });
    }
  }, [lat, lng, map]);

  // Click on map to place pin
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  // Custom high-visibility LogiTrack orange marker icon
  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: "custom-map-picker-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 28px; height: 28px; background: #F97316; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #FFFFFF; box-shadow: 0 4px 10px rgba(249,115,22,0.5);"></div>
            <div style="position: absolute; width: 10px; height: 10px; background: #FFFFFF; border-radius: 50%; top: 9px;"></div>
          </div>
        `,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      }),
    []
  );

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          onLocationSelect(newPos.lat, newPos.lng);
        }
      },
    }),
    [onLocationSelect]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={[lat, lng]}
      ref={markerRef}
      icon={pinIcon}
    />
  );
}

export function LeafletMapPickerInner({
  lat,
  lng,
  onLocationSelect,
}: LeafletMapPickerInnerProps) {
  const center: [number, number] = [lat || 13.0827, lng || 80.2707];

  return (
    <div className="h-full w-full relative overflow-hidden rounded-2xl isolate z-0">
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={true}
        attributionControl={false}
        className="h-full w-full"
        style={{ background: "#111214", height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          lat={lat || 13.0827}
          lng={lng || 80.2707}
          onLocationSelect={onLocationSelect}
        />
      </MapContainer>
    </div>
  );
}
