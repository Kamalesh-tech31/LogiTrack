"use client";

import React, { useState, useEffect } from "react";

export type OrderAnimationState = "idle" | "loading" | "truck" | "success";

interface OrderCompletionPillProps {
  onClick: () => Promise<boolean | void> | boolean | void;
  disabled?: boolean;
  onAnimationFinished?: () => void;
  className?: string;
}

export function OrderCompletionPill({
  onClick,
  disabled = false,
  onAnimationFinished,
  className = "",
}: OrderCompletionPillProps) {
  const [animState, setAnimState] = useState<OrderAnimationState>("idle");

  const handleClick = async () => {
    if (disabled || animState !== "idle") return;

    setAnimState("loading");

    try {
      // Execute the order placement handler provided by parent
      const result = await onClick();

      // If handler returns false (e.g. validation error or backend rejection), revert to idle
      if (result === false) {
        setAnimState("idle");
        return;
      }

      // Backend succeeded -> trigger the yellow delivery truck animation
      setAnimState("truck");
    } catch (err) {
      console.error("Order completion error:", err);
      setAnimState("idle");
    }
  };

  useEffect(() => {
    let truckTimer: NodeJS.Timeout;
    let successTimer: NodeJS.Timeout;

    if (animState === "truck") {
      // Hold yellow delivery truck animation for 2.2 seconds
      truckTimer = setTimeout(() => {
        setAnimState("success");
      }, 2200);
    } else if (animState === "success") {
      // Hold green ORDER PLACED state for 1.8 seconds, then trigger post-order callback
      successTimer = setTimeout(() => {
        if (onAnimationFinished) {
          onAnimationFinished();
        }
      }, 1800);
    }

    return () => {
      clearTimeout(truckTimer);
      clearTimeout(successTimer);
    };
  }, [animState, onAnimationFinished]);

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      {/* Dynamic CSS Keyframes */}
      <style jsx>{`
        @keyframes roadDash {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -32;
          }
        }
        @keyframes truckRide {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-1.2px);
          }
        }
        @keyframes borderYellowRunner {
          0% {
            stroke-dashoffset: 240;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes pulseGlowGreen {
          0%, 100% {
            box-shadow: 0 0 20px rgba(0, 255, 102, 0.85), 0 0 45px rgba(0, 255, 102, 0.4);
          }
          50% {
            box-shadow: 0 0 28px rgba(0, 255, 102, 1), 0 0 60px rgba(0, 255, 102, 0.55);
          }
        }
        @keyframes pulseGlowYellow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255, 225, 0, 0.85), 0 0 45px rgba(255, 215, 0, 0.4);
          }
          50% {
            box-shadow: 0 0 30px rgba(255, 225, 0, 1), 0 0 65px rgba(255, 215, 0, 0.6);
          }
        }
      `}</style>

      {/* Main Pill Button Container */}
      <div className="relative">
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled || animState !== "idle"}
          className={`
            relative z-10 w-[214px] h-[52px] rounded-full flex items-center justify-center
            transition-all duration-300 outline-none cursor-pointer
            ${
              animState === "idle"
                ? "bg-[#060606] border-[1.5px] border-white/80 text-white shadow-[0_0_12px_rgba(255,255,255,0.12)] hover:border-white hover:shadow-[0_0_18px_rgba(255,255,255,0.25)] active:scale-[0.98]"
                : animState === "loading"
                ? "bg-[#060606] border-[1.5px] border-white/40 text-white/70"
                : animState === "truck"
                ? "bg-[#060606] border-[2px] border-[#FFE600] animate-[pulseGlowYellow_1.6s_infinite_ease-in-out]"
                : "bg-[#060606] border-[2px] border-[#00FF66] animate-[pulseGlowGreen_1.6s_infinite_ease-in-out]"
            }
          `}
        >
          {/* STATE 1: IDLE */}
          {animState === "idle" && (
            <span className="text-[13.5px] font-extrabold tracking-[0.06em] uppercase text-white font-sans">
              COMPLETE ORDER
            </span>
          )}

          {/* STATE 2: LOADING */}
          {animState === "loading" && (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
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
          )}

          {/* STATE 3: YELLOW DELIVERY TRUCK */}
          {animState === "truck" && (
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
              {/* Glowing Yellow Perimeter Border Trace */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 214 52"
                fill="none"
              >
                <rect
                  x="2"
                  y="2"
                  width="210"
                  height="48"
                  rx="24"
                  stroke="#FFE600"
                  strokeWidth="2"
                  strokeDasharray="90 120"
                  style={{ animation: "borderYellowRunner 1.5s linear infinite" }}
                />
              </svg>

              {/* Truck Icon and Moving Road Line */}
              <div className="flex flex-col items-center justify-center z-10 pt-0.5">
                {/* Truck Graphic */}
                <div style={{ animation: "truckRide 0.4s ease-in-out infinite" }}>
                  <svg
                    className="w-10 h-6 text-[#FFE600]"
                    viewBox="0 0 38 24"
                    fill="currentColor"
                  >
                    {/* Cargo Box */}
                    <rect x="2" y="3" width="20" height="13.5" rx="1.5" fill="#FFE600" />
                    {/* Truck Cabin */}
                    <path
                      d="M22 6.5H28.5L34 11.5V16.5H22V6.5Z"
                      fill="#FFE600"
                    />
                    {/* Cabin Window */}
                    <path
                      d="M24 8.5H27.5L31.5 12H24V8.5Z"
                      fill="#060606"
                    />
                    {/* Front Wheel */}
                    <circle cx="28" cy="17.5" r="3.2" fill="#060606" stroke="#FFE600" strokeWidth="1.8" />
                    {/* Rear Wheel */}
                    <circle cx="10" cy="17.5" r="3.2" fill="#060606" stroke="#FFE600" strokeWidth="1.8" />
                  </svg>
                </div>

                {/* Dashed Road Line */}
                <svg className="w-28 h-1.5 mt-0.5" viewBox="0 0 112 6" fill="none">
                  <line
                    x1="0"
                    y1="3"
                    x2="112"
                    y2="3"
                    stroke="#FFE600"
                    strokeWidth="1.5"
                    strokeDasharray="6 6"
                    style={{ animation: "roadDash 0.35s linear infinite" }}
                  />
                </svg>
              </div>
            </div>
          )}

          {/* STATE 4: SUCCESS - ORDER PLACED */}
          {animState === "success" && (
            <div className="flex items-center justify-center">
              <span className="text-[13.5px] font-extrabold tracking-[0.08em] uppercase text-white drop-shadow-[0_0_10px_rgba(0,255,102,0.9)] font-sans">
                ORDER PLACED
              </span>
            </div>
          )}
        </button>

        {/* Attached Bottom Center Ring/Circle (in idle state matching reference) */}
        {animState === "idle" && (
          <div className="absolute left-1/2 -bottom-[9px] -translate-x-1/2 w-[22px] h-[22px] rounded-full border-[1.5px] border-white/80 bg-[#060606] z-0 transition-opacity duration-200" />
        )}
      </div>
    </div>
  );
}
