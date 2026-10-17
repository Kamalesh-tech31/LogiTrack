"use client";

import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface AdminLocationMapInnerProps {
  lat: number;
  lng: number;
  businessName?: string;
  address?: string;
}

export function AdminLocationMapInner({
  lat,
  lng,
  businessName,
  address,
}: AdminLocationMapInnerProps) {
  const center: [number, number] = [lat, lng];

  const pinIcon = useMemo(
    () =>
      L.divIcon({
        className: "custom-admin-location-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 32px; height: 32px; background: #F97316; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid #FFFFFF; box-shadow: 0 4px 14px rgba(249,115,22,0.6);"></div>
            <div style="position: absolute; width: 12px; height: 12px; background: #FFFFFF; border-radius: 50%; top: 10px;"></div>
          </div>
        `,
        iconSize: [34, 46],
        iconAnchor: [17, 46],
        popupAnchor: [0, -42],
      }),
    []
  );

  return (
    <MapContainer
      center={center}
      zoom={15}
      scrollWheelZoom={true}
      className="h-full w-full rounded-2xl"
      style={{ background: "#111214", minHeight: "260px" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={pinIcon}>
        <Popup className="custom-leaflet-popup">
          <div className="p-1 text-xs font-sans text-slate-900">
            <p className="font-bold text-sm text-[#EA580C]">
              📍 {businessName || "Business Shop / Warehouse"}
            </p>
            {address && <p className="mt-1 text-slate-700 leading-snug">{address}</p>}
            <p className="mt-1 text-[11px] font-mono text-slate-500">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
