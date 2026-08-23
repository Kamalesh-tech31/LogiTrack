"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Search,
  Navigation,
  MapPin,
  Home,
  Building2,
  Bookmark,
  Check,
  Loader2,
  Compass,
  Hash,
  Signpost,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface LocationData {
  doorNo?: string;
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  label?: string;
  businessName?: string;
}

interface UniversalLocationPickerProps {
  value: LocationData;
  onChange: (location: LocationData) => void;
  title?: string;
  subtitle?: string;
  defaultSuggestion?: LocationData | null;
  defaultSuggestionLabel?: string;
  onUseDefaultSuggestion?: () => void;
  showSaveAsHome?: boolean;
  saveAsHomeChecked?: boolean;
  onSaveAsHomeChange?: (val: boolean) => void;
  roleContext?: "customer" | "owner" | "driver" | "general";
  required?: boolean;
}

// Dynamically import Leaflet Map to ensure zero SSR errors
const LeafletMapPicker = dynamic(
  () => import("./LeafletMapPickerInner").then((mod) => mod.LeafletMapPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full bg-[#111214] border border-[#2A2B30] rounded-2xl flex flex-col items-center justify-center gap-2 text-[#A1A1AA]">
        <Loader2 className="h-6 w-6 animate-spin text-[#F97316]" />
        <span className="text-xs">Initializing Interactive Map...</span>
      </div>
    ),
  }
);

export function UniversalLocationPicker({
  value,
  onChange,
  title,
  subtitle,
  defaultSuggestion,
  defaultSuggestionLabel = "Home Address",
  onUseDefaultSuggestion,
  showSaveAsHome = false,
  saveAsHomeChecked = false,
  onSaveAsHomeChange,
  roleContext = "customer",
  required = true,
}: UniversalLocationPickerProps) {
  const [activeTab, setActiveTab] = useState<"search" | "gps" | "map">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Address search query with debouncing
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const query = searchQuery.trim();
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(
            query
          )}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "LogiTrack/1.0",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setSuggestions(data);
          }
        }
      } catch (err) {
        console.warn("Address search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const compileFullAddress = (data: Partial<LocationData>) => {
    const parts = [
      data.doorNo,
      data.street,
      data.area,
      data.city,
      data.state,
      data.postalCode,
    ].filter(Boolean);
    return parts.join(", ") || data.fullAddress || "";
  };

  const handleSelectSuggestion = (item: any) => {
    const addr = item.address || {};
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    const street = [addr.road, addr.house_number].filter(Boolean).join(" ") || item.display_name.split(",")[0];
    const area = [addr.suburb, addr.neighbourhood, addr.residential].filter(Boolean).join(", ") || "";
    const city = addr.city || addr.town || addr.village || addr.county || "";
    const state = addr.state || "";
    const postalCode = addr.postcode || "";

    const updated: LocationData = {
      ...value,
      doorNo: addr.house_number || value.doorNo || "",
      street: street || value.street || "",
      area: area || value.area || "",
      city: city || value.city || "",
      state: state || value.state || "",
      postalCode: postalCode || value.postalCode || "",
      country: addr.country || "India",
      latitude: !isNaN(lat) ? lat : value.latitude || 13.0827,
      longitude: !isNaN(lon) ? lon : value.longitude || 80.2707,
    };

    updated.fullAddress = item.display_name || compileFullAddress(updated);
    setSuggestions([]);
    setSearchQuery("");
    onChange(updated);
  };

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) {
      setGpsMessage("Geolocation is not supported by your browser.");
      return;
    }

    setIsGpsLoading(true);
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "LogiTrack/1.0",
              },
            }
          );

          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const street = [addr.road, addr.house_number].filter(Boolean).join(" ") || data.display_name?.split(",")[0] || "";
            const area = [addr.suburb, addr.neighbourhood, addr.residential].filter(Boolean).join(", ") || "";
            const city = addr.city || addr.town || addr.village || addr.county || "";
            const state = addr.state || "";
            const postalCode = addr.postcode || "";

            const updated: LocationData = {
              ...value,
              doorNo: addr.house_number || value.doorNo || "",
              street: street || value.street || "",
              area: area || value.area || "",
              city: city || value.city || "",
              state: state || value.state || "",
              postalCode: postalCode || value.postalCode || "",
              country: addr.country || "India",
              latitude: lat,
              longitude: lon,
              fullAddress: data.display_name || "",
            };

            updated.fullAddress = data.display_name || compileFullAddress(updated);
            onChange(updated);
            setGpsMessage(`Location locked via GPS (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
            return;
          }
        } catch (err) {
          console.warn("Reverse geocode error:", err);
        } finally {
          setIsGpsLoading(false);
        }

        // Fallback with coordinates
        onChange({
          ...value,
          latitude: lat,
          longitude: lon,
        });
        setIsGpsLoading(false);
      },
      (err) => {
        setIsGpsLoading(false);
        setGpsMessage(`GPS Error: ${err.message || "Permission denied or unavailable"}`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleMapPinSelected = useCallback(
    async (lat: number, lon: number) => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "LogiTrack/1.0",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          const addr = data.address || {};
          const street = [addr.road, addr.house_number].filter(Boolean).join(" ") || data.display_name?.split(",")[0] || "";
          const area = [addr.suburb, addr.neighbourhood, addr.residential].filter(Boolean).join(", ") || "";
          const city = addr.city || addr.town || addr.village || addr.county || "";
          const state = addr.state || "";
          const postalCode = addr.postcode || "";

          const updated: LocationData = {
            ...value,
            doorNo: addr.house_number || value.doorNo || "",
            street: street || value.street || "",
            area: area || value.area || "",
            city: city || value.city || "",
            state: state || value.state || "",
            postalCode: postalCode || value.postalCode || "",
            country: addr.country || "India",
            latitude: lat,
            longitude: lon,
            fullAddress: data.display_name || "",
          };

          onChange(updated);
          return;
        }
      } catch (err) {
        console.warn("Map pin geocode error:", err);
      }

      onChange({
        ...value,
        latitude: lat,
        longitude: lon,
      });
    },
    [value, onChange]
  );

  const handleFieldChange = (field: keyof LocationData, val: any) => {
    const updated = {
      ...value,
      [field]: val,
    };
    updated.fullAddress = compileFullAddress(updated);
    onChange(updated);
  };

  return (
    <div className="space-y-5">
      {/* Header / Title */}
      {title && (
        <div>
          <h3 className="text-sm font-bold text-white font-display flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F97316]" />
            <span>{title}</span>
            {required && <span className="text-red-400 text-xs">*</span>}
          </h3>
          {subtitle && <p className="text-xs text-[#A1A1AA] mt-0.5">{subtitle}</p>}
        </div>
      )}

      {/* Default Address Suggestion Preset (if available and not yet applied) */}
      {defaultSuggestion && defaultSuggestion.latitude && (
        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm hover:border-[#F97316]/40 transition">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316]">
              <Home className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white font-display">
                  {defaultSuggestionLabel}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Preset Available
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5 max-w-md">
                {defaultSuggestion.fullAddress || defaultSuggestion.street}
              </p>
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (onUseDefaultSuggestion) {
                onUseDefaultSuggestion();
              } else {
                onChange({ ...defaultSuggestion });
              }
            }}
            className="bg-[#1A1B1E] hover:bg-[#F97316] text-xs font-semibold text-[#FDBA74] hover:text-white border border-[#2A2B30] hover:border-[#F97316] rounded-xl px-3.5 py-2 transition cursor-pointer self-start sm:self-auto"
          >
            Use {defaultSuggestionLabel}
          </Button>
        </div>
      )}

      {/* 3-WAY SELECTOR TABS */}
      <div className="grid grid-cols-3 gap-2 bg-[#111214] p-1.5 rounded-2xl border border-[#2A2B30]">
        <button
          type="button"
          onClick={() => setActiveTab("search")}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "search"
              ? "bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1B1E]"
          }`}
        >
          <Search className="h-3.5 w-3.5" />
          <span>1. Search Address</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("gps");
            handleUseCurrentGps();
          }}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "gps"
              ? "bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1B1E]"
          }`}
        >
          <Navigation className={`h-3.5 w-3.5 ${isGpsLoading ? "animate-spin" : ""}`} />
          <span>2. Current GPS</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`py-2.5 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "map"
              ? "bg-[#F97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#1A1B1E]"
          }`}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span>3. Pick on Map</span>
        </button>
      </div>

      {/* Tab 1: Address Search Input & Results */}
      {activeTab === "search" && (
        <div className="space-y-2 relative">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#A1A1AA]" />
            <Input
              placeholder="Search area, landmark, street, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10 bg-[#111214] border-[#2A2B30] text-white focus:border-[#F97316] rounded-2xl h-11 text-xs"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-3.5 h-4 w-4 text-[#F97316] animate-spin" />
            )}
          </div>

          {/* Autocomplete suggestions dropdown */}
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[#111214] border border-[#2A2B30] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#2A2B30] max-h-56 overflow-y-auto backdrop-blur-xl">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 hover:bg-[#1A1B1E] flex items-start gap-2.5 cursor-pointer transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-[#F97316] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white leading-tight">
                      {item.display_name?.split(",")[0]}
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                      {item.display_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: GPS Status & Action */}
      {activeTab === "gps" && (
        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-white">Browser Geolocation (GPS)</p>
            <p className="text-[11px] text-[#A1A1AA] mt-0.5">
              {gpsMessage || "Requesting high-accuracy GPS coordinates from your device..."}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isGpsLoading}
            onClick={handleUseCurrentGps}
            className="border-[#2A2B30] bg-[#1A1B1E] hover:bg-[#2A2B30] text-xs text-white gap-2 rounded-xl"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-[#F97316] ${isGpsLoading ? "animate-spin" : ""}`} />
            <span>Re-locate</span>
          </Button>
        </div>
      )}

      {/* Tab 3: Interactive Leaflet Pin Drop Map */}
      {activeTab === "map" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA] flex items-center gap-1.5">
              <Compass className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Click or drag pin to fine-tune location:</span>
            </span>
            <span className="font-mono text-[11px] text-[#FDBA74]">
              {value.latitude ? `${value.latitude.toFixed(4)}, ${value.longitude?.toFixed(4)}` : "No pin placed"}
            </span>
          </div>

          <div className="h-64 w-full rounded-2xl overflow-hidden border border-[#2A2B30] relative isolate z-0">
            <LeafletMapPicker
              lat={value.latitude || 13.0827}
              lng={value.longitude || 80.2707}
              onLocationSelect={handleMapPinSelected}
            />
          </div>
        </div>
      )}

      {/* Structured Address Fields */}
      <div className="space-y-3 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#A1A1AA] flex items-center gap-1">
              <Hash className="h-3 w-3 text-[#F97316]" />
              <span>Door / House / Unit No.</span>
            </label>
            <Input
              placeholder="e.g. Flat 304, Unit B"
              value={value.doorNo || ""}
              onChange={(e) => handleFieldChange("doorNo", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#A1A1AA] flex items-center gap-1">
              <Signpost className="h-3 w-3 text-[#F97316]" />
              <span>Street / Road *</span>
            </label>
            <Input
              placeholder="e.g. 5th Main Road, Mount Road"
              value={value.street || ""}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white rounded-xl h-10 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-[#A1A1AA] flex items-center gap-1">
            <Compass className="h-3 w-3 text-[#F97316]" />
            <span>Area / Locality / Sector *</span>
          </label>
          <Input
            placeholder="e.g. Anna Nagar, Sector 4"
            value={value.area || ""}
            onChange={(e) => handleFieldChange("area", e.target.value)}
            className="bg-[#111214] border-[#2A2B30] text-white rounded-xl h-10 text-xs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#A1A1AA]">City *</label>
            <Input
              placeholder="e.g. Chennai"
              value={value.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#A1A1AA]">State *</label>
            <Input
              placeholder="e.g. Tamil Nadu"
              value={value.state || ""}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#A1A1AA]">PIN Code *</label>
            <Input
              placeholder="e.g. 600028"
              value={value.postalCode || ""}
              onChange={(e) => handleFieldChange("postalCode", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white font-mono rounded-xl h-10 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Confirmed Address Preview */}
      {value.fullAddress && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-3.5 text-xs text-[#F4F4F5]">
          <div className="flex items-center gap-2 mb-1 text-emerald-400 font-semibold font-mono text-[11px]">
            <Check className="h-3.5 w-3.5" />
            <span>CONFIRMED LOCATION DESTINATION</span>
          </div>
          <p className="text-white leading-relaxed pl-5 font-medium">{value.fullAddress}</p>
        </div>
      )}

      {/* Optional: Save as Default/Home Address checkbox */}
      {showSaveAsHome && (
        <label className="flex items-center gap-2.5 text-xs font-semibold text-[#A1A1AA] hover:text-white cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            checked={saveAsHomeChecked}
            onChange={(e) => onSaveAsHomeChange && onSaveAsHomeChange(e.target.checked)}
            className="rounded-lg border-[#2A2B30] bg-[#111214] text-[#F97316] focus:ring-[#F97316] h-4 w-4 cursor-pointer accent-[#F97316]"
          />
          <span>Save this address as my Home Address for faster future checkout</span>
        </label>
      )}
    </div>
  );
}
