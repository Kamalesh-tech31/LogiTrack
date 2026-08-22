"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  MapPin,
  Navigation,
  CheckCircle2,
  Home,
  Briefcase,
  User,
  Users,
  Plus,
  Trash2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getSavedAddresses,
  deleteSavedAddress,
  buildFullAddress,
  type SavedAddress,
} from "@/lib/addressStorage";

export interface StructuredAddressData {
  fullName: string;
  phone: string;
  doorNo: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  fullAddress: string;
  latitude: number | null;
  longitude: number | null;
  savedId?: string;
}

interface DeliveryAddressSectionProps {
  value: StructuredAddressData;
  onChange: (value: StructuredAddressData) => void;
  saveAddressOnOrder: boolean;
  onSaveAddressOnOrderChange: (save: boolean) => void;
  selectedLabelType: "Home" | "Work" | "Friend" | "Custom";
  onSelectedLabelTypeChange: (
    type: "Home" | "Work" | "Friend" | "Custom",
  ) => void;
  customLabelName: string;
  onCustomLabelNameChange: (name: string) => void;
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
}: DeliveryAddressSectionProps) {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(false);

  // Load saved addresses on initial mount
  useEffect(() => {
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const list = getSavedAddresses(userId);
    setSavedAddresses(list);

    // If saved addresses exist and current form has no address loaded, pre-select the first saved address
    if (
      list.length > 0 &&
      !value.doorNo &&
      !value.street &&
      !value.area &&
      !value.city &&
      !value.savedId
    ) {
      const first = list[0];
      const fullAddr =
        first.fullAddress ||
        buildFullAddress({
          doorNo: first.doorNo,
          street: first.street,
          area: first.area,
          city: first.city,
          state: first.state,
          postalCode: first.postalCode,
        });

      onChange({
        fullName: first.fullName || value.fullName || "",
        phone: first.phone || value.phone || "",
        doorNo: first.doorNo || "",
        street: first.street || "",
        area: first.area || "",
        city: first.city || "",
        state: first.state || "",
        postalCode: first.postalCode || "",
        fullAddress: fullAddr,
        latitude: first.latitude,
        longitude: first.longitude,
        savedId: first.id,
      });
    }
  }, []);

  // Update a structured field
  const handleFieldChange = (
    field: keyof Omit<
      StructuredAddressData,
      "fullAddress" | "latitude" | "longitude" | "savedId"
    >,
    newVal: string,
  ) => {
    setIsGpsActive(false);

    const updated = {
      ...value,
      [field]: newVal,
    };

    const compiled = buildFullAddress({
      doorNo: updated.doorNo,
      street: updated.street,
      area: updated.area,
      city: updated.city,
      state: updated.state,
      postalCode: updated.postalCode,
    });

    onChange({
      ...updated,
      fullAddress: compiled,
      savedId: undefined, // Detach from saved address since field was modified
    });
  };

  // Select a saved address card
  const handleSelectSavedAddress = (saved: SavedAddress) => {
    setIsGpsActive(false);

    const fullAddr =
      saved.fullAddress ||
      buildFullAddress({
        doorNo: saved.doorNo,
        street: saved.street,
        area: saved.area,
        city: saved.city,
        state: saved.state,
        postalCode: saved.postalCode,
      });

    const populated: StructuredAddressData = {
      fullName: saved.fullName || value.fullName || "",
      phone: saved.phone || value.phone || "",
      doorNo: saved.doorNo || "",
      street: saved.street || "",
      area: saved.area || "",
      city: saved.city || "",
      state: saved.state || "",
      postalCode: saved.postalCode || "",
      fullAddress: fullAddr,
      latitude: typeof saved.latitude === "number" ? saved.latitude : 13.0827,
      longitude: typeof saved.longitude === "number" ? saved.longitude : 80.2707,
      savedId: saved.id,
    };

    onChange(populated);
    toast.success(`Loaded saved address (${saved.label})`);
  };

  // Start a fresh address
  const handleAddNewAddress = () => {
    setIsGpsActive(false);
    onChange({
      fullName: value.fullName,
      phone: value.phone,
      doorNo: "",
      street: "",
      area: "",
      city: "",
      state: "",
      postalCode: "",
      fullAddress: "",
      latitude: null,
      longitude: null,
      savedId: undefined,
    });
  };

  // Delete a saved address
  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const updated = deleteSavedAddress(id, userId);
    setSavedAddresses(updated);

    if (value.savedId === id) {
      handleAddNewAddress();
    }
    toast.success("Saved address removed.");
  };

  // Use browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    toast.loading("Detecting current device location...", { id: "geo-toast" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setIsGpsActive(true);

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            {
              headers: { "User-Agent": "LogiTrack/1.0" },
            },
          );
          if (resp.ok) {
            const data = await resp.json();
            const addr = data.address || {};

            const streetName =
              addr.road || addr.street || addr.pedestrian || "";
            const areaName =
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              addr.subdistrict ||
              "";
            const cityName =
              addr.city ||
              addr.town ||
              addr.village ||
              addr.county ||
              addr.state_district ||
              "";
            const stateName = addr.state || "";
            const postalCode = addr.postcode || "";

            const updatedData = {
              ...value,
              doorNo: value.doorNo || addr.house_number || "",
              street: streetName || value.street,
              area: areaName || value.area,
              city: cityName || value.city,
              state: stateName || value.state,
              postalCode: postalCode || value.postalCode,
              latitude: lat,
              longitude: lon,
              savedId: undefined,
            };

            const compiled = buildFullAddress({
              doorNo: updatedData.doorNo,
              street: updatedData.street,
              area: updatedData.area,
              city: updatedData.city,
              state: updatedData.state,
              postalCode: updatedData.postalCode,
            });

            onChange({
              ...updatedData,
              fullAddress: compiled,
            });
            toast.success("Location captured and populated into fields.", {
              id: "geo-toast",
            });
          } else {
            onChange({
              ...value,
              latitude: lat,
              longitude: lon,
              savedId: undefined,
            });
            toast.success(
              "Coordinates captured. Please fill your address fields.",
              {
                id: "geo-toast",
              },
            );
          }
        } catch {
          onChange({
            ...value,
            latitude: lat,
            longitude: lon,
            savedId: undefined,
          });
          toast.success(
            "Coordinates captured. Please fill your address fields.",
            {
              id: "geo-toast",
            },
          );
        }
      },
      (error) => {
        toast.error(`Unable to get location: ${error.message}`, {
          id: "geo-toast",
        });
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("home")) return <Home className="h-3.5 w-3.5" />;
    if (l.includes("work") || l.includes("office"))
      return <Briefcase className="h-3.5 w-3.5" />;
    if (l.includes("friend") || l.includes("'s"))
      return <Users className="h-3.5 w-3.5" />;
    return <User className="h-3.5 w-3.5" />;
  };

  return (
    <div className="space-y-6">
      {/* Saved Addresses Section */}
      {savedAddresses.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Saved Addresses
            </span>
            {value.savedId && (
              <button
                type="button"
                onClick={handleAddNewAddress}
                className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" /> Enter New Address
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedAddresses.map((saved) => {
              const isSelected = value.savedId === saved.id;
              return (
                <div
                  key={saved.id}
                  onClick={() => handleSelectSavedAddress(saved)}
                  className={`group relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#7F1D1D] bg-[#1C1C1C] ring-2 ring-[#7F1D1D]/70 shadow-lg shadow-red-950/30"
                      : "border-neutral-800 bg-[#111111] hover:border-neutral-700 hover:bg-[#161616]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          isSelected
                            ? "bg-[#7F1D1D] text-white font-semibold"
                            : "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {getLabelIcon(saved.label)}
                        {saved.label}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      title="Delete saved address"
                      onClick={(e) => handleDeleteSaved(saved.id, e)}
                      className="text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="mt-2.5 text-xs font-semibold text-white truncate">
                    {saved.fullName} • {saved.phone}
                  </p>
                  <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {saved.fullAddress}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipient Details Section */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Recipient Contact
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Full Name *
            </label>
            <Input
              placeholder="e.g. Jane Doe"
              value={value.fullName || ""}
              onChange={(e) => handleFieldChange("fullName", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Phone Number *
            </label>
            <Input
              type="tel"
              placeholder="e.g. 9876543210"
              value={value.phone || ""}
              onChange={(e) => handleFieldChange("phone", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Structured Delivery Address Form */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-red-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Delivery Address Details
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isGpsActive && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Current Device Location (GPS)
              </span>
            )}
            {value.savedId && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-950/40 border border-red-800/40 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" />
                Saved Address Loaded
              </span>
            )}
          </div>
        </div>

        {/* Row 1: House / Door No. & Street / Avenue */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              House / Door No. *
            </label>
            <Input
              placeholder="e.g. 25/38 or Flat 402"
              value={value.doorNo || ""}
              onChange={(e) => handleFieldChange("doorNo", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              Street / Avenue *
            </label>
            <Input
              placeholder="e.g. 18th Avenue"
              value={value.street || ""}
              onChange={(e) => handleFieldChange("street", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Row 2: Area / Locality */}
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Area / Locality *
          </label>
          <Input
            placeholder="e.g. Banunagar, Pudur, Ambattur"
            value={value.area || ""}
            onChange={(e) => handleFieldChange("area", e.target.value)}
            suppressHydrationWarning
            className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
          />
        </div>

        {/* Row 3: City, State, PIN Code */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              City *
            </label>
            <Input
              placeholder="e.g. Chennai"
              value={value.city || ""}
              onChange={(e) => handleFieldChange("city", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              State *
            </label>
            <Input
              placeholder="e.g. Tamil Nadu"
              value={value.state || ""}
              onChange={(e) => handleFieldChange("state", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5">
              PIN Code *
            </label>
            <Input
              placeholder="e.g. 600053"
              value={value.postalCode || ""}
              onChange={(e) => handleFieldChange("postalCode", e.target.value)}
              suppressHydrationWarning
              className="bg-[#161616] border-neutral-800 focus:border-[#7F1D1D] text-white h-11 rounded-xl"
            />
          </div>
        </div>

        {/* Compiled Full Address Preview */}
        {value.fullAddress && (
          <div className="rounded-xl border border-neutral-800/80 bg-[#0E0E0E] p-3.5 text-xs text-neutral-300">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 block mb-1">
              Compiled Delivery Address:
            </span>
            <p className="font-medium text-neutral-200 leading-relaxed">
              {value.fullAddress}
            </p>
          </div>
        )}

        {/* Action Controls: Use Current Location & Save Address */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseCurrentLocation}
            className="border-neutral-800 bg-[#161616] hover:bg-neutral-800 text-xs text-neutral-300 gap-2 rounded-xl py-2 px-3.5 transition-colors self-start cursor-pointer"
          >
            <Navigation className="h-3.5 w-3.5 text-red-500" />
            Use Current Location
          </Button>

          {/* Save Address Toggle & Label Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAddressOnOrder}
                onChange={(e) => onSaveAddressOnOrderChange(e.target.checked)}
                className="rounded border-neutral-700 bg-neutral-900 text-red-600 focus:ring-[#7F1D1D] h-3.5 w-3.5 cursor-pointer"
              />
              <span>Save for future orders</span>
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
                      className={`px-2.5 py-1 text-[11px] rounded-lg border transition-all cursor-pointer ${
                        active
                          ? "border-[#7F1D1D] bg-[#7F1D1D]/20 text-white font-medium shadow-sm"
                          : "border-neutral-800 bg-[#161616] text-neutral-400 hover:text-white"
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
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                {selectedLabelType === "Friend"
                  ? "Friend's Name / Address Label *"
                  : "Custom Address Label *"}
              </label>
              <Input
                placeholder={
                  selectedLabelType === "Friend"
                    ? "e.g. Rahul's Address or Arun"
                    : "e.g. Mom's Place or Warehouse"
                }
                value={customLabelName}
                onChange={(e) => onCustomLabelNameChange(e.target.value)}
                className="bg-[#161616] border-neutral-800 text-xs text-white h-10 rounded-xl"
              />
            </div>
          )}
      </div>
    </div>
  );
}
