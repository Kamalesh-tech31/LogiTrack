"use client";

import React, { useState, useEffect } from "react";
import { Home, X, Check, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UniversalLocationPicker, LocationData } from "@/components/common/UniversalLocationPicker";
import { updateCurrentUser } from "@/lib/api";
import toast from "react-hot-toast";

interface HomeAddressPromptProps {
  user: any;
  onAddressSaved?: (newAddress: LocationData) => void;
}

export function HomeAddressPrompt({ user, onAddressSaved }: HomeAddressPromptProps) {
  const [isDismissed, setIsDismissed] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [addressData, setAddressData] = useState<LocationData>({
    doorNo: "",
    street: "",
    area: "",
    city: "Chennai",
    state: "Tamil Nadu",
    postalCode: "",
    country: "India",
    latitude: 13.0827,
    longitude: 80.2707,
  });

  useEffect(() => {
    // Only show if user is a Customer, has no defaultAddress, and hasn't dismissed in this session
    if (user && user.role === "Customer" && !user.defaultAddress?.latitude) {
      const dismissed = sessionStorage.getItem("dismissed_home_prompt");
      if (!dismissed) {
        setIsDismissed(false);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("dismissed_home_prompt", "true");
  };

  const handleSaveHomeAddress = async () => {
    if (!addressData.street || !addressData.city) {
      toast.error("Please provide at least a street name and city.");
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentUser({
        defaultAddress: {
          label: "Home",
          ...addressData,
        },
      });

      toast.success("Home address saved to profile!");
      setIsModalOpen(false);
      setIsDismissed(true);
      if (onAddressSaved) onAddressSaved(addressData);
    } catch (err: any) {
      toast.error(err.message || "Failed to save home address.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Non-blocking suggestion banner */}
      <div className="rounded-3xl border border-[#F97316]/30 bg-gradient-to-r from-[#F97316]/10 via-[#1A1B1E] to-[#1A1B1E] p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in-0 duration-300">
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.2)]">
            <Home className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">
              Add your Home Address for faster checkout
            </h4>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Save your address once to auto-suggest it when placing orders. You can always change delivery destinations at checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Button
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white rounded-xl px-4 py-2 shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer"
          >
            Add Home Address
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-xs text-[#A1A1AA] hover:text-white hover:bg-[#2A2B30] rounded-xl px-3 cursor-pointer"
          >
            Maybe Later
          </Button>
        </div>
      </div>

      {/* Interactive Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2A2B30] pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
                  <Home className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-white font-display">
                  Set Your Home Address
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#A1A1AA] hover:text-white p-1 rounded-lg hover:bg-[#2A2B30] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <UniversalLocationPicker
              value={addressData}
              onChange={setAddressData}
              title="Pinpoint your Home Location"
              subtitle="Use search, GPS, or click on the map to set coordinates."
              roleContext="customer"
            />

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#2A2B30]">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="border-[#2A2B30] text-xs text-[#A1A1AA] hover:text-white rounded-xl"
              >
                Cancel
              </Button>
              <Button
                disabled={isSaving}
                onClick={handleSaveHomeAddress}
                className="bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white rounded-xl px-5"
              >
                {isSaving ? "Saving..." : "Save Home Address"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
