"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  History,
  Package,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
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
        setError(err?.message ?? "Unable to load inventory data");
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, []);

  const totalItems = inventory.reduce(
    (total, item) => total + (item.stock || 0),
    0,
  );
  const lowStockCount = inventory.filter(
    (item) => item.stock > 0 && item.stock <= item.minStock,
  ).length;
  const outOfStockCount = inventory.filter((item) => item.stock === 0).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q)),
    );
  }, [inventory, query]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Supply Chain Control
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Inventory Levels
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Track warehouse reserves, minimum safety stock thresholds, and recent stock adjustments.
        </p>
      </div>

      {/* 3 Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Total Units in Stock</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316]">
              <Package size={18} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-display">{totalItems.toLocaleString()}</p>
          <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
            Across {inventory.length} listed SKUs
          </p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Low Stock Warnings</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-amber-400">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-display">{lowStockCount}</p>
          <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
            Items nearing minimum threshold
          </p>
        </div>

        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-[#A1A1AA]">Out of Stock</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-red-400">
              <AlertCircle size={18} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-extrabold text-white font-display">{outOfStockCount}</p>
          <p className="mt-3 text-xs text-[#A1A1AA]/80 border-t border-[#2A2B30]/60 pt-3">
            Depleted items requiring replenishment
          </p>
        </div>
      </div>

      {/* Stock Levels Table Container */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
          <div>
            <h2 className="text-lg font-bold text-white font-display">
              SKU Stock Breakdown
            </h2>
            <p className="text-xs text-[#A1A1AA] mt-0.5">
              Current storage quantity vs minimum reorder levels
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by product name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-72 pl-10 pr-4 py-2 bg-[#111214] border border-[#2A2B30] rounded-2xl text-xs text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316]/60 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#A1A1AA]">
            Loading inventory records...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm font-bold text-white">Unable to load inventory</p>
            <p className="text-xs text-[#A1A1AA]">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Product Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Current Stock</th>
                  <th className="p-3.5">Min Safety Level</th>
                  <th className="p-3.5 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B30]/60">
                {filtered.map((item) => {
                  const isOut = item.stock === 0;
                  const isLow = item.stock > 0 && item.stock <= item.minStock;

                  return (
                    <tr key={item._id} className="hover:bg-[#111214]/60 transition">
                      <td className="p-3.5 pl-4 font-bold text-white font-display">
                        {item.name}
                      </td>
                      <td className="p-3.5 text-[#A1A1AA] font-mono">
                        {item.category || "General"}
                      </td>
                      <td className="p-3.5 font-extrabold text-white font-display">
                        {item.stock} units
                      </td>
                      <td className="p-3.5 text-[#A1A1AA] font-mono">
                        {item.minStock} units
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOut
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : isLow
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOut
                                ? "bg-red-400"
                                : isLow
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-emerald-400"
                            }`}
                          />
                          <span>{isOut ? "Out of Stock" : isLow ? "Low Stock" : "Optimal"}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-10 text-center text-[#A1A1AA] space-y-2 mt-4">
                <Package size={24} className="mx-auto text-[#A1A1AA]/40" />
                <p className="text-sm font-bold text-white">No inventory items matched</p>
                <p className="text-xs text-[#A1A1AA]">Adjust your search query.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inventory History Section */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-4 border-b border-[#2A2B30]/60">
          <History size={17} className="text-[#F97316]" />
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Recent Inventory Adjustments
            </h2>
            <p className="text-xs text-[#A1A1AA]">Audit trail of warehouse stock changes</p>
          </div>
        </div>

        <div className="space-y-3">
          {historyEntries.slice(0, 5).map((entry) => (
            <div
              key={entry._id}
              className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="text-xs font-bold text-white">{entry.productName}</p>
                <p className="text-[11px] text-[#A1A1AA] mt-0.5">{entry.details || "Stock quantity updated"}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-mono text-emerald-400 font-bold">
                  {entry.quantity > 0 ? `+${entry.quantity}` : entry.quantity} units
                </span>
                <span className="text-[#A1A1AA] font-mono text-[10px]">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {historyEntries.length === 0 && (
            <div className="p-8 text-center text-xs text-[#A1A1AA]">
              No stock adjustment history on record yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
