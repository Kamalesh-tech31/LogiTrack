"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Package,
  MapPin,
  ArrowRight,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutMapPreview } from "./CheckoutMapPreview";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  totalAmount?: number;
  itemsCount?: number;
  deliveryAddress?: string;
  latitude?: number;
  longitude?: number;
}

export function OrderSuccessModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  itemsCount = 1,
  deliveryAddress,
  latitude,
  longitude,
}: OrderSuccessModalProps) {
  const [showLargeMap, setShowLargeMap] = useState(false);

  // Guarantee the large map is strictly closed whenever the confirmation modal opens or closes
  useEffect(() => {
    setShowLargeMap(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const safeLat =
    typeof latitude === "number" && !isNaN(latitude) ? latitude : 13.0827;
  const safeLng =
    typeof longitude === "number" && !isNaN(longitude) ? longitude : 80.2707;

  return (
    <>
      {/* Primary Order Confirmation Modal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors cursor-pointer z-10"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-2 pt-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-0.5">
              <h3 className="text-xl font-extrabold text-white font-display tracking-tight">
                Order Confirmed!
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Your shipment is registered and ready for fleet assignment.
              </p>
            </div>
          </div>

          {/* Map Preview Section (Strictly bounded inside modal) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#A1A1AA] px-0.5">
              <div className="flex items-center gap-1.5 uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-[#F97316]" />
                <span>Destination Map Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLargeMap(true)}
                className="inline-flex items-center gap-1 text-[#F97316] hover:text-[#EA580C] transition cursor-pointer font-bold text-[11px]"
              >
                <Maximize2 className="h-3 w-3" />
                <span>View Larger Map</span>
              </button>
            </div>

            {/* Bounded preview container: never overflows, never covers footer buttons */}
            <div className="relative h-44 sm:h-48 w-full rounded-2xl border border-[#2A2B30] overflow-hidden shadow-inner bg-[#111214] isolate z-0">
              <CheckoutMapPreview
                latitude={safeLat}
                longitude={safeLng}
                address={deliveryAddress}
                orderId={orderId}
                zoomControl={false}
                interactive={true}
              />
            </div>
          </div>

          {/* Order Details Card */}
          <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 space-y-2.5">
            {orderId && (
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2A2B30]">
                <span className="text-[#A1A1AA]">Order Reference</span>
                <span className="font-mono font-bold text-white">{orderId}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">Items Ordered</span>
              <span className="font-semibold text-white">
                {itemsCount} {itemsCount === 1 ? "Product" : "Products"}
              </span>
            </div>

            {typeof totalAmount === "number" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#A1A1AA]">Total Amount</span>
                <span className="font-bold text-[#F97316]">
                  ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            )}

            {deliveryAddress && (
              <div className="pt-2 border-t border-[#2A2B30] space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                  <MapPin className="h-3.5 w-3.5 text-[#F97316]" />
                  <span>Delivery Address</span>
                </div>
                <p className="text-xs text-[#F4F4F5] font-medium leading-relaxed pl-5 line-clamp-2">
                  {deliveryAddress}
                </p>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-1 relative z-20">
            <Button
              type="button"
              onClick={onClose}
              className="w-full h-11 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-2xl shadow-[0_0_14px_rgba(249,115,22,0.3)] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>View in My Orders</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Explicit Larger Map Modal (Opens ONLY when user clicks "View Larger Map") */}
      {showLargeMap && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl h-[80vh] bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-[#2A2B30] bg-[#111214]/90 z-10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316]">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display">
                    Delivery Destination Map (Full View)
                  </h4>
                  <p className="text-xs text-[#A1A1AA] truncate max-w-md">
                    {deliveryAddress || `Coordinates: ${safeLat.toFixed(4)}, ${safeLng.toFixed(4)}`}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowLargeMap(false)}
                className="border-[#2A2B30] bg-[#1A1B1E] hover:bg-[#2A2B30] text-white text-xs font-semibold rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Close Full Map</span>
              </Button>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 w-full relative bg-[#111214] isolate z-0">
              <CheckoutMapPreview
                latitude={safeLat}
                longitude={safeLng}
                address={deliveryAddress}
                orderId={orderId}
                zoom={15}
                zoomControl={true}
                interactive={true}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default OrderSuccessModal;
