"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  PackageCheck,
  ShoppingBag,
  ArrowRight,
  MapPin,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface OrderSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  totalAmount?: number;
  itemsCount?: number;
  deliveryAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export function OrderSuccessModal({
  isOpen,
  onClose,
  orderId,
  totalAmount,
  itemsCount = 1,
  deliveryAddress,
}: OrderSuccessModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#27272A] bg-[#111111] p-6 sm:p-8 shadow-2xl shadow-black/80 transition-all z-10 text-white animate-in fade-in-0 zoom-in-95 duration-200"
      >
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />

        {/* Icon & Status */}
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-inner">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>

          <h2 className="mt-5 text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Order Placed Successfully!
          </h2>
          <p className="mt-2 text-sm text-neutral-400 max-w-sm">
            Thank you! Your order has been placed successfully.
          </p>

          {orderId && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-[#1A1A1A] px-4 py-1.5 text-xs text-neutral-300">
              <ReceiptText className="h-3.5 w-3.5 text-neutral-400" />
              <span>Order ID:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {orderId}
              </span>
            </div>
          )}
        </div>

        {/* Order Details Card */}
        <div className="mt-6 space-y-3 rounded-2xl border border-[#27272A] bg-[#161616] p-4 text-sm">
          {totalAmount != null && (
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-neutral-400">Total Amount</span>
              <span className="text-base font-bold text-white">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>
          )}

          {itemsCount > 0 && (
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-neutral-400">Items Ordered</span>
              <span className="font-medium text-white">
                {itemsCount} {itemsCount === 1 ? "item" : "items"}
              </span>
            </div>
          )}

          {deliveryAddress &&
            (deliveryAddress.street || deliveryAddress.city) && (
              <div className="pt-0.5">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-red-500" />
                  <div className="text-left text-xs">
                    {deliveryAddress.fullName && (
                      <p className="font-semibold text-white">
                        {deliveryAddress.fullName}{" "}
                        {deliveryAddress.phone ? `(${deliveryAddress.phone})` : ""}
                      </p>
                    )}
                    <p className="text-neutral-400 mt-0.5">
                      {[
                        deliveryAddress.street,
                        deliveryAddress.city,
                        deliveryAddress.state,
                        deliveryAddress.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        <p className="mt-4 text-center text-xs text-neutral-500">
          A delivery agent will be assigned to fulfill your order soon.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            className="flex-1 gap-2 rounded-2xl py-3.5 bg-[#27272A] hover:bg-[#3F3F46] text-white"
            onClick={() => {
              onClose();
              router.push("/customer/products");
            }}
          >
            <ShoppingBag className="h-4 w-4" />
            Continue Shopping
          </Button>

          <Button
            variant="default"
            className="flex-1 gap-2 rounded-2xl py-3.5 bg-[#7F1D1D] hover:bg-[#991B1B] text-white shadow-lg shadow-red-950/40"
            onClick={() => {
              onClose();
              router.push("/customer/orders");
            }}
          >
            <PackageCheck className="h-4 w-4" />
            View Orders
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
