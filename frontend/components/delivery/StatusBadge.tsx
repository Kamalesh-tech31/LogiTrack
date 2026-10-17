import React from "react";

interface Props {
  status: string;
}

const StatusBadge = ({ status }: Props) => {
  const norm = (status || "").toLowerCase().replace(/[-_]/g, " ");

  let style = "border-[#2A2B30] bg-[#111214] text-[#A1A1AA]";
  let dotColor = "bg-[#A1A1AA]";

  if (norm.includes("deliver") || norm.includes("complete") || norm.includes("success")) {
    style = "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    dotColor = "bg-emerald-400";
  } else if (norm.includes("out for delivery") || norm.includes("transit") || norm.includes("shipped")) {
    style = "border-[#F97316]/30 bg-[#F97316]/10 text-[#FDBA74]";
    dotColor = "bg-[#F97316]";
  } else if (norm.includes("pending") || norm.includes("assign")) {
    style = "border-amber-500/30 bg-amber-500/10 text-amber-300";
    dotColor = "bg-amber-400";
  } else if (norm.includes("fail") || norm.includes("return") || norm.includes("reject") || norm.includes("cancel")) {
    style = "border-red-500/30 bg-red-500/10 text-red-300";
    dotColor = "bg-red-400";
  }

  // Format label to Title Case
  const label = status
    ? status
        .split(/[-_ ]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ")
    : "Unknown";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;