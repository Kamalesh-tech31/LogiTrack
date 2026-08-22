"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cancelOrder } from "@/lib/api";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onOrderCancelled?: (orderId: string) => void;
}

export function CancelOrderModal({
  isOpen,
  onClose,
  orderId,
  onOrderCancelled,
}: CancelOrderModalProps) {
  const [animState, setAnimState] = useState<
    "idle" | "cancelling" | "cancelled"
  >("idle");

  useEffect(() => {
    if (isOpen) {
      setAnimState("idle");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmCancel = async () => {
    setAnimState("cancelling");

    try {
      await cancelOrder(orderId);
      setAnimState("cancelled");

      // Hold ORDER CANCELLED state for 1.8 seconds, then finish
      setTimeout(() => {
        toast.success("Order has been cancelled and stock restored.");
        if (onOrderCancelled) {
          onOrderCancelled(orderId);
        }
        onClose();
      }, 1800);
    } catch (err: any) {
      const msg = err?.message || "Failed to cancel order.";
      toast.error(msg);
      setAnimState("idle");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <style jsx>{`
        @keyframes pulseGlowRed {
          0%,
          100% {
            box-shadow:
              0 0 18px rgba(239, 68, 68, 0.8),
              0 0 40px rgba(239, 68, 68, 0.35);
          }
          50% {
            box-shadow:
              0 0 28px rgba(239, 68, 68, 0.95),
              0 0 55px rgba(239, 68, 68, 0.5);
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {animState === "idle" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#A1A1AA] hover:text-white p-1 rounded-full transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {animState !== "cancelled" ? (
          <>
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white font-display tracking-tight">
                  Cancel Order?
                </h3>
                <p className="text-xs text-[#A1A1AA] leading-relaxed">
                  Are you sure you want to cancel order{" "}
                  <span className="font-mono text-white font-semibold">
                    {orderId}
                  </span>
                  ? Items will be returned to store inventory and this action
                  cannot be undone.
                </p>
              </div>
            </div>

            {animState === "idle" ? (
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#2A2B30]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-10 px-4 text-xs font-semibold border-[#2A2B30] bg-[#111214] hover:bg-[#1A1B1E] text-[#A1A1AA] hover:text-white rounded-xl cursor-pointer"
                >
                  Keep Order
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmCancel}
                  className="h-10 px-5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/30 cursor-pointer"
                >
                  Cancel Order
                </Button>
              </div>
            ) : (
              <div className="pt-3 pb-1 flex flex-col items-center justify-center">
                <div className="w-[214px] h-[52px] rounded-full bg-[#111214] border-[1.5px] border-[#2A2B30] flex items-center justify-center text-[#A1A1AA]">
                  <svg
                    className="w-5 h-5 animate-spin text-[#F97316]"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                    />
                    <path
                      className="opacity-90"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="py-5 flex flex-col items-center justify-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-[214px] h-[52px] rounded-full bg-[#111214] border-[2px] border-red-500 flex items-center justify-center animate-[pulseGlowRed_1.6s_infinite_ease-in-out]">
              <span className="text-[13.5px] font-extrabold tracking-[0.08em] uppercase text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)] font-display">
                ORDER CANCELLED
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] text-center">
              Order status updated and stock returned.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CancelOrderModal;
