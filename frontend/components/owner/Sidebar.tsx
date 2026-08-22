"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useLogout } from "@/lib/logout";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  BarChart3,
  LogOut,
} from "lucide-react";

const links = [
  {
    name: "Dashboard",
    href: "/owner",
    icon: LayoutDashboard,
  },
  {
    name: "Products",
    href: "/owner/products",
    icon: Package,
  },
  {
    name: "Inventory",
    href: "/owner/inventory",
    icon: Boxes,
  },
  {
    name: "Orders",
    href: "/owner/orders",
    icon: ShoppingCart,
  },
  {
    name: "Delivery",
    href: "/owner/delivery",
    icon: Truck,
  },
  {
    name: "Analytics",
    href: "/owner/analytics",
    icon: BarChart3,
  },
];

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useLogout();

  return (
    <div className="w-72 min-h-screen bg-[#111214] border-r border-[#2A2B30] p-6 flex flex-col justify-between shrink-0">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">
          Logi<span className="text-[#F97316]">Track</span>
        </h1>

        <p className="text-[#A1A1AA] mb-10 text-sm">Business Dashboard</p>

        <div className="space-y-3">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  active
                    ? "bg-[#F97316] text-white shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                    : "text-[#A1A1AA] hover:bg-[#1A1B1E] hover:text-white"
                }`}
              >
                <Icon size={22} />
                <span className="text-base font-medium">{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-8 space-y-3 pt-6 border-t border-[#2A2B30]">
        <AccountDeletionDialog
          roleLabel="Business Owner"
          buttonClassName="w-full justify-start border-red-900/40 bg-red-950/20 text-red-300 hover:bg-red-950/40 hover:text-white"
        />
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-[#1A1B1E] border border-[#2A2B30] hover:border-red-600/60 text-[#A1A1AA] hover:text-red-400 py-3 rounded-2xl transition-all font-medium cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
