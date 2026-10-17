import React from "react";

interface DashboardCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export default function DashboardCard({
  title,
  value,
  change,
  icon,
}: DashboardCardProps) {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 hover:border-[#F97316]/50 transition-all duration-200 shadow-sm flex flex-col justify-between h-full">
      {/* Top: Micro-label & Icon */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">
            {title}
          </p>

          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316]">
            {icon}
          </div>
        </div>

        {/* Primary Value */}
        <h2 className="text-3xl font-extrabold text-white font-display tracking-tight mt-2.5">
          {value}
        </h2>
      </div>

      {/* Bottom: Secondary Context Footnote */}
      <div className="mt-4 pt-3 border-t border-[#2A2B30]/60 flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {change}
        </span>
        <span className="text-xs text-[#A1A1AA]">vs last period</span>
      </div>
    </div>
  );
}
