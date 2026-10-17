import { AlertTriangle } from "lucide-react";

const alerts = [
  {
    product: "Wireless Scanner",
    stock: "4 units left",
  },
  {
    product: "Packaging Boxes",
    stock: "8 units left",
  },
  {
    product: "Barcode Labels",
    stock: "2 units left",
  },
];

export default function LowStockAlerts() {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 h-full shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-red-500/10 p-3 rounded-2xl border border-red-900/50">
          <AlertTriangle className="text-red-500" size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Low Stock Alerts</h2>

          <p className="text-[#A1A1AA] text-sm">
            Products needing immediate restock
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.map((item, index) => (
          <div
            key={index}
            className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-5 hover:border-[#F97316] transition"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">
                  {item.product}
                </h3>

                <p className="text-red-400 text-sm mt-1">{item.stock}</p>
              </div>

              <button className="bg-[#F97316] hover:bg-[#EA580C] transition px-4 py-2 rounded-xl text-sm text-white font-medium cursor-pointer">
                Restock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
