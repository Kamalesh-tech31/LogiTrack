"use client";

import { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Crosshair,
  Edit3,
  Map as MapIcon,
  Bookmark,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { MapLocationPicker } from "./MapLocationPicker";

interface ClaimLocationModalProps {
  isOpen: boolean;
  orderId: string;
  orderDisplayId?: string;
  onClose: () => void;
  onConfirmClaim: (coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    source: "GPS" | "Manual" | "Saved" | "Map";
  }) => Promise<void>;
}

export default function ClaimLocationModal({
  isOpen,
  orderId,
  orderDisplayId,
  onClose,
  onConfirmClaim,
}: ClaimLocationModalProps) {
  const [selectedOption, setSelectedOption] = useState<"gps" | "map" | "manual">("gps");
  const [coords, setCoords] = useState<{
    latitude: number | null;
    longitude: number | null;
    accuracy?: number;
    source: "GPS" | "Manual" | "Saved" | "Map" | null;
  }>({
    latitude: null,
    longitude: null,
    source: null,
  });

  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [isAcquiringGps, setIsAcquiringGps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedLocation, setSavedLocation] = useState<{
    latitude: number;
    longitude: number;
    timestamp?: string;
  } | null>(null);

  // Load saved/last known location on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("agent_last_known_location");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (
            parsed &&
            typeof parsed.latitude === "number" &&
            typeof parsed.longitude === "number"
          ) {
            setSavedLocation(parsed);
          }
        }
      } catch (e) {
        // ignore JSON parse error
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Option 1: Acquire Browser GPS
  const handleAcquireGps = () => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      toast.error(
        "Browser GPS is not supported on this device. Please enter coordinates manually or pick from map.",
      );
      setSelectedOption("map");
      return;
    }

    setIsAcquiringGps(true);
    toast.loading("Acquiring GPS fix from device...", { id: "gps-modal-fetch" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsAcquiringGps(false);
        toast.dismiss("gps-modal-fetch");
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;

        setCoords({
          latitude: lat,
          longitude: lng,
          accuracy: acc,
          source: "GPS",
        });

        // Store as last known
        localStorage.setItem(
          "agent_last_known_location",
          JSON.stringify({
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
          }),
        );
        toast.success(`GPS acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      (err) => {
        setIsAcquiringGps(false);
        toast.dismiss("gps-modal-fetch");
        const msg =
          err.code === 1
            ? "Location permission denied. Please use 'Select on Map' or 'Enter Manually'."
            : "GPS signal timed out. Please select location on the map.";
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // Option 2: Select Location on Map
  const handleMapSelect = (mapCoords: { latitude: number; longitude: number }) => {
    setCoords({
      latitude: mapCoords.latitude,
      longitude: mapCoords.longitude,
      source: "Map",
    });
    setManualLat(mapCoords.latitude.toFixed(5));
    setManualLng(mapCoords.longitude.toFixed(5));

    localStorage.setItem(
      "agent_last_known_location",
      JSON.stringify({
        latitude: mapCoords.latitude,
        longitude: mapCoords.longitude,
        timestamp: new Date().toISOString(),
      }),
    );
  };

  // Option 3: Apply Manual Coordinates
  const handleApplyManual = () => {
    const lat = parseFloat(manualLat.trim());
    const lng = parseFloat(manualLng.trim());

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error("Please enter a valid Latitude between -90 and 90.");
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error("Please enter a valid Longitude between -180 and 180.");
      return;
    }

    setCoords({
      latitude: lat,
      longitude: lng,
      source: "Manual",
    });

    localStorage.setItem(
      "agent_last_known_location",
      JSON.stringify({
        latitude: lat,
        longitude: lng,
        timestamp: new Date().toISOString(),
      }),
    );
    toast.success(`Manual location set: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
  };

  // Preset: Saved / Hub Location
  const handleApplySaved = () => {
    if (!savedLocation) {
      const defaultHub = { latitude: 13.0827, longitude: 80.2707 };
      setCoords({
        latitude: defaultHub.latitude,
        longitude: defaultHub.longitude,
        source: "Saved",
      });
      setManualLat(defaultHub.latitude.toString());
      setManualLng(defaultHub.longitude.toString());
      toast.success(`Loaded Hub Coordinates: ${defaultHub.latitude}, ${defaultHub.longitude}`);
      return;
    }

    setCoords({
      latitude: savedLocation.latitude,
      longitude: savedLocation.longitude,
      source: "Saved",
    });
    setManualLat(savedLocation.latitude.toFixed(5));
    setManualLng(savedLocation.longitude.toFixed(5));
    toast.success(
      `Loaded Last Known: ${savedLocation.latitude.toFixed(4)}, ${savedLocation.longitude.toFixed(4)}`,
    );
  };

  // Submit Claim
  const handleConfirm = async () => {
    if (coords.latitude == null || coords.longitude == null || !coords.source) {
      toast.error("Please select and verify your starting location first.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirmClaim({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        source: coords.source,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to claim order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#18191C] border border-[#2A2B30] rounded-3xl p-6 shadow-2xl space-y-5 text-[#F4F4F5]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2A2B30] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 flex items-center justify-center text-[#F97316]">
              <Navigation size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Select Starting Location
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Claiming Order {orderDisplayId || orderId}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-xl bg-[#111214] border border-[#2A2B30] flex items-center justify-center text-[#A1A1AA] hover:text-white transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* 3 Choice Option Selector Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#111214] border border-[#2A2B30] rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setSelectedOption("gps");
              if (!coords.latitude || coords.source !== "GPS") handleAcquireGps();
            }}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedOption === "gps"
                ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Crosshair size={16} />
            <span>Use Current GPS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedOption("map");
              if (!coords.latitude) {
                // Initialize with default or saved
                const initLat = savedLocation?.latitude || 13.0827;
                const initLng = savedLocation?.longitude || 80.2707;
                setCoords({ latitude: initLat, longitude: initLng, source: "Map" });
              }
            }}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedOption === "map"
                ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <MapIcon size={16} />
            <span>Select on Map</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOption("manual")}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              selectedOption === "manual"
                ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                : "text-[#A1A1AA] hover:text-white"
            }`}
          >
            <Edit3 size={16} />
            <span>Enter Manually</span>
          </button>
        </div>

        {/* Option Specific Controls */}
        <div className="p-4 bg-[#111214] border border-[#2A2B30] rounded-2xl space-y-3">
          {selectedOption === "gps" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#A1A1AA]">
                  Device Geolocation
                </span>
                <button
                  type="button"
                  onClick={handleAcquireGps}
                  disabled={isAcquiringGps}
                  className="text-xs font-semibold text-[#FDBA74] hover:text-[#F97316] transition flex items-center gap-1 cursor-pointer"
                >
                  {isAcquiringGps ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Reading Sensor...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair size={12} />
                      <span>Refresh GPS</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                Uses your device browser sensor to accurately track your initial pickup route to the merchant warehouse.
              </p>
            </div>
          )}

          {selectedOption === "map" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#A1A1AA]">
                  Interactive Location Selector
                </span>
                <span className="text-[10px] font-mono text-[#FDBA74]">
                  {coords.latitude && coords.longitude
                    ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
                    : "Click map to set"}
                </span>
              </div>
              <MapLocationPicker
                latitude={coords.latitude || (savedLocation?.latitude ?? 13.0827)}
                longitude={coords.longitude || (savedLocation?.longitude ?? 80.2707)}
                onSelectLocation={handleMapSelect}
              />
            </div>
          )}

          {selectedOption === "manual" && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#A1A1AA]">
                Enter numerical coordinates for testing or when GPS is unavailable:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-mono text-[#A1A1AA]">
                    Latitude
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 13.0827"
                    value={manualLat}
                    onChange={(e) => setManualLat(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#18191C] border border-[#2A2B30] rounded-xl text-xs font-mono text-white placeholder-[#A1A1AA]/40 focus:border-[#F97316] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-mono text-[#A1A1AA]">
                    Longitude
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 80.2707"
                    value={manualLng}
                    onChange={(e) => setManualLng(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-[#18191C] border border-[#2A2B30] rounded-xl text-xs font-mono text-white placeholder-[#A1A1AA]/40 focus:border-[#F97316] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setManualLat("13.0827");
                      setManualLng("80.2707");
                    }}
                    className="text-[11px] text-[#A1A1AA] hover:text-[#FDBA74] underline underline-offset-2 transition cursor-pointer"
                  >
                    Chennai Hub
                  </button>
                  <button
                    type="button"
                    onClick={handleApplySaved}
                    className="text-[11px] text-[#A1A1AA] hover:text-[#FDBA74] underline underline-offset-2 transition cursor-pointer"
                  >
                    Last Saved
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleApplyManual}
                  className="px-3 py-1.5 rounded-xl bg-[#2A2B30] hover:bg-[#3F3F46] text-xs font-semibold text-white transition cursor-pointer"
                >
                  Set Coordinates
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selected Coordinate Verification Banner */}
        {coords.latitude != null && coords.longitude != null ? (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-white flex items-center gap-2">
                <span>Selected Location Verified</span>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Source: {coords.source}
                </span>
              </p>
              <p className="font-mono text-emerald-300 text-[11px]">
                Lat: {coords.latitude.toFixed(5)} | Lng: {coords.longitude.toFixed(5)}
                {coords.accuracy ? ` (±${Math.round(coords.accuracy)}m)` : ""}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-2.5 text-amber-300 text-xs">
            <AlertCircle size={16} className="shrink-0" />
            <span>Please acquire GPS or set coordinates to proceed with claim.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-3 px-4 rounded-2xl bg-[#111214] hover:bg-[#2A2B30] text-xs font-bold text-[#A1A1AA] hover:text-white transition border border-[#2A2B30] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              isSubmitting || coords.latitude == null || coords.longitude == null
            }
            className="flex-2 py-3 px-4 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_16px_rgba(249,115,22,0.4)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Assigning & Activating Route...</span>
              </>
            ) : (
              <>
                <MapPin size={14} />
                <span>Confirm Location & Claim Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
