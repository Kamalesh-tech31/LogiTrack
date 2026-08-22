import type { DeliveryItem } from "@/lib/api";

interface DeliveryTableProps {
  deliveries: DeliveryItem[];
}

function getStatusBadge(status?: string) {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "completed":
    case "delivered":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "in_transit":
    case "in-transit":
    case "out for delivery":
    case "out_for_delivery":
      return "bg-[#F97316]/10 text-[#FDBA74] border-[#F97316]/20";
    case "assigned":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "pending":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "failed":
    case "returned":
    case "cancelled":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-neutral-800 text-[#A1A1AA] border-neutral-700";
  }
}

function getStatusColor(status?: string) {
  const normalized = String(status || "").toLowerCase();
  switch (normalized) {
    case "completed":
    case "delivered":
      return "text-green-400";
    case "in_transit":
    case "in-transit":
    case "out for delivery":
    case "out_for_delivery":
      return "text-[#F97316]";
    case "assigned":
      return "text-yellow-400";
    case "pending":
      return "text-amber-400";
    case "failed":
    case "returned":
    case "cancelled":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

export default function DeliveryTable({ deliveries }: DeliveryTableProps) {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-6">Delivery Orders</h2>

      <div className="space-y-4">
        {deliveries.length > 0 ? (
          deliveries.map((delivery) => {
            const orderObj = delivery.order ?? {
              orderId: delivery.orderId ?? delivery.id ?? "",
              customerName: delivery.customer ?? "",
            };
            return (
              <div
                key={String(
                  delivery._id ??
                    delivery.id ??
                    orderObj.orderId ??
                    `${Math.random()}`,
                )}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#111214] border border-[#2A2B30]"
              >
                <div>
                  <h3 className="text-white font-semibold">
                    {orderObj.orderId}
                  </h3>
                  <p className="text-[#A1A1AA] text-sm">
                    {orderObj.customerName}
                  </p>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(
                      delivery.status,
                    )}`}
                  >
                    {delivery.status || "Pending"}
                  </span>
                  <p className="text-xs text-[#A1A1AA] mt-1">
                    ETA: {delivery.eta || "--"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-[#A1A1AA] text-sm">No delivery orders found.</p>
        )}
      </div>
    </div>
  );
}
