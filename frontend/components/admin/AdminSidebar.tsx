"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Clock3,
    CheckCircle,
    XCircle,
    LogOut,
} from "lucide-react";

export default function AdminSidebar() {
    const pathname = usePathname();

    const menuItems = [
        {
            name: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard,
        },
        {
            name: "Pending Users",
            href: "/admin/pending",
            icon: Clock3,
        },
        {
            name: "Approved Users",
            href: "/admin/approved",
            icon: CheckCircle,
        },
        {
            name: "Rejected Users",
            href: "/admin/rejected",
            icon: XCircle,
        },
    ];

    return (
        <aside className="w-72 min-h-screen bg-[#111111] border-r border-[#27272A] p-6 flex flex-col">
            <div>
                <h1 className="text-4xl font-bold text-white mb-10">
                    Logi<span className="text-[#7F1D1D]">Track</span>
                </h1>

                <nav className="space-y-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = pathname === item.href;

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 rounded-2xl px-5 py-4 transition
                                ${active
                                        ? "bg-[#7F1D1D]/20 border border-[#7F1D1D] text-white"
                                        : "border border-[#27272A] text-gray-300 hover:border-[#7F1D1D]"
                                    }`}
                            >
                                <Icon size={20} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto pt-10">
                <button
                    className="w-full rounded-2xl bg-[#7F1D1D] py-4 text-white font-semibold hover:bg-[#991B1B] transition"
                    onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                    }}
                >
                    <div className="flex justify-center items-center gap-3">
                        <LogOut size={20} />
                        Logout
                    </div>
                </button>
            </div>
        </aside>
    );
}