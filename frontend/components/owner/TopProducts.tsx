import { PackageCheck } from "lucide-react";

const products = [
  {
    name: "Wireless Scanner",
    sales: "1,248 sold",
    revenue: "₹12,400",
  },
  {
    name: "Packaging Boxes",
    sales: "982 sold",
    revenue: "₹8,920",
  },
  {
    name: "Barcode Labels",
    sales: "742 sold",
    revenue: "₹5,610",
  },
];

export default function TopProducts() {
  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-[#F97316]/15 border border-[#F97316]/40 p-3 rounded-2xl">
          <PackageCheck className="text-[#F97316]" size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">Top Products</h2>

          <p className="text-[#A1A1AA] text-sm">
            Best performing inventory items
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div
            key={index}
            className="bg-[#111214] border border-[#2A2B30] rounded-2xl p-5 hover:border-[#F97316] transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white text-lg font-semibold">
                  {product.name}
                </h3>

                <p className="text-[#A1A1AA] text-sm mt-1">{product.sales}</p>
              </div>

              <div className="text-right">
                <p className="text-green-400 font-bold text-lg">
                  {product.revenue}
                </p>

                <p className="text-[#A1A1AA] text-xs">Revenue</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
