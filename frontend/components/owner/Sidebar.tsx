"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Building2,
  ChevronLeft,
  ChevronRight,
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
  const pathname = usePathname();
  const { logout } = useLogout();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleSidebar = () => {
    const nextState = !collapsed;
    setCollapsed(nextState);
    try {
      localStorage.setItem("sidebar_collapsed", String(nextState));
    } catch {
      // ignore
    }
  };

  return (
    <aside
      className={`sticky top-0 h-screen bg-gradient-to-b from-[#151619] via-[#111214] to-[#0E0F11] border-r border-[#2A2B30]/80 flex flex-col justify-between shrink-0 select-none z-30 shadow-[4px_0_24px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${
        collapsed ? "w-20 p-3 items-center" : "w-64 xl:w-72 p-6"
      }`}
    >
      {/* Top Brand Header + Navigation */}
      <div className="w-full flex flex-col items-center">
        {/* Header Lockup + Collapse Button */}
        <div
          className={`pb-5 mb-5 border-b border-[#2A2B30]/70 flex items-center w-full ${
            collapsed ? "flex-col justify-center gap-3" : "justify-between gap-2"
          }`}
        >
          <Link
            href="/"
            title="LogiTrack Business Portal"
            className={`inline-flex items-center group cursor-pointer ${
              collapsed ? "justify-center" : "gap-3"
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1A1B1E] to-[#111214] border border-[#2A2B30] text-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:border-[#F97316]/60 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all">
              <Building2 size={19} />
            </div>

            {!collapsed && (
              <div className="transition-opacity duration-200">
                <h1 className="text-xl font-extrabold text-white font-display tracking-tight leading-none">
                  Logi<span className="text-[#F97316]">Track</span>
                </h1>
                <p className="text-[10px] font-mono text-[#A1A1AA] uppercase tracking-widest mt-1">
                  BUSINESS PORTAL
                </p>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#A1A1AA] hover:text-white hover:border-[#F97316]/50 transition cursor-pointer"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-2 w-full flex flex-col items-center" aria-label="Business Owner Navigation">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                title={link.name}
                className={`relative flex items-center rounded-2xl transition-all duration-200 text-sm font-medium ${
                  collapsed
                    ? "justify-center h-11 w-11 mx-auto"
                    : "w-full gap-3.5 px-4 py-3.5"
                } ${
                  active
                    ? "bg-[#F97316]/15 border border-[#F97316]/40 text-white shadow-[0_0_20px_rgba(249,115,22,0.15)] font-semibold"
                    : "border border-transparent text-[#A1A1AA] hover:bg-[#1A1B1E]/80 hover:border-[#2A2B30]/60 hover:text-[#F4F4F5]"
                }`}
              >
                {/* Active Indicator Bar */}
                {active && (
                  <span
                    className={`absolute rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316] ${
                      collapsed
                        ? "left-0 top-1/2 -translate-y-1/2 w-1 h-5"
                        : "left-1.5 top-1/2 -translate-y-1/2 w-1 h-5"
                    }`}
                  />
                )}

                <Icon
                  size={18}
                  className={`shrink-0 transition-colors ${
                    active ? "text-[#F97316]" : "text-[#A1A1AA] group-hover:text-white"
                  }`}
                />

                {!collapsed && <span className="tracking-tight truncate">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="w-full pt-5 border-t border-[#2A2B30]/80 flex flex-col items-center space-y-2.5">
        <button
          onClick={logout}
          title="Sign Out"
          className={`flex items-center justify-center bg-[#1A1B1E] border border-[#2A2B30] hover:border-red-500/50 hover:bg-[#111214] text-[#F4F4F5] hover:text-red-400 rounded-2xl transition-all font-semibold text-xs tracking-wide cursor-pointer shadow-sm active:scale-[0.98] ${
            collapsed ? "h-11 w-11 mx-auto p-0" : "w-full gap-2.5 py-3 px-4"
          }`}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <div className="w-full text-center">
          <AccountDeletionDialog
            roleLabel="Business Owner"
            buttonClassName={`text-center text-[11px] text-[#A1A1AA]/50 hover:text-red-400/90 bg-transparent border-transparent hover:bg-transparent transition-colors cursor-pointer font-medium ${
              collapsed ? "w-11 mx-auto text-[9px] p-0 truncate block text-center" : "w-full py-0.5"
            }`}
          />
        </div>
      </div>
    </aside>
  );
}
