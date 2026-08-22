"use client";

import React from "react";
import { CheckCircle2, Package, MapPin, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  totalAmount?: number;
  itemsCount?: number;
  deliveryAddress?: string;
}

export function OrderSuccessModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  itemsCount = 1,
  deliveryAddress,
}: OrderSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center space-y-3 pt-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-white font-display tracking-tight">
              Order Confirmed!
            </h3>
            <p className="text-xs text-[#A1A1AA]">
              Your shipment is registered and ready for fleet assignment.
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 space-y-3">
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
              <p className="text-xs text-[#F4F4F5] font-medium leading-relaxed pl-5">
                {deliveryAddress}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2">
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
  );
}

export default OrderSuccessModal;
