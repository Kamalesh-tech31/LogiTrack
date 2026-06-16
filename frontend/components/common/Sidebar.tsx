"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLogout } from "@/lib/logout";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";

import {
  Currency,
  History,
  LayoutDashboard,
  MapPinned,
  Package,
  LogOut,
} from "lucide-react";

const Sidebar = () => {
  const pathname = usePathname();
  const { logout } = useLogout();

  const navItems = [
    {
      name: "Dashboard",
      href: "/delivery/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Deliveries",
      href: "/delivery/deliveries",
      icon: Package,
    },
    {
      name: "Earnings",
      href: "/delivery/earnings",
      icon: Currency,
    },
    {
      name: "Tracking",
      href: "/delivery/tracking",
      icon: MapPinned,
    },
    {
      name: "History",
      href: "/delivery/history",
      icon: History,
    },
  ];

  return (
    <div className="w-72 min-h-screen bg-black border-r border-[#1f1f1f] p-6">
      <h1 className="text-4xl font-bold text-white mb-10">
        Logi<span className="text-red-600">Track</span>
      </h1>

      <div className="space-y-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                active
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:bg-[#111111] hover:text-white"
              }`}
            >
              <Icon size={22} />
              <span className="text-lg">{item.name}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 space-y-3">
        <AccountDeletionDialog
          roleLabel="Delivery Agent"
          buttonClassName="w-full justify-start border-[#7F1D1D]/50 bg-[#7F1D1D]/10 text-[#FCA5A5] hover:bg-[#7F1D1D]/20 hover:text-white"
        />
        <button
          onClick={logout}
          className="w-full mt-0 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl transition-all"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
