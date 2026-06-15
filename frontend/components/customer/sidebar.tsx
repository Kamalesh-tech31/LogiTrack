"use client";
import { useLogout } from "@/lib/logout";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  CheckCircle,
  Truck,
  LineChart,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/customer", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/customer/products", icon: Package, label: "Products" },
  { href: "/customer/cart", icon: ShoppingCart, label: "Cart" },
  { href: "/customer/orders", icon: CheckCircle, label: "Orders" },
  { href: "/customer/analytics", icon: LineChart, label: "Analytics" },
  { href: "/customer/profile", icon: UserRound, label: "Profile" },
];

export function CustomerSidebar() {
  const pathname = usePathname();
  const { logout } = useLogout();

  return (
    <div className="w-72 min-h-screen bg-black border-r border-[#1f1f1f] p-6">
      <h1 className="text-4xl font-bold text-white mb-2">
        Logi<span className="text-red-600">Track</span>
      </h1>

      <p className="text-gray-500 mb-10">Customer Dashboard</p>

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
              <span className="text-lg">{item.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-8 space-y-3">
        <AccountDeletionDialog
          roleLabel="Customer"
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
}
