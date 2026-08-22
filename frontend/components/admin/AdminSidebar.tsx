"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock3,
  CheckCircle2,
  XCircle,
  LogOut,
} from "lucide-react";

interface AdminSidebarProps {
  onLogout?: () => void;
}

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
    icon: CheckCircle2,
  },
  {
    name: "Rejected Users",
    href: "/admin/rejected",
    icon: XCircle,
  },
];

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname();

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      sessionStorage.removeItem("admin_auth");
      window.location.href = "/admin";
    }
  };

  return (
    <aside className="w-72 min-h-screen bg-[#111214] border-r border-[#2A2B30] p-6 flex flex-col shrink-0">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Logi<span className="text-[#F97316]">Track</span>
        </h1>
        <p className="text-[#A1A1AA] mb-10 text-sm">Administrator Panel</p>

        <nav className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  active
                    ? "bg-[#F97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                    : "text-[#A1A1AA] hover:bg-[#1A1B1E] hover:text-white"
                }`}
              >
                <Icon size={22} />
                <span className="text-base font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-8 border-t border-[#2A2B30]">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-3 bg-[#1A1B1E] border border-[#2A2B30] hover:border-red-600/60 text-[#A1A1AA] hover:text-red-400 py-3.5 rounded-2xl transition-all font-medium cursor-pointer"
        >
          <LogOut size={20} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}