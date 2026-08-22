"use client";

import { ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  onLogout?: () => void;
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  return (
    <header className="h-20 bg-[#111111] border-b border-neutral-900 px-8 flex items-center justify-between shrink-0">
      {/* Title / Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#7F1D1D]/20 border border-[#7F1D1D]/50 flex items-center justify-center text-[#EF4444]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="text-white font-semibold text-base leading-tight">
            Admin Verification Console
          </h2>
          <p className="text-neutral-500 text-xs mt-0.5">
            LogiTrack Compliance & KYC Center
          </p>
        </div>
      </div>

      {/* Right Side - Administrator Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-[#0B0B0B] border border-neutral-800 px-4 py-2 rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-[#7F1D1D] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(127,29,29,0.5)]">
            AD
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">Administrator</h3>
            <p className="text-neutral-500 text-xs">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}