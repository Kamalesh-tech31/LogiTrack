"use client";

import { Bell, Search, UserCircle2 } from "lucide-react";

export default function AdminNavbar() {
    return (
        <header className="flex items-center justify-between border-b border-[#27272A] bg-[#111111] px-8 py-5">

            {/* Search Bar */}
            <div className="flex items-center gap-3 rounded-2xl border border-[#27272A] bg-[#1A1A1A] px-4 py-3 w-[400px]">
                <Search className="text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search users..."
                    className="bg-transparent outline-none text-white w-full"
                />
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-6">

                <button className="relative">
                    <Bell className="text-gray-300" size={24} />
                    <span className="absolute -top-2 -right-2 bg-[#7F1D1D] text-xs px-2 rounded-full text-white">
                        0
                    </span>
                </button>

                <div className="flex items-center gap-3">
                    <UserCircle2 size={40} className="text-[#7F1D1D]" />

                    <div>
                        <h3 className="text-white font-semibold">
                            Administrator
                        </h3>

                        <p className="text-gray-400 text-sm">
                            LogiTrack Admin
                        </p>
                    </div>
                </div>

            </div>
        </header>
    );
}