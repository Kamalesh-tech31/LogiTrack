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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SavedAddress,
  getSavedAddresses,
  deleteSavedAddress,
  buildFullAddress,
  parseAddressString,
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
}: DeliveryAddressSectionProps) {
  const [savedList, setSavedList] = useState<SavedAddress[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);
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

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setIsGpsActive(true);

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
          // Fallback to coordinates
        }

        onChange({
          ...value,
          latitude: lat,
          longitude: lon,
        });
      },
      (err) => {
        console.warn("Geolocation error:", err.message);
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
    <div className="space-y-5">
      {/* Top Controls: Saved Address Selector */}
      {savedList.length > 0 && (
        <div className="relative">
          <label className="block text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
            Saved Delivery Addresses
          </label>

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 text-left transition-all cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Bookmark className="h-4 w-4 text-[#F97316] shrink-0" />
              {value.savedId ? (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white">
                    {savedList.find((s) => s.id === value.savedId)?.label ||
                      "Saved Address"}
                  </span>
                  <span className="text-xs text-[#A1A1AA] truncate block mt-0.5">
                    {value.fullAddress}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-[#A1A1AA]">
                  Choose from {savedList.length} saved addresses...
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-[#A1A1AA] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#111214] border border-[#2A2B30] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#2A2B30] max-h-60 overflow-y-auto">
              {savedList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectSaved(item)}
                  className="p-3 hover:bg-[#1A1B1E] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <div className="min-w-0 flex items-start gap-2.5">
                    <div className="mt-0.5">{getLabelIcon(item.label)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">
                          {item.label}
                        </span>
                        {item.fullName && (
                          <span className="text-[11px] text-[#A1A1AA]">
                            • {item.fullName}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#A1A1AA] truncate mt-0.5">
                        {item.fullAddress}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteSaved(e, item.id)}
                    className="text-[#A1A1AA] hover:text-red-400 p-1.5 rounded-lg hover:bg-[#1A1B1E] transition-colors cursor-pointer shrink-0"
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

      {/* Structured Address Form */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#2A2B30]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#F97316]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Address Coordinates & Fields
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isGpsActive && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span>GPS Location Active</span>
              </span>
            )}
            {value.savedId && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#FDBA74] bg-[#F97316]/10 border border-[#F97316]/25 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                <span>Saved Address Loaded</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 1: House / Door No. & Street / Avenue */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              House / Door No. *
            </label>
            <Input
              placeholder="e.g. Flat 402 or No. 25/38"
              value={value.doorNo || ""}
              onChange={(e) => handleFieldChange("doorNo", e.target.value)}
              className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              Street / Avenue *
            </label>
            <Input
              placeholder="e.g. 18th Avenue, Tech Park Road"
              value={value.street || ""}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs"
            />
          </div>
        </div>

        {/* Row 2: Area / Locality */}
        <div>
          <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
            Area / Locality *
          </label>
          <Input
            placeholder="e.g. Koramangala 4th Block, Banunagar"
            value={value.area || ""}
            onChange={(e) => handleFieldChange("area", e.target.value)}
            className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs"
          />
        </div>

        {/* Row 3: City, State, PIN Code */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              City *
            </label>
            <Input
              placeholder="e.g. Bengaluru"
              value={value.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              State *
            </label>
            <Input
              placeholder="e.g. Karnataka"
              value={value.state || ""}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A1A1AA] mb-1.5">
              PIN Code *
            </label>
            <Input
              placeholder="e.g. 560034"
              value={value.postalCode || ""}
              onChange={(e) => handleFieldChange("postalCode", e.target.value)}
              className="bg-[#1A1B1E] border-[#2A2B30] text-white focus:border-[#F97316]/60 rounded-xl h-10 text-xs font-mono"
            />
          </div>
        </div>

        {/* Compiled Full Address Preview */}
        {value.fullAddress && (
          <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] p-3.5 text-xs text-[#F4F4F5]">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#A1A1AA] block mb-1">
              Full Destination Address (Passed to Agent):
            </span>
            <p className="font-medium leading-relaxed">{value.fullAddress}</p>
          </div>
        )}

        {/* Action Controls: Use Current Location & Save Address */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            className="border-[#2A2B30] bg-[#1A1B1E] hover:border-[#F97316]/50 text-xs text-[#F4F4F5] gap-2 rounded-xl py-2 px-3.5 transition-colors cursor-pointer"
          >
            <Navigation className="h-3.5 w-3.5 text-[#F97316]" />
            <span>Use Current Location (GPS)</span>
          </Button>

          {/* Save Address Toggle & Label Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-[#A1A1AA] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAddressOnOrder}
                onChange={(e) => onSaveAddressOnOrderChange(e.target.checked)}
                className="rounded border-[#2A2B30] bg-[#1A1B1E] text-[#F97316] focus:ring-[#F97316] h-3.5 w-3.5 cursor-pointer accent-[#F97316]"
              />
              <span>Save address for future orders</span>
            </label>

            {saveAddressOnOrder && (
              <div className="flex items-center gap-1 pl-1">
                {(["Home", "Work", "Friend", "Custom"] as const).map((lbl) => {
                  const active = selectedLabelType === lbl;
                  return (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => onSelectedLabelTypeChange(lbl)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
                        active
                          ? "border-[#F97316] bg-[#F97316]/20 text-white shadow-sm"
                          : "border-[#2A2B30] bg-[#1A1B1E] text-[#A1A1AA] hover:text-white"
                      }`}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Friend Name or Custom Name Input */}
        {saveAddressOnOrder &&
          (selectedLabelType === "Friend" ||
            selectedLabelType === "Custom") && (
            <div className="pt-2 animate-in fade-in-0 duration-150">
              <label className="block text-xs font-semibold text-[#A1A1AA] mb-1">
                {selectedLabelType === "Friend"
                  ? "Recipient / Friend's Name *"
                  : "Custom Address Label *"}
              </label>
              <Input
                placeholder={
                  selectedLabelType === "Friend"
                    ? "e.g. Rahul's Address or Arun"
                    : "e.g. Mom's House or Branch Office"
                }
                value={customLabelName}
                onChange={(e) => onCustomLabelNameChange(e.target.value)}
                className="bg-[#1A1B1E] border-[#2A2B30] text-xs text-white h-10 rounded-xl"
              />
            </div>
          )}
      </div>
    </div>
  );
}

export default DeliveryAddressSection;
