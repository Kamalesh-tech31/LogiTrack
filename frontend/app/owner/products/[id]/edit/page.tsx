"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { fetchOwnerProductById, updateOwnerProduct } from "@/lib/api";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [image, setImage] = useState("");

  useEffect(() => {
    if (!id) return;
    (async function load() {
      setLoading(true);
      setError(null);
      try {
        const p = await fetchOwnerProductById(id);
        setName(p.name ?? "");
        setSku(p.sku ?? "");
        setPrice(p.price != null ? String(p.price) : "");
        setStock(Number(p.stock) || 0);
        setImage(Array.isArray(p.images) && p.images.length ? p.images[0] : "");
      } catch (err: any) {
        setError(err?.message ?? "Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function statusFromStock(value: number) {
    if (value <= 0) return "Out of Stock";
    if (value <= 5) return "Low Stock";
    return "In Stock";
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      sku: sku.trim(),
      price: Number(String(price).replace(/[^0-9.]/g, "")) || 0,
      stock,
      images: [image.trim()],
      status: statusFromStock(stock),
    };

    try {
      await updateOwnerProduct(id, payload);
      router.push("/owner/products");
    } catch (err: any) {
      setError(err?.message ?? "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-white">
        <p>Loading product...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-white">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Edit Product</h1>

      <div className="space-y-4 max-w-md">
        <input
          type="text"
          placeholder="Product name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />
        <input
          type="text"
          placeholder="SKU"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />
        <input
          type="text"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />
        <input
          type="number"
          placeholder="Stock"
          value={stock}
          onChange={(e) => setStock(Number(e.target.value))}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />
        <input
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl pl-4 pr-4 py-3 text-[#F4F4F5] outline-none focus:border-[#F97316]"
        />

        {error && <p className="text-red-400">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#F97316] hover:bg-[#EA580C] rounded-2xl text-white font-medium transition cursor-pointer shadow-[0_0_12px_rgba(249,115,22,0.3)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
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