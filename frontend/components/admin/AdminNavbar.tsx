"use client";

import { ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  onLogout?: () => void;
}

export default function AdminNavbar({ onLogout }: AdminNavbarProps) {
  return (
    <header className="h-20 bg-[#1A1B1E] border-b border-[#2A2B30] px-8 flex items-center justify-between shrink-0">
      {/* Title / Badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
          <ShieldCheck size={22} />
        </div>
        <div>
          <h2 className="text-[#F4F4F5] font-semibold text-base leading-tight">
            Admin Verification Console
          </h2>
          <p className="text-[#A1A1AA] text-xs mt-0.5">
            LogiTrack Compliance & KYC Center
          </p>
        </div>
      </div>

      {/* Right Side - Administrator Profile */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-[#111214] border border-[#2A2B30] px-4 py-2 rounded-2xl">
          <div className="w-10 h-10 rounded-2xl bg-[#F97316] flex items-center justify-center text-white font-bold text-sm shadow-[0_0_12px_rgba(249,115,22,0.4)]">
            AD
          </div>
          <div>
            <h3 className="text-[#F4F4F5] text-sm font-medium">Administrator</h3>
            <p className="text-[#A1A1AA] text-xs">Super Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}