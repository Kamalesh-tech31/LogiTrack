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
    <div
      className="
        bg-[#1A1B1E]
        border
        border-[#2A2B30]
        rounded-3xl
        p-6
        hover:border-[#F97316]
        transition-all
        duration-300
        shadow-lg
      "
    >
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#A1A1AA] text-sm">{title}</p>

          <h2 className="text-3xl font-bold text-white mt-3">{value}</h2>
        </div>

        <div
          className="
            w-14
            h-14
            rounded-2xl
            bg-[#F97316]/15
            border
            border-[#F97316]/40
            flex
            items-center
            justify-center
            text-[#F97316]
          "
        >
          {icon}
        </div>
      </div>

      {/* BOTTOM */}
      <div className="mt-6">
        <span
          className="
            text-green-400
            text-sm
            font-medium
          "
        >
          {change}
        </span>

        <span className="text-[#A1A1AA] text-sm ml-2">from last week</span>
      </div>
    </div>
  );
}
