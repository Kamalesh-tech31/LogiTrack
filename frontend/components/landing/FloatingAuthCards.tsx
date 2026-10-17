"use client";

import React from "react";
import {
  Package,
  ShieldCheck,
  TrendingUp,
  KeyRound,
  FileCheck2,
  Truck,
  Activity,
  Boxes,
  Clock,
  Radio,
} from "lucide-react";

interface FloatingAuthCardsProps {
  variant?: "login" | "register" | "approval";
}

export function FloatingAuthCards({ variant = "login" }: FloatingAuthCardsProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0 hidden lg:block"
    >
      {/* ---------------------------------------------------- */}
      {/* 1. LOGIN VARIANT CARDS                               */}
      {/* ---------------------------------------------------- */}
      {variant === "login" && (
        <>
          {/* Card 1: Top-Left In-Transit Route Card */}
          <div className="orbit-card orbit-card-1 absolute top-[8%] left-[3%] xl:left-[6%] w-64 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Package size={14} className="text-[#F97316]" />
                <span>Order #4471</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#FDBA74] bg-[#F97316]/15 border border-[#F97316]/30 px-2 py-0.5 rounded-full">
                IN TRANSIT
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-2">
              Warehouse B → City Hub
            </p>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-[#F4F4F5]">
              <span className="text-[#A1A1AA]">ETA</span>
              <span className="text-[#22C55E] font-bold">14 mins</span>
            </div>
          </div>

          {/* Card 2: Top-Center-Right Fleet Agent Card */}
          <div className="orbit-card orbit-card-2 absolute top-[6%] right-[20%] xl:right-[24%] w-56 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/65 p-3.5 shadow-xl backdrop-blur-md opacity-30 hover:opacity-45 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Truck size={14} className="text-[#F97316]" />
                <span>Agent #902</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            </div>
            <p className="text-[11px] text-[#A1A1AA] mt-1.5 font-mono">
              3 Active Deliveries Assigned
            </p>
          </div>

          {/* Card 3: Upper-Right Live GPS Radar Card */}
          <div className="orbit-card orbit-card-3 absolute top-[14%] right-[3%] xl:right-[6%] w-60 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-[#22C55E] animate-pulse" />
                <span className="text-xs font-semibold text-white">Live GPS Ping</span>
              </div>
              <span className="text-[10px] font-mono text-[#22C55E] bg-[#22C55E]/10 px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono font-bold text-[#FDBA74] mt-2">
              12.9 km to destination
            </p>
            <div className="mt-1.5 text-[10px] font-mono text-[#A1A1AA]">
              LAT: 13.0827 | LON: 80.2707
            </div>
          </div>

          {/* Card 4: Mid-Left Inventory Intelligence Card */}
          <div className="orbit-card orbit-card-4 absolute top-[44%] left-[2%] xl:left-[5%] w-56 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/65 p-3.5 shadow-xl backdrop-blur-md opacity-25 hover:opacity-40 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <Boxes size={14} className="text-[#F97316]" />
                Inventory
              </span>
              <span className="text-[10px] font-mono text-[#FDBA74]">142 SKUs</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#A1A1AA]">
              <Clock size={11} className="text-[#F97316]" />
              <span>Next Restock in 2 Days</span>
            </div>
          </div>

          {/* Card 5: Bottom-Left KYC Verified Security Card */}
          <div className="orbit-card orbit-card-5 absolute bottom-[12%] left-[4%] xl:left-[7%] w-56 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-3.5 shadow-xl backdrop-blur-xl opacity-30 hover:opacity-45 transition-opacity">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E]">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">100% KYC Verified</p>
                <p className="text-[10px] text-[#A1A1AA]">Cloudinary Vault Secured</p>
              </div>
            </div>
          </div>

          {/* Card 6: Bottom-Right Daily Revenue Volume Card */}
          <div className="orbit-card orbit-card-6 absolute bottom-[14%] right-[4%] xl:right-[7%] w-60 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA]">Daily Fleet Volume</span>
              <TrendingUp size={14} className="text-[#22C55E]" />
            </div>
            <p className="text-xl font-extrabold text-white mt-1">₹48,250</p>
            <p className="text-[10px] text-[#22C55E] mt-1 font-medium">
              +18.4% vs benchmark
            </p>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. REGISTER VARIANT CARDS                             */}
      {/* ---------------------------------------------------- */}
      {variant === "register" && (
        <>
          {/* Card 1: Automated KYC Pipeline */}
          <div className="orbit-card orbit-card-1 absolute top-[8%] left-[2%] xl:left-[5%] w-64 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-xl backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
                <FileCheck2 size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Automated KYC</p>
                <p className="text-[10px] text-[#A1A1AA]">GST & License Verification</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#22C55E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
              <span>Brevo Instant Email Alert</span>
            </div>
          </div>

          {/* Card 2: Top Right Zero-Trust OTP Token */}
          <div className="orbit-card orbit-card-3 absolute top-[10%] right-[2%] xl:right-[5%] w-60 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-xl backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <KeyRound size={14} className="text-[#F97316]" />
              <span>Zero-Trust Protocol</span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mt-1.5">
              6-Digit Cryptographic Handover
            </p>
            <div className="mt-2 font-mono text-xs text-[#FDBA74] tracking-widest bg-[#111214] border border-[#2A2B30] px-2 py-1 rounded">
              OTP • • • • • •
            </div>
          </div>

          {/* Card 3: Active Fleet Drivers */}
          <div className="orbit-card orbit-card-5 absolute bottom-[8%] left-[3%] xl:left-[6%] w-56 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-3.5 shadow-xl backdrop-blur-xl opacity-30 hover:opacity-45 transition-opacity">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-[#F97316]" />
              <span className="text-xs font-bold text-white">500+ Active Fleets</span>
            </div>
            <p className="text-[10px] text-[#A1A1AA] mt-1">
              National Dispatch Network
            </p>
          </div>

          {/* Card 4: Routing Latency */}
          <div className="orbit-card orbit-card-6 absolute bottom-[10%] right-[3%] xl:right-[6%] w-60 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-xl backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#A1A1AA]">Routing Latency</span>
              <Activity size={14} className="text-[#F97316]" />
            </div>
            <p className="text-lg font-bold text-white mt-1">&lt; 4.2 min</p>
            <p className="text-[10px] text-[#A1A1AA] mt-0.5 font-mono">
              Dynamic Waypoint Recalibration
            </p>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. AWAITING APPROVAL VARIANT CARDS                    */}
      {/* ---------------------------------------------------- */}
      {variant === "approval" && (
        <>
          {/* Card 1: Review Queue Status */}
          <div className="orbit-card orbit-card-1 absolute top-[12%] left-[4%] xl:left-[8%] w-64 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-xl backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Activity size={14} className="text-[#F97316]" />
              <span>Operations Queue</span>
            </div>
            <p className="text-[11px] text-[#A1A1AA] mt-1.5">
              Admin Gateway Verification Desk
            </p>
            <div className="mt-2 text-[10px] font-mono text-[#FDBA74] font-semibold">
              STATUS: PRIORITY REVIEW
            </div>
          </div>

          {/* Card 2: Encrypted Storage */}
          <div className="orbit-card orbit-card-3 absolute top-[14%] right-[4%] xl:right-[8%] w-60 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E]/75 p-4 shadow-xl backdrop-blur-xl opacity-35 hover:opacity-50 transition-opacity">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <ShieldCheck size={14} className="text-[#22C55E]" />
              <span>Encrypted Storage</span>
            </div>
            <p className="text-[10px] text-[#A1A1AA] mt-1">
              Cloudinary Multi-Region Backup
            </p>
          </div>
        </>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. LIVELIER FLOATING & TRAVERSING KEYFRAMES (9s-14s) */}
      {/* ---------------------------------------------------- */}
      <style jsx>{`
        .orbit-card {
          will-change: transform;
          transition: opacity 0.3s ease;
        }

        /* Card 1: Snappy diagonal bob (Top Left) */
        .orbit-card-1 {
          animation: orbitTraverse1 10s ease-in-out infinite alternate;
        }

        /* Card 2: High floating lateral sway (Top Center-Right) */
        .orbit-card-2 {
          animation: orbitTraverse2 9s ease-in-out infinite alternate;
          animation-delay: -2.5s;
        }

        /* Card 3: Dynamic lateral drift (Top Right) */
        .orbit-card-3 {
          animation: orbitTraverse3 12s ease-in-out infinite alternate;
          animation-delay: -4s;
        }

        /* Card 4: Vertical floating bob (Mid Left) */
        .orbit-card-4 {
          animation: orbitTraverse4 9.5s ease-in-out infinite alternate;
          animation-delay: -1.5s;
        }

        /* Card 5: Lower left wave orbit (Bottom Left) */
        .orbit-card-5 {
          animation: orbitTraverse5 11.5s ease-in-out infinite alternate;
          animation-delay: -5s;
        }

        /* Card 6: Lower right diagonal sway (Bottom Right) */
        .orbit-card-6 {
          animation: orbitTraverse6 13s ease-in-out infinite alternate;
          animation-delay: -3s;
        }

        @keyframes orbitTraverse1 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          33% {
            transform: translate3d(22px, -28px, 0) rotate(1.8deg);
          }
          66% {
            transform: translate3d(-18px, -14px, 0) rotate(-1.5deg);
          }
          100% {
            transform: translate3d(16px, 24px, 0) rotate(1deg);
          }
        }

        @keyframes orbitTraverse2 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-26px, 22px, 0) rotate(-2deg);
          }
          100% {
            transform: translate3d(20px, -20px, 0) rotate(1.5deg);
          }
        }

        @keyframes orbitTraverse3 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          35% {
            transform: translate3d(-24px, 26px, 0) rotate(-1.8deg);
          }
          70% {
            transform: translate3d(18px, -22px, 0) rotate(1.6deg);
          }
          100% {
            transform: translate3d(-16px, -10px, 0) rotate(-1deg);
          }
        }

        @keyframes orbitTraverse4 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(20px, -30px, 0) rotate(1.8deg);
          }
          100% {
            transform: translate3d(-14px, 22px, 0) rotate(-1.2deg);
          }
        }

        @keyframes orbitTraverse5 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          40% {
            transform: translate3d(24px, -24px, 0) rotate(1.8deg);
          }
          80% {
            transform: translate3d(-20px, 20px, 0) rotate(-1.5deg);
          }
          100% {
            transform: translate3d(10px, -12px, 0) rotate(0.8deg);
          }
        }

        @keyframes orbitTraverse6 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          30% {
            transform: translate3d(-28px, -22px, 0) rotate(-1.8deg);
          }
          70% {
            transform: translate3d(22px, 26px, 0) rotate(1.6deg);
          }
          100% {
            transform: translate3d(-14px, 16px, 0) rotate(-1deg);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orbit-card-1,
          .orbit-card-2,
          .orbit-card-3,
          .orbit-card-4,
          .orbit-card-5,
          .orbit-card-6 {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default FloatingAuthCards;
