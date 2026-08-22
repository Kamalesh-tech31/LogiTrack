"use client";

import { useState } from "react";
import { Clock3, MapPin, Phone, Truck, Copy, Check } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface Props {
  id: string;
  customer: string;
  address: string;
  eta: string;
  status: string;
  priority: string;
  contact: string;
  location: string;
  lastUpdated: string;
}

function formatDisplayId(rawId: string) {
  if (!rawId) return "#ORD";
  if (rawId.startsWith("ORD-")) {
    const parts = rawId.split("-");
    const last = parts[parts.length - 1];
    return `#${last.slice(-4)}`;
  }
  if (rawId.length > 8) {
    return `#${rawId.slice(-4).toUpperCase()}`;
  }
  return `#${rawId}`;
}

const DeliveryCard = ({
  id,
  customer,
  address,
  eta,
  status,
  priority,
  contact,
  location,
  lastUpdated,
}: Props) => {
  const [copied, setCopied] = useState(false);
  const displayId = formatDisplayId(id);

  const handleCopyId = () => {
    if (!id) return;
    void navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-5 hover:border-[#F97316]/50 transition-all duration-200 shadow-sm">
      {/* Header: Customer Name & Status */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white font-display">
              {customer || "Valued Customer"}
            </h3>
            {/* Elegant Small ID Badge with copy */}
            <button
              type="button"
              onClick={handleCopyId}
              title={`Copy full ID: ${id}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#111214] border border-[#2A2B30] text-[11px] font-mono text-[#A1A1AA] hover:text-[#F97316] hover:border-[#F97316]/40 transition cursor-pointer"
            >
              <span>{displayId}</span>
              {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
            </button>
          </div>

          <p className="text-xs text-[#A1A1AA] mt-1.5 line-clamp-1 max-w-md">
            {address}
          </p>
        </div>

        <StatusBadge status={status} />
      </div>

      {/* Meta Chips Grid with Standardized 3-Tier Typography */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
            Priority Tier
          </p>
          <p className="text-white text-sm font-bold mt-1">
            {priority || "Standard"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-3.5">
          <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">
            Estimated Arrival
          </p>
          <p className="text-[#FDBA74] text-sm font-bold mt-1">
            {eta || "In Transit"}
          </p>
        </div>
      </div>

      {/* Details List */}
      <div className="mt-4 pt-3.5 border-t border-[#2A2B30]/60 space-y-2.5 text-xs text-[#A1A1AA]">
        {location && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-[#F97316] shrink-0" />
            <span className="text-[#F4F4F5] truncate font-medium">{location}</span>
          </div>
        )}

        {contact && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-[#F97316] shrink-0" />
            <span className="text-[#F4F4F5] font-medium">{contact}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#A1A1AA] pt-1">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Truck size={14} />
            <span>Telemetry Linked</span>
          </span>
          {lastUpdated && <span className="font-mono text-[11px]">Sync: {lastUpdated}</span>}
        </div>
      </div>
    </div>
  );
};

export default DeliveryCard;
