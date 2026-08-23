"use client";

import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  Upload,
  Link as LinkIcon,
  Sparkles,
  ArrowLeft,
  X,
  CheckCircle2,
  AlertCircle,
  Package,
  Image as ImageIcon,
} from "lucide-react";
import {
  fetchOwnerProductById,
  updateOwnerProduct,
  generateOwnerSku,
  uploadOwnerProductImage,
} from "@/lib/api";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1580894908361-967195033215";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingSku, setGeneratingSku] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState<number | string>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Electronics");

  const [imageInputMode, setImageInputMode] = useState<"device" | "url">("device");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

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
        setDescription(p.description ?? "");
        setCategory(p.category ?? "General");

        const initialImg =
          Array.isArray(p.images) && p.images.length ? p.images[0] : "";
        if (initialImg) {
          setPreviewUrl(initialImg);
          setImageUrl(initialImg);
        }
      } catch (err: any) {
        setError(err?.message ?? "Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function handleGenerateSku() {
    setGeneratingSku(true);
    setError(null);
    try {
      const res = await generateOwnerSku(name);
      if (res?.sku) {
        setSku(res.sku);
        toast.success(`Generated SKU: ${res.sku}`);
      } else {
        const prefix = (name.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()) || "PRD";
        const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        let rand = "";
        for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
        const localSku = `${prefix}-${rand}`;
        setSku(localSku);
        toast.success(`Generated SKU: ${localSku}`);
      }
    } catch {
      const prefix = (name.trim().replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase()) || "PRD";
      const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
      let rand = "";
      for (let i = 0; i < 6; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
      const localSku = `${prefix}-${rand}`;
      setSku(localSku);
      toast.success(`Generated SKU: ${localSku}`);
    } finally {
      setGeneratingSku(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPEG, PNG, WEBP, GIF, SVG).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image file size exceeds 10MB limit.");
      return;
    }

    setSelectedFile(file);
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  }

  function handleClearImage() {
    setSelectedFile(null);
    setPreviewUrl("");
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function statusFromStock(value: number) {
    if (value <= 0) return "Out of Stock";
    if (value <= 5) return "Low Stock";
    return "In Stock";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }

    const numPrice = Number(String(price).replace(/[^0-9.]/g, ""));
    if (isNaN(numPrice) || numPrice < 0) {
      setError("Please specify a valid price.");
      return;
    }

    const numStock = Number(stock) || 0;

    setSaving(true);
    setError(null);

    try {
      let finalImageUrl = previewUrl;

      if (imageInputMode === "device" && selectedFile) {
        toast.loading("Uploading image to Cloudinary...", { id: "upload-toast" });
        const uploadRes = await uploadOwnerProductImage(selectedFile);
        toast.dismiss("upload-toast");

        if (!uploadRes?.url) {
          throw new Error("Failed to upload image to Cloudinary.");
        }
        finalImageUrl = uploadRes.url;
      } else if (imageInputMode === "url" && imageUrl.trim()) {
        finalImageUrl = imageUrl.trim();
      }

      const payload = {
        name: name.trim(),
        sku: sku.trim(),
        price: numPrice,
        stock: numStock,
        description: description.trim(),
        category: category.trim(),
        images: finalImageUrl ? [finalImageUrl] : [DEFAULT_IMAGE],
        status: statusFromStock(numStock),
      };

      await updateOwnerProduct(id, payload);
      toast.success("Product updated successfully!");
      router.push("/owner/products");
    } catch (err: any) {
      toast.dismiss("upload-toast");
      setError(err?.message ?? "Failed to update product");
      toast.error(err?.message ?? "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-[#A1A1AA]">
        <span className="inline-block h-4 w-4 rounded-full border-2 border-[#F97316] border-t-transparent animate-spin mr-2" />
        <span>Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#2A2B30]">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-white transition mb-2 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Products</span>
          </button>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            Edit Product
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Update product catalog information, pricing, stock levels, and Cloudinary media.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Main Form Cards */}
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column: Product Information */}
          <div className="space-y-5 rounded-3xl bg-[#1A1B1E] border border-[#2A2B30] p-6 shadow-sm">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Package size={18} className="text-[#F97316]" />
              <span>Product Details</span>
            </h2>

            {/* Product Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm text-[#F4F4F5] outline-none focus:border-[#F97316] transition"
              />
            </div>

            {/* SKU Input + Auto-Generator */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                  Stock Keeping Unit (SKU)
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  disabled={generatingSku}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FDBA74] hover:text-[#F97316] transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={13} className={generatingSku ? "animate-spin" : ""} />
                  <span>{generatingSku ? "Generating..." : "Generate SKU"}</span>
                </button>
              </div>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm font-mono text-[#F4F4F5] outline-none focus:border-[#F97316] transition pr-28"
                />
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  disabled={generatingSku}
                  className="absolute right-2 px-3 py-1.5 rounded-xl bg-[#F97316]/15 hover:bg-[#F97316]/25 border border-[#F97316]/30 text-xs font-semibold text-[#FDBA74] transition cursor-pointer"
                >
                  Auto-SKU
                </button>
              </div>
            </div>

            {/* Price & Stock Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm text-[#F4F4F5] outline-none focus:border-[#F97316] transition font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm text-[#F4F4F5] outline-none focus:border-[#F97316] transition font-mono"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm text-[#F4F4F5] outline-none focus:border-[#F97316] transition cursor-pointer"
              >
                <option value="Electronics">Electronics</option>
                <option value="Groceries">Groceries & Food</option>
                <option value="Clothing">Apparel & Fashion</option>
                <option value="Home & Kitchen">Home & Kitchen</option>
                <option value="Healthcare">Healthcare & Pharmacy</option>
                <option value="Automotive">Automotive</option>
                <option value="General">General Goods</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
                Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-sm text-[#F4F4F5] outline-none focus:border-[#F97316] transition resize-none"
              />
            </div>
          </div>

          {/* Right Column: Product Image */}
          <div className="space-y-5 rounded-3xl bg-[#1A1B1E] border border-[#2A2B30] p-6 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#2A2B30]/60">
                <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <ImageIcon size={18} className="text-[#F97316]" />
                  <span>Product Image</span>
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F97316]/10 border border-[#F97316]/25 text-[#FDBA74]">
                  Cloudinary CDN
                </span>
              </div>

              {/* Two Input Methods Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#111214] border border-[#2A2B30]">
                <button
                  type="button"
                  onClick={() => setImageInputMode("device")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    imageInputMode === "device"
                      ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  <Upload size={14} />
                  <span>Upload Device</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImageInputMode("url")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    imageInputMode === "url"
                      ? "bg-[#F97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                      : "text-[#A1A1AA] hover:text-white"
                  }`}
                >
                  <LinkIcon size={14} />
                  <span>Image URL</span>
                </button>
              </div>

              {/* Option A: Upload from Device */}
              {imageInputMode === "device" && (
                <div className="space-y-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#2A2B30] hover:border-[#F97316]/60 rounded-2xl p-6 text-center cursor-pointer transition bg-[#111214]/60 hover:bg-[#111214] group"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316] mx-auto mb-3 group-hover:scale-105 transition">
                      <Upload size={20} />
                    </div>
                    <p className="text-xs font-bold text-white">
                      Click to replace image from device
                    </p>
                    <p className="text-[11px] text-[#A1A1AA] mt-1">
                      JPEG, PNG, WEBP, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}

              {/* Option B: Image URL */}
              {imageInputMode === "url" && (
                <div className="space-y-3">
                  <input
                    type="url"
                    placeholder="https://example.com/product-image.jpg"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setPreviewUrl(e.target.value.trim());
                    }}
                    className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 text-xs text-[#F4F4F5] outline-none focus:border-[#F97316] transition"
                  />
                  <p className="text-[11px] text-[#A1A1AA]">
                    Remote images are validated and securely imported to Cloudinary CDN.
                  </p>
                </div>
              )}

              {/* Image Preview Canvas */}
              {previewUrl && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                    <span className="font-semibold text-white">Preview</span>
                    <button
                      type="button"
                      onClick={handleClearImage}
                      className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      <X size={12} />
                      <span>Remove</span>
                    </button>
                  </div>

                  <div className="relative h-48 w-full rounded-2xl bg-black/40 border border-[#2A2B30] overflow-hidden flex items-center justify-center">
                    <img
                      src={previewUrl || DEFAULT_IMAGE}
                      alt="Product preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#2A2B30]">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm transition cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} />
                <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="py-3.5 px-5 rounded-2xl bg-[#111214] hover:bg-[#2A2B30] border border-[#2A2B30] text-[#A1A1AA] hover:text-white text-sm font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}