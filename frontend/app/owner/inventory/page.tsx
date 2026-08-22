"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  History,
  Package,
  RefreshCcw,
  Search,
} from "lucide-react";
import { fetchOwnerInventory, fetchOwnerInventoryHistory } from "@/lib/api";

interface InventoryProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
}

interface InventoryApiResponse {
  success: boolean;
  count: number;
  totalItems: number;
  data: InventoryProduct[];
}

interface InventoryHistoryEntry {
  _id: string;
  productName: string;
  action: string;
  quantity: number;
  details: string;
  createdAt: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [historyEntries, setHistoryEntries] = useState<InventoryHistoryEntry[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInventory() {
      setLoading(true);
      setError(null);

      try {
        const [products, history] = await Promise.all([
          fetchOwnerInventory(),
          fetchOwnerInventoryHistory(),
        ]);

        setInventory(Array.isArray(products) ? products : []);
        setHistoryEntries(Array.isArray(history) ? history : []);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load inventory");
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  const filtered = useMemo(
    () =>
      inventory.filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [query, inventory],
  );

  const totalProducts = inventory.length;
  const lowStockAlerts = inventory.filter(
    (item) => item.stock <= item.minStock,
  ).length;
  const totalInventoryItems = inventory.reduce(
    (sum, item) => sum + item.stock,
    0,
  );

  function getStatus(item: InventoryProduct) {
    if (item.stock <= item.minStock) return "Low Stock";
    if (item.stock <= item.minStock + 5) return "Medium";
    return "Healthy";
  }

  function getStatusClasses(item: InventoryProduct) {
    const status = getStatus(item);

    if (status === "Low Stock") return "bg-red-500/20 text-red-400";
    if (status === "Medium") return "bg-yellow-500/20 text-yellow-400";
    return "bg-green-500/20 text-green-400";
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-5xl font-bold text-white">
            Inventory Management
          </h1>

          <p className="text-gray-400 mt-2">
            Monitor stock levels and inventory activity
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/owner/inventory/restock")}
          className="flex items-center gap-2 bg-[#F97316] hover:bg-[#EA580C] transition-all duration-300 px-6 py-3 rounded-2xl text-white font-medium cursor-pointer shadow-[0_0_15px_rgba(249,115,22,0.3)]"
        >
          <RefreshCcw size={18} />
          Restock Inventory
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Total Products</p>

              <h2 className="text-5xl font-bold text-white mt-3">
                {totalProducts}
              </h2>
            </div>

            <div className="bg-[#F97316]/15 border border-[#F97316]/30 p-5 rounded-2xl">
              <Package className="text-[#F97316]" size={30} />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Low Stock Alerts</p>

              <h2 className="text-5xl font-bold text-white mt-3">
                {lowStockAlerts}
              </h2>
            </div>

            <div className="bg-red-500/20 border border-red-500/30 p-5 rounded-2xl">
              <AlertTriangle className="text-red-400" size={30} />
            </div>
          </div>
        </div>

        <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#A1A1AA]">Total Inventory Items</p>

              <h2 className="text-5xl font-bold text-white mt-3">
                {totalInventoryItems}
              </h2>
            </div>

            <div className="bg-green-500/20 border border-green-500/30 p-5 rounded-2xl">
              <RefreshCcw className="text-green-400" size={30} />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
          size={20}
          aria-hidden="true"
        />

        <input
          type="text"
          aria-label="Search inventory"
          placeholder="Search inventory..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-14 pr-4 py-4 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />
      </div>

      {loading && <p className="text-[#A1A1AA]">Loading inventory...</p>}
      {error && <p className="text-red-400">Error: {error}</p>}

      {/* Inventory Table */}
      <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl overflow-hidden shadow-lg">
        <div className="p-6 border-b border-[#2A2B30]">
          <h2 className="text-3xl font-bold text-white">Inventory Overview</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#111214]">
              <tr className="text-left">
                <th className="px-6 py-5 text-[#A1A1AA] font-medium">Product</th>

                <th className="px-6 py-5 text-[#A1A1AA] font-medium">SKU</th>

                <th className="px-6 py-5 text-[#A1A1AA] font-medium">Stock</th>

                <th className="px-6 py-5 text-[#A1A1AA] font-medium">Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item._id}
                  className="border-t border-[#2A2B30] hover:bg-[#111214]/60 transition-all"
                >
                  <td className="px-6 py-5 text-white font-medium">
                    {item.name}
                  </td>

                  <td className="px-6 py-5 text-[#A1A1AA]">{item.category}</td>

                  <td className="px-6 py-5 text-white">{item.stock}</td>

                  <td className="px-6 py-5">
                    <span
                      className={`px-4 py-2 rounded-full text-sm ${getStatusClasses(
                        item,
                      )}`}
                    >
                      {getStatus(item)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventory History */}
      <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-3xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <History className="text-[#F97316]" />

          <h2 className="text-3xl font-bold text-white">Inventory History</h2>
        </div>

        <div className="space-y-4">
          {historyEntries.length > 0 ? (
            historyEntries.map((item) => (
              <div
                key={item._id}
                className="bg-[#0D0D0D] border border-[#1F1F1F] rounded-2xl p-5 flex flex-col gap-3"
              >
                <div>
                  <h3 className="text-white font-medium">{item.action}</h3>
                  <p className="text-gray-400 text-sm mt-1">
                    {item.productName} ·{" "}
                    {item.quantity >= 0 ? `+${item.quantity}` : item.quantity}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(item.createdAt).toLocaleString()}</span>
                  <span>{item.details}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8">
              No inventory history yet. Your restock and stock updates will
              appear here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
