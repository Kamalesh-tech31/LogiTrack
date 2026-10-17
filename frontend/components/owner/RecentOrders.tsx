import { ArrowRight } from "lucide-react";

const orders = [
  {
    id: "#1001",
    customer: "Rahul Sharma",
    amount: "₹240",
    status: "Completed",
  },
  {
    id: "#1002",
    customer: "Aisha Khan",
    amount: "₹180",
    status: "Pending",
  },
  {
    id: "#1003",
    customer: "John Mathew",
    amount: "₹420",
    status: "Out for Delivery",
  },
  {
    id: "#1004",
    customer: "Vijay Kumar",
    amount: "₹120",
    status: "Returned",
  },
];

export default function RecentOrders() {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Recent Orders</h2>

          <p className="text-[#A1A1AA] mt-1">Latest incoming customer orders</p>
        </div>

        <button className="bg-[#F97316] hover:bg-[#EA580C] transition px-5 py-3 rounded-2xl text-white font-medium flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)]">
          View All
          <ArrowRight size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-5 flex items-center justify-between hover:border-[#F97316] transition"
          >
            <div>
              <h3 className="text-white font-semibold text-lg">
                Order {order.id}
              </h3>

              <p className="text-[#A1A1AA]">{order.customer}</p>
            </div>

            <div className="text-right">
              <p className="text-white font-bold text-lg">{order.amount}</p>

              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  order.status === "Completed"
                    ? "bg-green-500/10 text-green-400"
                    : order.status === "Pending"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : order.status === "Returned"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-[#F97316]/10 text-[#FDBA74]"
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
