"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Navigation,
  Bookmark,
  CheckCircle2,
  Trash2,
  ChevronDown,
  Building2,
  Home,
  Users,
  Compass,
  Hash,
  Signpost,
  Sparkles,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SavedAddress,
  getSavedAddresses,
  deleteSavedAddress,
  buildFullAddress,
} from "@/lib/addressStorage";

export interface DeliveryAddressData {
  doorNo: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  savedId?: string;
  recipientName?: string;
  recipientPhone?: string;
}

interface DeliveryAddressSectionProps {
  value: DeliveryAddressData;
  onChange: (data: DeliveryAddressData) => void;
  saveAddressOnOrder: boolean;
  onSaveAddressOnOrderChange: (val: boolean) => void;
  selectedLabelType: "Home" | "Work" | "Friend" | "Custom";
  onSelectedLabelTypeChange: (
    val: "Home" | "Work" | "Friend" | "Custom",
  ) => void;
  customLabelName: string;
  onCustomLabelNameChange: (val: string) => void;
  userId?: string | null;
  onGpsStatusChange?: (active: boolean) => void;
}

export function DeliveryAddressSection({
  value,
  onChange,
  saveAddressOnOrder,
  onSaveAddressOnOrderChange,
  selectedLabelType,
  onSelectedLabelTypeChange,
  customLabelName,
  onCustomLabelNameChange,
  userId,
  onGpsStatusChange,
}: DeliveryAddressSectionProps) {
  const [savedList, setSavedList] = useState<SavedAddress[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const list = getSavedAddresses(userId);
    setSavedList(list);
  }, [userId]);

  const handleFieldChange = (
    field: keyof DeliveryAddressData,
    fieldVal: any,
  ) => {
    const updated = {
      ...value,
      [field]: fieldVal,
      savedId: undefined, // Clears savedId if user manually edits fields
    };

    // Rebuild fullAddress dynamically when core fields change
    const newFullAddress = buildFullAddress({
      doorNo: updated.doorNo,
      street: updated.street,
      area: updated.area,
      city: updated.city,
      state: updated.state,
      postalCode: updated.postalCode,
    });

    updated.fullAddress = newFullAddress;
    onChange(updated);
  };

  const handleSelectSaved = (saved: SavedAddress) => {
    setIsDropdownOpen(false);
    setIsGpsActive(false);
    if (onGpsStatusChange) onGpsStatusChange(false);

    const fullAddr =
      saved.fullAddress?.trim() ||
      buildFullAddress({
        doorNo: saved.doorNo,
        street: saved.street,
        area: saved.area,
        city: saved.city,
        state: saved.state,
        postalCode: saved.postalCode,
      });

    onChange({
      doorNo: saved.doorNo || "",
      street: saved.street || "",
      area: saved.area || "",
      city: saved.city || "",
      state: saved.state || "",
      postalCode: saved.postalCode || "",
      fullAddress: fullAddr,
      latitude: saved.latitude || 13.0827,
      longitude: saved.longitude || 80.2707,
      savedId: saved.id,
      recipientName: saved.fullName || value.recipientName || "",
      recipientPhone: saved.phone || value.recipientPhone || "",
    });
  };

  const handleDeleteSaved = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = deleteSavedAddress(id, userId);
    setSavedList(updated);
    if (value.savedId === id) {
      onChange({
        ...value,
        savedId: undefined,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setIsGpsActive(true);
        setIsGpsLoading(false);
        if (onGpsStatusChange) onGpsStatusChange(true);

        try {
          // Reverse geocode via OSM Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
              headers: {
                "User-Agent":
                  "LogiTrack-Frontend/1.0 (logistics-dispatch@logitrack.internal)",
              },
            },
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const streetName =
              [addr.road, addr.house_number].filter(Boolean).join(" ") ||
              data.display_name?.split(",")[0] ||
              "";
            const areaName =
              [addr.suburb, addr.neighbourhood].filter(Boolean).join(", ") ||
              "";
            const cityName =
              addr.city || addr.town || addr.village || addr.county || "";
            const stateName = addr.state || "";
            const postcode = addr.postcode || "";

            const compiled = buildFullAddress({
              doorNo: addr.house_number || "",
              street: addr.road || streetName,
              area: areaName,
              city: cityName,
              state: stateName,
              postalCode: postcode,
            });

            onChange({
              doorNo: addr.house_number || "",
              street: addr.road || streetName,
              area: areaName,
              city: cityName,
              state: stateName,
              postalCode: postcode,
              fullAddress: compiled || data.display_name || "",
              latitude: lat,
              longitude: lon,
              savedId: undefined,
              recipientName: value.recipientName,
              recipientPhone: value.recipientPhone,
            });
            return;
          }
        } catch {
          // Fallback to coordinates only
        }

        onChange({
          ...value,
          latitude: lat,
          longitude: lon,
        });
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
        setIsGpsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("work") || l.includes("office"))
      return <Building2 className="h-3.5 w-3.5 text-[#F97316]" />;
    if (l.includes("home"))
      return <Home className="h-3.5 w-3.5 text-emerald-400" />;
    if (l.includes("friend") || l.includes("family"))
      return <Users className="h-3.5 w-3.5 text-cyan-400" />;
    return <Bookmark className="h-3.5 w-3.5 text-[#FDBA74]" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Saved Addresses Dropdown */}
      {savedList.length > 0 && (
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Saved Address Preset</span>
            </label>
            <span className="text-[11px] text-[#A1A1AA] font-mono">
              {savedList.length} available
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 focus:border-[#F97316] text-left transition-all cursor-pointer shadow-sm group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316] group-hover:border-[#F97316]/40">
                <Bookmark className="h-4 w-4" />
              </div>
              {value.savedId ? (
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white font-display">
                      {savedList.find((s) => s.id === value.savedId)?.label ||
                        "Selected Address"}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F97316]/15 border border-[#F97316]/30 text-[#FDBA74]">
                      Active
                    </span>
                  </div>
                  <span className="text-xs text-[#A1A1AA] truncate block mt-0.5">
                    {value.fullAddress}
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-xs font-medium text-[#F4F4F5]">
                    Select a saved destination
                  </span>
                  <span className="text-[11px] text-[#A1A1AA] block mt-0.5">
                    Choose from Home, Work, or Custom addresses...
                  </span>
                </div>
              )}
            </div>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1A1B1E] border border-[#2A2B30] text-[#A1A1AA]">
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isDropdownOpen ? "rotate-180 text-[#F97316]" : ""}`}
              />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#111214] border border-[#2A2B30] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#2A2B30] max-h-64 overflow-y-auto backdrop-blur-xl">
              {savedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSaved(item)}
                  className={`p-3.5 hover:bg-[#1A1B1E] flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    value.savedId === item.id ? "bg-[#1A1B1E]/80" : ""
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#111214] border border-[#2A2B30] mt-0.5">
                      {getLabelIcon(item.label)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-display">
                          {item.label}
                        </span>
                        {item.fullName && (
                          <span className="text-[11px] text-[#A1A1AA]">
                            • {item.fullName}
                          </span>
                        )}
                        {value.savedId === item.id && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5 leading-relaxed">
                        {item.fullAddress}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSaved(e, item.id)}
                    className="text-[#A1A1AA] hover:text-red-400 p-2 rounded-xl hover:bg-[#111214] border border-transparent hover:border-red-500/30 transition-colors cursor-pointer shrink-0"
                    title="Delete saved address"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. Structured Form Fields */}
      <div className="space-y-4">
        {/* Row 1: House / Door No. & Street / Avenue */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#F97316]" />
              <span>House / Door No. *</span>
            </label>
            <Input
              placeholder="e.g. Flat 402 or No. 25/38"
              value={value.doorNo || ""}
              onChange={(e) => handleFieldChange("doorNo", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-2xl h-11 text-xs px-3.5 transition-all shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
              <Signpost className="h-3.5 w-3.5 text-[#F97316]" />
              <span>Street / Avenue *</span>
            </label>
            <Input
              placeholder="e.g. 18th Avenue, Tech Park Road"
              value={value.street || ""}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              className="bg-[#111214] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-2xl h-11 text-xs px-3.5 transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Row 2: Area / Locality */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#A1A1AA] flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-[#F97316]" />
            <span>Area / Locality *</span>
          </label>
          <Input
            placeholder="e.g. Koramangala 4th Block, Banunagar"
            value={value.area || ""}
            onChange={(e) => handleFieldChange("area", e.target.value)}
            className="bg-[#111214] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-2xl h-11 text-xs px-3.5 transition-all shadow-inner"
          />
        </div>

        {/* Row 3: Distinct Clustered Sub-Row for City, State, PIN Code */}
        <div className="rounded-2xl border border-[#2A2B30]/80 bg-[#111214]/60 p-4 space-y-3 shadow-sm">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#A1A1AA] font-semibold flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#F97316]" />
            <span>City, Region & Postal Code</span>
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#A1A1AA]">
                City *
              </label>
              <Input
                placeholder="e.g. Bengaluru"
                value={value.city || ""}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-xl h-10 text-xs px-3"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#A1A1AA]">
                State *
              </label>
              <Input
                placeholder="e.g. Karnataka"
                value={value.state || ""}
                onChange={(e) => handleFieldChange("state", e.target.value)}
                className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-xl h-10 text-xs px-3"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#A1A1AA]">
                PIN Code *
              </label>
              <Input
                placeholder="e.g. 560034"
                value={value.postalCode || ""}
                onChange={(e) =>
                  handleFieldChange("postalCode", e.target.value)
                }
                className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/30 rounded-xl h-10 text-xs font-mono px-3"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Intentional Address Preview Card */}
      {value.fullAddress && (
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-500/5 via-[#111214] to-[#111214] p-4 text-xs text-[#F4F4F5] shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <Check className="h-3 w-3" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 font-mono">
              Address Preview (Visible to Courier)
            </span>
          </div>
          <p className="font-medium text-white leading-relaxed pl-7 text-[12.5px]">
            {value.fullAddress}
          </p>
        </div>
      )}

      {/* 4. Action Row A: Location Detection Action */}
      <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#2A2B30] pt-4">
        <div>
          <p className="text-xs font-semibold text-white">
            Auto-detect My Location
          </p>
          <p className="text-[11px] text-[#A1A1AA] mt-0.5">
            Pinpoint GPS coordinates for courier routing
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isGpsLoading}
          onClick={handleUseCurrentLocation}
          className="border-[#2A2B30] bg-[#111214] hover:bg-[#1A1B1E] hover:border-[#F97316]/60 text-xs text-white gap-2 rounded-2xl py-2.5 px-4 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Navigation
            className={`h-3.5 w-3.5 text-[#F97316] ${isGpsLoading ? "animate-spin" : ""}`}
          />
          <span>{isGpsLoading ? "Locating..." : "Auto-detect Location"}</span>
        </Button>
      </div>

      {/* 5. Action Row B: Save Address Toggle & Segmented Label Chips */}
      <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2.5 text-xs font-semibold text-white cursor-pointer select-none">
            <input
              type="checkbox"
              checked={saveAddressOnOrder}
              onChange={(e) => onSaveAddressOnOrderChange(e.target.checked)}
              className="rounded-lg border-[#2A2B30] bg-[#1A1B1E] text-[#F97316] focus:ring-[#F97316] h-4 w-4 cursor-pointer accent-[#F97316]"
            />
            <span>Save address for future orders</span>
          </label>

          {saveAddressOnOrder && (
            <span className="text-[10px] uppercase font-mono text-[#FDBA74] tracking-wider">
              Preset Label
            </span>
          )}
        </div>

        {saveAddressOnOrder && (
          <div className="pt-2 border-t border-[#2A2B30]/60 space-y-3 animate-in fade-in-0 duration-200">
            <div>
              <span className="text-[11px] text-[#A1A1AA] font-medium block mb-2">
                Save this address as:
              </span>

              {/* Segmented Toggle Group */}
              <div className="grid grid-cols-4 gap-2 bg-[#1A1B1E] p-1.5 rounded-2xl border border-[#2A2B30]">
                {(["Home", "Work", "Friend", "Custom"] as const).map((lbl) => {
                  const active = selectedLabelType === lbl;
                  return (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => onSelectedLabelTypeChange(lbl)}
                      className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        active
                          ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.35)]"
                          : "text-[#A1A1AA] hover:text-white hover:bg-[#111214]/60"
                      }`}
                    >
                      {lbl === "Home" && <Home className="h-3 w-3" />}
                      {lbl === "Work" && <Building2 className="h-3 w-3" />}
                      {lbl === "Friend" && <Users className="h-3 w-3" />}
                      {lbl === "Custom" && <Bookmark className="h-3 w-3" />}
                      <span>{lbl}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom / Friend Name Field */}
            {(selectedLabelType === "Friend" ||
              selectedLabelType === "Custom") && (
              <div className="pt-1 animate-in fade-in-0 duration-150">
                <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
                  {selectedLabelType === "Friend"
                    ? "Recipient / Friend's Name *"
                    : "Custom Address Label *"}
                </label>
                <Input
                  placeholder={
                    selectedLabelType === "Friend"
                      ? "e.g. Rahul's Apartment or Arun"
                      : "e.g. Mom's House or Branch Office"
                  }
                  value={customLabelName}
                  onChange={(e) => onCustomLabelNameChange(e.target.value)}
                  className="bg-[#1A1B1E] border-[#2A2B30] text-xs text-white focus:border-[#F97316] rounded-xl h-10 px-3"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DeliveryAddressSection;
