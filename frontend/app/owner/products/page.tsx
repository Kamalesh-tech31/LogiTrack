"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Search, Plus, Trash2, Package, AlertCircle } from "lucide-react";
import { fetchOwnerProducts, deleteOwnerProduct } from "@/lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1580894908361-967195033215";

interface ApiProduct {
  _id: string;
  name: string;
  sku?: string;
  price?: number | string;
  stock?: number;
  images?: string[];
}

interface ProductView {
  _id: string;
  name: string;
  sku?: string;
  price: string;
  stock: number;
  status: string;
  image: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const products = await fetchOwnerProducts();

        const mapped: ProductView[] = (products as ApiProduct[]).map((p) => {
          const stock =
            typeof p.stock === "number" ? p.stock : Number(p.stock) || 0;
          const status =
            stock <= 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";
          const rawPrice = p.price ?? 0;
          const priceString =
            typeof rawPrice === "number" ? `₹${rawPrice}` : String(rawPrice);
          const image =
            Array.isArray(p.images) && p.images.length
              ? p.images[0]
              : DEFAULT_IMAGE;

          return {
            _id: p._id,
            name: p.name,
            sku: p.sku || "N/A",
            price: priceString,
            stock,
            status,
            image,
          };
        });

        setItems(mapped);
      } catch (err: any) {
        setError(err?.message ?? "Unable to load products");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q)),
    );
  }, [items, query]);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteOwnerProduct(id);
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (err: any) {
      alert(err?.message ?? "Failed to delete product");
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
            Catalog Management
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
            Products Catalog
          </h1>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
            Manage inventory listings, update SKU pricing, and track live stock availability.
          </p>
        </div>

        <button
          onClick={() => router.push("/owner/products/add")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer self-start sm:self-auto"
        >
          <Plus size={15} />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search Bar Container */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#2A2B30]/60">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-2xl text-xs text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316]/60 transition"
            />
          </div>

          <p className="text-xs text-[#A1A1AA] font-mono">
            Showing <span className="text-white font-bold">{filtered.length}</span> products
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-xs text-[#A1A1AA]">
            Loading product catalog...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm font-bold text-white">Unable to load products</p>
            <p className="text-xs text-[#A1A1AA]">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-[#111214] border-b border-[#2A2B30] text-[#A1A1AA] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3.5 pl-4">Product</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2B30]/60">
                {filtered.map((item) => {
                  const isOutOfStock = item.status === "Out of Stock";
                  const isLowStock = item.status === "Low Stock";

                  return (
                    <tr key={item._id} className="hover:bg-[#111214]/60 transition">
                      <td className="p-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#111214] border border-[#2A2B30]">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white text-xs">{item.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5 text-[#A1A1AA] font-mono">
                        {item.sku}
                      </td>
                      <td className="p-3.5 font-bold text-white font-display">
                        {item.price}
                      </td>
                      <td className="p-3.5 font-semibold text-white">
                        {item.stock} units
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            isOutOfStock
                              ? "bg-red-500/10 text-red-400 border border-red-500/30"
                              : isLowStock
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOutOfStock
                                ? "bg-red-400"
                                : isLowStock
                                  ? "bg-amber-400 animate-pulse"
                                  : "bg-emerald-400"
                            }`}
                          />
                          <span>{item.status}</span>
                        </span>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(item._id)}
                          title="Delete Product"
                          className="inline-flex items-center justify-center p-2 rounded-xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-10 text-center text-[#A1A1AA] space-y-2 mt-4">
                <Package size={24} className="mx-auto text-[#A1A1AA]/40" />
                <p className="text-sm font-bold text-white">No products found</p>
                <p className="text-xs text-[#A1A1AA]">Try adjusting your search query or add a new product.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
