interface Props {
  title: string;
  value: string;
  description?: string;
  trend?: string;
}

const StatsCard = ({ title, value, description, trend }: Props) => {
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
        shadow-sm
      "
    >
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#A1A1AA] text-sm">{title}</p>
          <h2 className="text-3xl font-bold text-white mt-3">{value}</h2>
        </div>

        {trend ? (
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
            <span className="text-sm font-semibold">{trend}</span>
          </div>
        ) : null}
      </div>

      {/* BOTTOM */}
      {description ? (
        <div className="mt-4">
          <p className="text-[#A1A1AA] text-sm">{description}</p>
        </div>
      ) : null}
    </div>
  );
};

export default StatsCard;
