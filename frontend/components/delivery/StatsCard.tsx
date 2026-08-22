import React from "react";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string;
  description?: string;
  trend?: string;
  icon?: LucideIcon;
}

const StatsCard = ({ title, value, description, trend, icon: Icon }: Props) => {
  // Filter out developer-sounding trend labels
  const isMeaningfulTrend =
    trend &&
    !["Backend", "Current", "Synced"].includes(trend);

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 hover:border-[#F97316]/50 transition-all duration-200 shadow-sm flex flex-col justify-between h-full">
      <div>
        {/* Top: Title & Icon/Trend */}
        <div className="flex items-center justify-between gap-2">
          <p className="text-[#A1A1AA] text-xs font-semibold uppercase tracking-wider">
            {title}
          </p>

          <div className="flex items-center gap-2">
            {isMeaningfulTrend && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#F97316]/10 text-[#F97316] border border-[#F97316]/30">
                {trend}
              </span>
            )}
            {Icon && (
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316]">
                <Icon size={16} />
              </div>
            )}
          </div>
        </div>

        {/* Value */}
        <h2 className="text-3xl font-extrabold text-white font-display tracking-tight mt-3">
          {value}
        </h2>
      </div>

      {/* Description */}
      {description && (
        <div className="mt-4 pt-3 border-t border-[#2A2B30]/60">
          <p className="text-[#A1A1AA] text-xs leading-relaxed">{description}</p>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
