"use client";

import { MapPin, Truck, Building2, Radio, Navigation } from "lucide-react";

interface DeliveryAgent {
  _id: string;
  name: string;
  contact?: string;
  isAvailable?: boolean;
  vehicle?: string;
}

interface Delivery {
  _id: string;
  status?: string;
  agent?: DeliveryAgent;
}

interface DeliveryMapProps {
  agents?: DeliveryAgent[];
  deliveries?: Delivery[];
}

export default function DeliveryMap({ agents = [], deliveries = [] }: DeliveryMapProps) {
  // Check if there are active in-transit deliveries
  const inTransitDeliveries = deliveries.filter(
    (d) => (d.status || "").toLowerCase() === "in_transit" || (d.status || "").toLowerCase() === "assigned",
  );
  const hasActiveTransit = inTransitDeliveries.length > 0;

  return (
    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
        <div>
          <div className="flex items-center gap-2">
            <Radio size={16} className="text-[#F97316] animate-pulse" />
            <h2 className="text-lg font-bold text-white font-display">
              Route Optimization & Fleet Radar
            </h2>
          </div>
          <p className="text-xs text-[#A1A1AA] mt-0.5">
            Geographic dispatch coverage and logistics hub topology
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#2A2B30] bg-[#111214] px-3.5 py-1.5 text-xs text-[#FDBA74] font-mono self-start sm:self-auto">
          <span className={`h-2 w-2 rounded-full ${hasActiveTransit ? "bg-[#F97316] animate-pulse" : "bg-emerald-400"}`} />
          <span>{hasActiveTransit ? `${inTransitDeliveries.length} Dispatches Active` : "Fleet on Standby"}</span>
        </div>
      </div>

      {/* Radar Canvas */}
      <div className="relative h-80 sm:h-96 overflow-hidden rounded-2xl bg-[#111214] border border-[#2A2B30]">
        {/* Subtle Map Coordinate Grid */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(#2A2B30 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Ambient Radar Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_35%,rgba(249,115,22,0.08),transparent_50%),radial-gradient(circle_at_70%_65%,rgba(56,189,248,0.06),transparent_50%)]" />

        {/* Fixed Infrastructure Node 1: Central Hub */}
        <div className="absolute top-[28%] left-[24%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <Building2 size={18} />
            </div>
            <div className="mt-1.5 rounded-lg bg-[#1A1B1E]/90 backdrop-blur-md border border-[#2A2B30] px-2 py-0.5 text-center">
              <p className="text-[10px] font-bold text-white font-display">Distribution Hub</p>
              <p className="text-[9px] text-emerald-400 font-mono">Central Dispatch</p>
            </div>
          </div>
        </div>

        {/* Fixed Infrastructure Node 2: Urban Staging Warehouse */}
        <div className="absolute top-[60%] left-[72%] -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
              <Truck size={18} />
            </div>
            <div className="mt-1.5 rounded-lg bg-[#1A1B1E]/90 backdrop-blur-md border border-[#2A2B30] px-2 py-0.5 text-center">
              <p className="text-[10px] font-bold text-white font-display">Urban Warehouse</p>
              <p className="text-[9px] text-amber-400 font-mono">Regional Staging</p>
            </div>
          </div>
        </div>

        {/* Dynamic Route & Active Sector (Only Rendered When Data Exists) */}
        {hasActiveTransit ? (
          <>
            <svg
              className="absolute inset-0 h-full w-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 24 28 C 40 38 55 48 72 60"
                fill="none"
                stroke="#F97316"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="animate-pulse"
              />
            </svg>

            <div className="absolute top-[45%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F97316]/20 border border-[#F97316] text-[#F97316] animate-bounce shadow-[0_0_15px_rgba(249,115,22,0.4)]">
                  <Navigation size={14} />
                </div>
                <div className="mt-1 rounded-md bg-[#1A1B1E] border border-[#F97316]/40 px-2 py-0.5 text-[9px] font-bold text-[#FDBA74] font-mono">
                  Transit Sector Active
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Standby Telemetry Status Overlay when no active in-transit orders */
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 text-center p-4 rounded-2xl bg-[#1A1B1E]/80 backdrop-blur-md border border-[#2A2B30] max-w-xs space-y-1">
            <p className="text-xs font-bold text-white font-display">Fleet Radar in Standby</p>
            <p className="text-[10px] text-[#A1A1AA] leading-relaxed">
              All registered drivers are stationed at regional staging hubs. Live telemetry corridors will activate upon dispatch assignment.
            </p>
          </div>
        )}
      </div>

      {/* Visual Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 text-xs text-[#A1A1AA] border-t border-[#2A2B30]/60">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-500/40" />
            <span className="text-[11px]">Central Hub</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/40" />
            <span className="text-[11px]">Urban Warehouse</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] border border-[#F97316]/40" />
            <span className="text-[11px]">Active Courier (Dynamic)</span>
          </div>
        </div>

        <span className="text-[10px] font-mono text-[#A1A1AA]/70">
          GPS Engine: Synchronized
        </span>
      </div>
    </div>
  );
}
