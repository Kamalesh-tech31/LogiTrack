"use client";

import { MapPin, Truck, Sparkles } from "lucide-react";

interface DeliveryAgent {
  _id: string;
  name: string;
  contact: string;
  isAvailable: boolean;
  vehicle?: string;
}

interface DeliveryMapProps {
  agents?: DeliveryAgent[];
}

export default function DeliveryMap({ agents = [] }: DeliveryMapProps) {
  const markers = [
    {
      id: 1,
      label: "Distribution Hub",
      topClass: "top-[18%] left-[22%]",
      color: "bg-emerald-400",
      subtitle: "Dispatch center",
    },
    {
      id: 2,
      label: "Urban Warehouse",
      topClass: "top-[45%] left-[55%]",
      color: "bg-rose-400",
      subtitle: "Loading zone",
    },
    {
      id: 3,
      label: "Delivery Point",
      topClass: "top-[72%] left-[35%]",
      color: "bg-sky-400",
      subtitle: "Client location",
    },
  ];

  const routeDots = [
    { id: 1, top: "24%", left: "30%" },
    { id: 2, top: "38%", left: "42%" },
    { id: 3, top: "52%", left: "48%" },
    { id: 4, top: "62%", left: "40%" },
  ];

  return (
    <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Route Optimisation</h2>
          <p className="text-[#A1A1AA] text-sm mt-1">
            Live delivery tracking map
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-[#F97316]/40 bg-[#F97316]/10 px-4 py-2 text-sm text-[#FDBA74]">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-[#F97316] animate-pulse" />
          {agents.length} Active Agents
        </div>
      </div>

      <div className="relative h-115 overflow-hidden rounded-3xl bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 border border-[#2A2B30]">
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_24%),radial-gradient(circle_at_85%_80%,rgba(249,115,22,0.18),transparent_24%)]" />
        <div className="absolute inset-0 opacity-15 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_0%,transparent_20%,transparent_80%,rgba(255,255,255,0.08)_100%)]" />

        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F97316" stopOpacity="1" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M 20 18 C 32 26 38 40 50 48 C 62 56 66 62 74 68 C 82 74 88 72 92 70"
            fill="none"
            stroke="url(#routeGrad)"
            strokeWidth="1.8"
            strokeDasharray="5 5"
          />
          <path d="M 20 18 L 17 22 L 23 22 Z" fill="#F97316" />
          <path d="M 92 70 L 88 67 L 90 73 Z" fill="#60A5FA" />
          {routeDots.map((dot) => (
            <circle
              key={dot.id}
              cx={parseFloat(dot.left)}
              cy={parseFloat(dot.top)}
              r="1.1"
              fill="#FBBF24"
            />
          ))}
        </svg>

        {markers.map((marker, index) => (
          <div
            key={marker.id}
            className={`absolute ${marker.topClass} ${marker.color} z-10 flex flex-col items-center gap-2 rounded-full px-3 py-3 shadow-2xl text-slate-950 ${
              index === 0 ? "animate-pulse" : ""
            }`}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950/10 shadow-inner">
              {index === 0 && <MapPin size={18} />}
              {index === 1 && <Truck size={18} />}
              {index === 2 && <Sparkles size={18} />}
            </span>
            <div className="text-center">
              <p className="font-semibold text-xs">{marker.label}</p>
              <p className="text-xs opacity-75">{marker.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
