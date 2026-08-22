interface AgentCardProps {
  name: string;
  deliveries: number;
  status: string;
}

export default function AgentCard({
  name,
  deliveries,
  status,
}: AgentCardProps) {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold text-lg">{name}</h3>

          <p className="text-[#A1A1AA] text-sm mt-1">
            {deliveries} deliveries today
          </p>
        </div>

        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === "Active"
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}
        >
          {status}
        </div>
      </div>
    </div>
  );
}
