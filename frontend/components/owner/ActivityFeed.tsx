import { ShoppingCart, Truck, AlertTriangle, UserPlus } from "lucide-react";

const activities = [
  {
    icon: ShoppingCart,
    title: "New order received",
    description: "Order #1024 placed by Rahul",
    time: "2 min ago",
  },
  {
    icon: Truck,
    title: "Delivery completed",
    description: "Order #1018 delivered successfully",
    time: "12 min ago",
  },
  {
    icon: AlertTriangle,
    title: "Low stock warning",
    description: "Wireless Scanner stock below threshold",
    time: "25 min ago",
  },
  {
    icon: UserPlus,
    title: "New customer registered",
    description: "Aisha Khan joined LogiTrack",
    time: "40 min ago",
  },
];

export default function ActivityFeed() {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Activity Feed</h2>

        <p className="text-[#A1A1AA] text-sm mt-1">
          Live business activities and updates
        </p>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;

          return (
            <div
              key={index}
              className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-5 flex gap-4 hover:border-[#F97316] transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#F97316]/15 border border-[#F97316]/40 flex items-center justify-center">
                <Icon className="text-[#F97316]" size={22} />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-semibold">{activity.title}</h3>

                  <span className="text-xs text-[#A1A1AA]">{activity.time}</span>
                </div>

                <p className="text-[#A1A1AA] text-sm mt-1">
                  {activity.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
