"use client";

import React from "react";

export function VehicleAnimation() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%), linear-gradient(to bottom, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%), linear-gradient(to bottom, black 85%, transparent 100%)",
      }}
    >
      {/* ---------------------------------------------------- */}
      {/* 1. EXPANSIVE LOGISTICS MAP GRID & ARTERIAL HIGHWAYS   */}
      {/* ---------------------------------------------------- */}
      <svg
        className="absolute inset-0 h-full w-full opacity-35"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="logitrack-grid-pattern-v2"
            width="72"
            height="72"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 72 0 L 0 0 0 72"
              fill="none"
              stroke="#2A2B30"
              strokeWidth="0.85"
            />
            <circle cx="72" cy="72" r="1.5" fill="#F97316" fillOpacity="0.35" />
          </pattern>

          <linearGradient id="route-top" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.05" />
            <stop offset="30%" stopColor="#F97316" stopOpacity="0.6" />
            <stop offset="70%" stopColor="#FDBA74" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="route-bottom" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.05" />
            <stop offset="40%" stopColor="#FDBA74" stopOpacity="0.65" />
            <stop offset="80%" stopColor="#F97316" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.05" />
          </linearGradient>

          <linearGradient id="headlight-beam-lg-v2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#F97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="headlight-beam-rev-v2" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FDBA74" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#F97316" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#logitrack-grid-pattern-v2)" />

        {/* TOP PERIPHERAL HIGHWAY (Well above headline safe zone) */}
        <path
          d="M -200 90 C 400 60, 900 110, 1500 80 C 2000 55, 2400 100, 2900 85"
          fill="none"
          stroke="url(#route-top)"
          strokeWidth="2"
          strokeDasharray="8 8"
        />

        {/* BOTTOM PERIPHERAL HIGHWAYS (Well below CTA buttons safe zone) */}
        <path
          d="M -200 780 C 350 820, 850 750, 1400 800 C 1950 840, 2400 770, 2900 790"
          fill="none"
          stroke="url(#route-bottom)"
          strokeWidth="2"
          strokeDasharray="10 10"
        />

        <path
          d="M -200 880 C 450 850, 950 910, 1550 870 C 2050 830, 2500 890, 2900 860"
          fill="none"
          stroke="url(#route-top)"
          strokeWidth="2"
          strokeDasharray="6 8"
        />
      </svg>

      {/* ---------------------------------------------------- */}
      {/* 2. PERIPHERAL WAYPOINT HUBS (OUTSIDE TEXT SAFE ZONE) */}
      {/* ---------------------------------------------------- */}
      {/* Top Left Flank Hub */}
      <div className="absolute top-[85px] left-[10%] -translate-x-1/2 -translate-y-1/2">
        <span className="absolute -inset-3 rounded-full bg-[#F97316]/30 animate-ping duration-1000" />
        <span className="relative block h-3.5 w-3.5 rounded-full bg-[#F97316] shadow-[0_0_15px_#F97316]" />
        <span className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold tracking-widest text-[#FDBA74] bg-[#111214]/90 px-2 py-0.5 rounded border border-[#F97316]/30 shadow-sm">
          HUB • NORTH 01
        </span>
      </div>

      {/* Far Right Margin Hub */}
      <div className="absolute top-[120px] right-[6%] translate-x-1/2 -translate-y-1/2 hidden md:block">
        <span className="absolute -inset-3 rounded-full bg-[#F97316]/30 animate-ping duration-1000" />
        <span className="relative block h-3.5 w-3.5 rounded-full bg-[#F97316] shadow-[0_0_15px_#F97316]" />
        <span className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold tracking-widest text-[#FDBA74] bg-[#111214]/90 px-2 py-0.5 rounded border border-[#F97316]/30 shadow-sm">
          HUB • CENTRAL 04
        </span>
      </div>

      {/* Bottom Left Flank Hub */}
      <div className="absolute top-[800px] left-[12%] -translate-x-1/2 -translate-y-1/2 hidden sm:block">
        <span className="absolute -inset-3 rounded-full bg-[#F97316]/30 animate-ping duration-1000" />
        <span className="relative block h-3.5 w-3.5 rounded-full bg-[#F97316] shadow-[0_0_15px_#F97316]" />
        <span className="absolute top-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-mono font-bold tracking-wider text-[#FDBA74] bg-[#111214]/90 px-2 py-0.5 rounded border border-[#F97316]/30 shadow-sm">
          HUB • GATEWAY 09
        </span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 3. MINIMALIST TRAFFIC SIGNAL INDICATORS               */}
      {/* ---------------------------------------------------- */}
      {/* Top Arterial Traffic Signal (Left Flank) */}
      <div className="absolute top-[65px] left-[28%] flex items-center gap-2 bg-[#1A1B1E]/90 border border-[#2A2B30] px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex flex-col gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-pulse" />
        </div>
        <span className="text-[9px] font-mono font-semibold tracking-wider text-[#A1A1AA]">
          SIG-01 • FLOW CLEAR
        </span>
      </div>

      {/* Bottom Arterial Traffic Signal (Right Flank) */}
      <div className="absolute top-[755px] right-[14%] flex items-center gap-2 bg-[#1A1B1E]/90 border border-[#2A2B30] px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md hidden sm:flex">
        <div className="flex flex-col gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-500/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E] animate-pulse" />
        </div>
        <span className="text-[9px] font-mono font-semibold tracking-wider text-[#A1A1AA]">
          SIG-04 • DISPATCH ACTIVE
        </span>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 4. PERIPHERAL VEHICLE STREAMS (ZERO TEXT OVERLAP)     */}
      {/* ---------------------------------------------------- */}

      {/* TOP LANE: Heavy Freight Rig (Eastbound, High Above Headline) */}
      <div className="vehicle-lane absolute top-[55px] w-full">
        <div className="drift-top-rig flex items-center">
          <div className="relative flex items-center">
            <svg
              width="230"
              height="60"
              viewBox="0 0 230 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
            >
              {/* Headlight Beam */}
              <polygon points="226,32 305,16 305,48 226,38" fill="url(#headlight-beam-lg-v2)" />

              {/* Cargo Container Trailer */}
              <rect x="0" y="8" width="154" height="40" rx="3" fill="#1E2024" stroke="#3A3D45" strokeWidth="2" />
              <rect x="12" y="23" width="128" height="4" rx="2" fill="#F97316" />
              <circle cx="22" cy="15" r="2.5" fill="#FDBA74" />

              {/* Connector */}
              <rect x="154" y="28" width="10" height="10" fill="#2A2B30" />

              {/* Tractor Cabin */}
              <path
                d="M164 16 L196 16 L216 28 L226 30 L226 46 L164 46 Z"
                fill="#24272E"
                stroke="#3A3D45"
                strokeWidth="2"
              />
              <polygon points="192,20 212,28 192,28" fill="#111214" />
              <circle cx="226" cy="34" r="2.5" fill="#FDBA74" />

              {/* Wheels */}
              <circle cx="24" cy="48" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="24" cy="48" r="2.5" fill="#F97316" />
              <circle cx="48" cy="48" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="48" cy="48" r="2.5" fill="#F97316" />
              <circle cx="125" cy="48" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="125" cy="48" r="2.5" fill="#F97316" />
              <circle cx="202" cy="48" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="202" cy="48" r="2.5" fill="#F97316" />
            </svg>
          </div>
        </div>
      </div>

      {/* BOTTOM LANE 1: Urban Delivery Van (Eastbound, Below CTA Buttons) */}
      <div className="vehicle-lane absolute top-[745px] w-full">
        <div className="drift-bottom-van flex items-center">
          <div className="relative flex items-center">
            <svg
              width="165"
              height="52"
              viewBox="0 0 165 52"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
            >
              {/* Headlight Beam */}
              <polygon points="161,27 220,15 220,40 161,33" fill="url(#headlight-beam-lg-v2)" />

              {/* Van Body */}
              <path
                d="M4 10 C4 6 8 5 12 5 L116 5 L148 21 L161 25 L161 40 L4 40 Z"
                fill="#202227"
                stroke="#3A3D45"
                strokeWidth="2"
              />
              <line x1="16" y1="21" x2="102" y2="21" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="116,9 142,22 116,22" fill="#111214" />
              <circle cx="161" cy="29" r="2.5" fill="#FDBA74" />

              {/* Wheels */}
              <circle cx="32" cy="41" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="32" cy="41" r="2.5" fill="#F97316" />
              <circle cx="132" cy="41" r="7.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="132" cy="41" r="2.5" fill="#F97316" />
            </svg>
          </div>
        </div>
      </div>

      {/* BOTTOM LANE 2: Courier Sprinter (Westbound, Lowest Margin) */}
      <div className="vehicle-lane absolute top-[845px] w-full hidden sm:block">
        <div className="drift-bottom-courier flex items-center">
          <div className="relative flex items-center">
            <svg
              width="140"
              height="46"
              viewBox="0 0 140 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.8)]"
            >
              {/* Reverse Headlight Projection (Facing Left) */}
              <polygon points="4,25 -55,14 -55,36 4,31" fill="url(#headlight-beam-rev-v2)" />

              {/* Sprinter Body Facing Left */}
              <path
                d="M136 8 L44 8 L18 20 L4 23 L4 34 L136 34 Z"
                fill="#24272E"
                stroke="#3A3D45"
                strokeWidth="2"
              />
              <line x1="48" y1="18" x2="124" y2="18" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
              <polygon points="42,11 22,21 42,21" fill="#111214" />
              <circle cx="4" cy="27" r="2.5" fill="#FDBA74" />

              {/* Wheels */}
              <circle cx="28" cy="35" r="6.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="28" cy="35" r="2.5" fill="#F97316" />
              <circle cx="112" cy="35" r="6.5" fill="#111214" stroke="#3A3D45" strokeWidth="2" />
              <circle cx="112" cy="35" r="2.5" fill="#F97316" />
            </svg>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 5. HARDWARE-ACCELERATED GPU DRIFT KEYFRAMES          */}
      {/* ---------------------------------------------------- */}
      <style jsx>{`
        .vehicle-lane {
          will-change: transform;
        }

        .drift-top-rig {
          width: fit-content;
          will-change: transform;
          animation: driftL2R 32s linear infinite;
        }

        .drift-bottom-van {
          width: fit-content;
          will-change: transform;
          animation: driftL2R 24s linear infinite;
          animation-delay: -9s;
        }

        .drift-bottom-courier {
          width: fit-content;
          will-change: transform;
          animation: driftR2L 20s linear infinite;
          animation-delay: -5s;
        }

        @keyframes driftL2R {
          0% {
            transform: translate3d(-350px, 0, 0);
          }
          100% {
            transform: translate3d(calc(100vw + 350px), 0, 0);
          }
        }

        @keyframes driftR2L {
          0% {
            transform: translate3d(calc(100vw + 350px), 0, 0);
          }
          100% {
            transform: translate3d(-350px, 0, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .drift-top-rig,
          .drift-bottom-van,
          .drift-bottom-courier {
            animation: none !important;
            transform: translate3d(15vw, 0, 0) !important;
          }
        }
      `}</style>
    </div>
  );
}

export default VehicleAnimation;
