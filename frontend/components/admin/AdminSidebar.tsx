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
    <aside className="w-72 min-h-screen bg-black border-r border-[#1f1f1f] p-6 flex flex-col shrink-0">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Logi<span className="text-red-600">Track</span>
        </h1>
        <p className="text-gray-500 mb-10 text-sm">Administrator Panel</p>

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
                    ? "bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.25)]"
                    : "text-gray-400 hover:bg-[#111111] hover:text-white"
                }`}
              >
                <Icon size={22} />
                <span className="text-base font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto pt-8 border-t border-[#1f1f1f]">
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-2xl transition-all font-medium cursor-pointer"
        >
          <LogOut size={20} />
          <span>Exit Admin</span>
        </button>
      </div>
    </aside>
  );
}