"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapLocationPickerInnerProps {
  latitude: number | null;
  longitude: number | null;
  onSelectLocation: (coords: { latitude: number; longitude: number }) => void;
}

// Custom vehicle pin icon for the agent's start point
const createPickerVehicleIcon = () =>
  L.divIcon({
    className: "custom-picker-agent-marker",
    html: `
      <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: rgba(249, 115, 22, 0.35); animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #F97316; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.6); display: flex; align-items: center; justify-content: center; color: white; font-size: 16px;">
          🛵
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });

function MapClickHandler({
  onSelect,
}: {
  onSelect: (coords: { latitude: number; longitude: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });
  return null;
}

function CenterUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function MapLocationPickerInner({
  latitude,
  longitude,
  onSelectLocation,
}: MapLocationPickerInnerProps) {
  const pickerIcon = createPickerVehicleIcon();
  const defaultCenter: [number, number] =
    latitude != null && longitude != null
      ? [latitude, longitude]
      : [13.0827, 80.2707];

  return (
    <div className="relative h-64 w-full rounded-2xl overflow-hidden border border-[#2A2B30] bg-[#111214]">
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onSelect={onSelectLocation} />

        {latitude != null && longitude != null && (
          <>
            <CenterUpdater center={[latitude, longitude]} />
            <Marker
              position={[latitude, longitude]}
              icon={pickerIcon}
              draggable={true}
              eventHandlers={{
                dragend(e) {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  onSelectLocation({
                    latitude: pos.lat,
                    longitude: pos.lng,
                  });
                },
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <p className="font-bold text-[#F97316]">
                    🛵 Your Starting Location
                  </p>
                  <p className="text-gray-600 mt-0.5 font-mono text-[11px]">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Floating Instructions Helper */}
      <div className="absolute top-2.5 right-2.5 z-[1000] bg-[#111214]/90 backdrop-blur-md border border-[#2A2B30] px-3 py-1.5 rounded-xl text-[11px] font-medium text-[#FDBA74] shadow-lg pointer-events-none">
        Click or drag pin to set location
      </div>
    </div>
  );
}
