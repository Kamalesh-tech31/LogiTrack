interface Props {
  status: string;
}

const StatusBadge = ({ status }: Props) => {
  const statusStyles: Record<string, string> = {
    Pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    "Out for Delivery": "border-[#F97316]/30 bg-[#F97316]/10 text-[#FDBA74]",
    Delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    "Failed Attempt": "border-red-500/30 bg-red-500/10 text-red-300",
    Returned: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  const classes =
    statusStyles[status] ||
    "border-[#2A2B30] bg-[#111214] text-[#F4F4F5]";

  return (
    <span
      className={`
        px-3
        py-1
        rounded-full
        text-xs
        font-medium
        border
        ${classes}
      `}
    >
      {status}
    </span>
  );
};

export default StatusBadge;