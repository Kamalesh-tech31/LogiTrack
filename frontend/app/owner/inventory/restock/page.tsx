"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchOwnerInventory, updateOwnerStock } from "@/lib/api";

interface InventoryProduct {
  _id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  minStock: number;
}

export default function InventoryRestockPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<InventoryProduct[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [addAmount, setAddAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadInventory() {
      setLoading(true);
      setError(null);

      try {
        const products = await fetchOwnerInventory();
        setInventory(Array.isArray(products) ? products : []);
        setSelectedId(Array.isArray(products) && products.length ? products[0]._id : "");
      } catch (err: any) {
        setError(err?.message ?? "Unable to load inventory");
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, []);

  async function handleRestock() {
    if (selectedId === "" || addAmount <= 0) return;

    setSaving(true);
    setError(null);

    try {
      await updateOwnerStock(selectedId, { delta: addAmount });

      router.push("/owner/inventory");
    } catch (err: any) {
      setError(err?.message ?? "Unable to restock product");
    } finally {
      setSaving(false);
    }
  }

  const selectedItem = inventory.find((item) => item._id === selectedId);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Restock Inventory</h1>

      <div className="space-y-4 max-w-md">
        <label htmlFor="product-select" className="block text-[#A1A1AA]">Select product</label>
        <select
          id="product-select"
          value={selectedId != null ? selectedId : ""}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        >
          <option value="" disabled>
            -- Select product --
          </option>
          {inventory.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>

        {selectedItem && (
          <p className="text-[#A1A1AA]">
            Current stock: <span className="text-white font-semibold">{selectedItem.stock}</span>
          </p>
        )}

        <input
          type="number"
          placeholder="Add quantity"
          value={addAmount}
          onChange={(e) => setAddAmount(Number(e.target.value))}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />

        {error && <p className="text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleRestock}
            disabled={saving}
            className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] rounded-2xl text-white font-medium transition cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.3)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Restock"}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-[#1A1B1E] hover:bg-[#2A2B30] border border-[#2A2B30] rounded-2xl text-[#A1A1AA] hover:text-white transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}