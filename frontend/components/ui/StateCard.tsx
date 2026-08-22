import React from "react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  change,
  icon,
}: StatCardProps) {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-6 hover:border-[#F97316] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#A1A1AA] text-sm">{title}</p>

          <h2 className="text-3xl font-bold mt-3 text-[#F4F4F5]">{value}</h2>

          <p className="text-green-500 text-sm mt-3">{change}</p>
        </div>

        <div className="w-16 h-16 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center text-[#F97316]">
          {icon}
        </div>
      </div>
    </div>
  );
}
