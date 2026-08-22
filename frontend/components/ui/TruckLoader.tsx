"use client";

import React from "react";

interface TruckLoaderProps {
  label?: string;
  className?: string;
}

export function TruckLoader({ label = "Processing...", className = "" }: TruckLoaderProps) {
  return (
    <div className={`inline-flex items-center justify-center gap-3 overflow-hidden ${className}`}>
      {/* Mini Track Canvas */}
      <div className="relative w-16 h-6 flex items-center overflow-hidden">
        {/* Dashed Road Line */}
        <div className="absolute inset-x-0 bottom-1.5 h-[1.5px] border-b border-dashed border-white/40" />

        {/* Animated Moving Truck */}
        <div className="truck-runner absolute bottom-1 flex items-center">
          <svg
            width="32"
            height="14"
            viewBox="0 0 32 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-[0_1px_4px_rgba(0,0,0,0.5)]"
          >
            {/* Cargo Box */}
            <rect x="1" y="2" width="18" height="9" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
            <rect x="3" y="5.5" width="14" height="1" fill="#F97316" />
            {/* Cabin */}
            <path d="M19 4 L25 4 L28 8 L29 9 L29 11 L19 11 Z" fill="#FFFFFF" fillOpacity="0.9" />
            <polygon points="24,5 27,8 24,8" fill="#111214" />
            {/* Headlight Dot */}
            <circle cx="29" cy="9.5" r="0.8" fill="#FDBA74" />
            {/* Wheels */}
            <circle cx="6" cy="11.5" r="2" fill="#111214" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="6" cy="11.5" r="0.8" fill="#F97316" />
            <circle cx="24" cy="11.5" r="2" fill="#111214" stroke="#FFFFFF" strokeWidth="0.8" />
            <circle cx="24" cy="11.5" r="0.8" fill="#F97316" />
          </svg>
        </div>
      </div>

      {label && <span className="text-sm font-semibold tracking-wide text-white">{label}</span>}

      <style jsx>{`
        .truck-runner {
          animation: truckPatrol 1.4s ease-in-out infinite alternate;
          will-change: transform;
        }

        @keyframes truckPatrol {
          0% {
            transform: translate3d(-6px, 0, 0);
          }
          100% {
            transform: translate3d(24px, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .truck-runner {
            animation: truckPulse 1s ease-in-out infinite alternate !important;
            transform: translate3d(10px, 0, 0) !important;
          }

          @keyframes truckPulse {
            0% {
              opacity: 0.6;
            }
            100% {
              opacity: 1;
            }
          }
        }
      `}</style>
    </div>
  );
}

export default TruckLoader;
