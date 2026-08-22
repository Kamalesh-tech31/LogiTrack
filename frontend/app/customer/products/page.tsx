"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/mock-data";
import { fetchProducts, API_BASE_URL } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { Search, MapPin, ShoppingCart, Zap, Package, Check, AlertCircle } from "lucide-react";

type NormalizedProduct = Product;

type OrderMessage = {
  type: "success" | "error";
  text: string;
};

type DeliveryAddress = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<OrderMessage | null>(null);
  const [orderingProductId, setOrderingProductId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<NormalizedProduct | null>(null);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: 0,
    longitude: 0,
  });
  const router = useRouter();

  const normalizeProduct = (
    product: any,
    index: number,
  ): NormalizedProduct => ({
    id: String(product.id || product._id || `product-${index}`),
    name: product.name || "Unnamed product",
    price:
      typeof product.price === "number"
        ? product.price
        : Number(product.price) || 0,
    image:
      product.image ||
      (Array.isArray(product.images) && product.images[0]) ||
      "/placeholder.png",
    category: product.category || "General",
  });

  const handleAddressChange = (field: keyof DeliveryAddress, value: any) => {
    setDeliveryAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setOrderMessage({
        type: "error",
        text: "Geolocation is not supported in your browser.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setDeliveryAddress((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lon,
        }));

        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
            {
              headers: { "User-Agent": "LogiTrack/1.0 (contact@example.com)" },
            },
          );
          if (resp.ok) {
            const data = await resp.json();
            const address = data.address || {};
            setDeliveryAddress((prev) => ({
              ...prev,
              street:
                (address.road
                  ? `${address.road}${address.house_number ? " " + address.house_number : ""}`
                  : prev.street) || prev.street,
              city:
                address.city || address.town || address.village || prev.city,
              state: address.state || prev.state,
              postalCode: address.postcode || prev.postalCode,
              country: address.country || prev.country,
              latitude: lat,
              longitude: lon,
            }));
            setOrderMessage({
              type: "success",
              text: "Location resolved and filled into address form.",
            });
          } else {
            setOrderMessage({
              type: "success",
              text: "Coordinates captured. Please fill the address fields.",
            });
          }
        } catch {
          setOrderMessage({
            type: "success",
            text: "Coordinates captured. Please fill the address fields.",
          });
        }
      },
      (error) => {
        setOrderMessage({
          type: "error",
          text: `Unable to get location: ${error.message}`,
        });
      },
    );
  };

  const handleOrderNow = async (product: NormalizedProduct) => {
    setSelectedProduct(product);
    setShowAddressForm(true);
    setOrderMessage(null);
  };

  const handleAddToCart = (product: NormalizedProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
    setAddedProductId(product.id);
    setOrderMessage({
      type: "success",
      text: `"${product.name}" added to cart.`,
    });
    setTimeout(() => setAddedProductId(null), 2000);
  };

  const submitOrder = async () => {
    setOrderMessage(null);
    setOrderingProductId(selectedProduct?.id || null);

    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    if (!userId) {
      setOrderMessage({
        type: "error",
        text: "Please sign in before placing an order.",
      });
      setOrderingProductId(null);
      return;
    }

    if (
      !deliveryAddress.street ||
      !deliveryAddress.city ||
      !deliveryAddress.country ||
      deliveryAddress.latitude === 0 ||
      deliveryAddress.longitude === 0
    ) {
      setOrderMessage({
        type: "error",
        text: "Please fill in all required address fields and add latitude/longitude.",
      });
      setOrderingProductId(null);
      return;
    }

    if (!selectedProduct) return;

    const orderPayload = {
      userId,
      items: [
        {
          productId: selectedProduct.id,
          quantity: 1,
        },
      ],
      deliveryAddress,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            typeof window !== "undefined"
              ? `Bearer ${localStorage.getItem("token")}`
              : "",
        },
        body: JSON.stringify(orderPayload),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(responseText || "Failed to place order.");
      }

      setOrderMessage({
        type: "success",
        text: "Order placed successfully. Redirecting to your orders...",
      });

      setShowAddressForm(false);
      setDeliveryAddress({
        street: "",
        city: "",
        state: "",
        postalCode: "",
        country: "",
        latitude: 0,
        longitude: 0,
      });

      setTimeout(() => {
        router.push("/customer/orders");
      }, 800);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.";
      setOrderMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setOrderingProductId(null);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const productsData = await fetchProducts();
        const normalizedProducts = Array.isArray(productsData)
          ? productsData.map(normalizeProduct)
          : [];
        setProducts(normalizedProducts);
      } catch (fetchError) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Unable to load products",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Customer-Friendly Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Product Catalog
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Products Marketplace
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Browse verified products available for immediate ordering and on-demand delivery.
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A1A1AA]" />
          <input
            type="text"
            placeholder="Search products by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl text-xs text-white placeholder-[#A1A1AA]/60 focus:outline-none focus:border-[#F97316]/60 transition"
          />
        </div>

        <p className="text-xs text-[#A1A1AA] font-mono">
          Showing <span className="text-white font-bold">{filteredProducts.length}</span> items
        </p>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && selectedProduct && (
        <div className="rounded-3xl border border-[#F97316]/40 bg-[#1A1B1E] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2A2B30]/80">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#F97316]" />
              <span>Delivery Address for {selectedProduct.name}</span>
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowAddressForm(false);
                setSelectedProduct(null);
              }}
              className="text-[#A1A1AA] hover:text-white text-xl leading-none cursor-pointer"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <input
              type="text"
              placeholder="Street Address *"
              value={deliveryAddress.street}
              onChange={(e) => handleAddressChange("street", e.target.value)}
              className="px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
            />
            <input
              type="text"
              placeholder="City *"
              value={deliveryAddress.city}
              onChange={(e) => handleAddressChange("city", e.target.value)}
              className="px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
            />
            <input
              type="text"
              placeholder="State"
              value={deliveryAddress.state}
              onChange={(e) => handleAddressChange("state", e.target.value)}
              className="px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Postal Code"
              value={deliveryAddress.postalCode}
              onChange={(e) => handleAddressChange("postalCode", e.target.value)}
              className="px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Country *"
              value={deliveryAddress.country}
              onChange={(e) => handleAddressChange("country", e.target.value)}
              className="px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                placeholder="Lat *"
                value={deliveryAddress.latitude || ""}
                onChange={(e) => handleAddressChange("latitude", Number(e.target.value))}
                className="w-1/2 px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng *"
                value={deliveryAddress.longitude || ""}
                onChange={(e) => handleAddressChange("longitude", Number(e.target.value))}
                className="w-1/2 px-3.5 py-2.5 border border-[#2A2B30] rounded-xl bg-[#111214] text-xs text-white placeholder-[#A1A1AA]/60 focus:border-[#F97316]/60 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={useCurrentLocation}
              className="col-span-full sm:col-span-1 px-3.5 py-2 rounded-xl bg-[#111214] border border-[#2A2B30] text-xs text-[#FDBA74] hover:border-[#F97316]/50 hover:bg-[#1A1B1E] transition cursor-pointer"
            >
              Use Current GPS Location
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-3 border-t border-[#2A2B30]/60">
            <button
              type="button"
              onClick={() => {
                setShowAddressForm(false);
                setSelectedProduct(null);
              }}
              className="px-4 py-2 rounded-xl border border-[#2A2B30] bg-[#111214] text-xs text-[#A1A1AA] hover:text-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitOrder}
              disabled={orderingProductId === selectedProduct.id}
              className="px-5 py-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer disabled:opacity-50"
            >
              {orderingProductId === selectedProduct.id ? "Placing Order..." : "Confirm & Place Order"}
            </button>
          </div>

          {orderMessage && (
            <p className={`text-xs mt-2 ${orderMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}>
              {orderMessage.text}
            </p>
          )}
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16 text-[#A1A1AA] text-xs">
            Loading products marketplace...
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center space-y-2">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm font-bold text-white">Unable to load products</p>
            <p className="text-xs text-[#A1A1AA]">{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const isAdded = addedProductId === product.id;

            return (
              <div
                key={product.id}
                className="group rounded-3xl overflow-hidden border border-[#2A2B30] bg-[#1A1B1E] shadow-sm hover:border-[#F97316]/50 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square overflow-hidden bg-[#111214]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="rounded-full bg-[#111214]/80 backdrop-blur-md border border-[#2A2B30] px-2.5 py-0.5 text-[10px] font-mono text-[#A1A1AA]">
                        {product.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-bold text-white text-sm font-display truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">Verified inventory item</p>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-3">
                  <div className="flex items-center justify-between border-t border-[#2A2B30]/50 pt-3">
                    <span className="text-lg font-extrabold text-white font-display">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                      Ready to Ship
                    </span>
                  </div>

                  {/* Dual Actions: Add to Cart (Secondary) + Order Now (Brand Orange Primary) */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 text-xs font-medium text-[#F4F4F5] transition cursor-pointer"
                    >
                      {isAdded ? <Check size={13} className="text-emerald-400" /> : <ShoppingCart size={13} />}
                      <span>{isAdded ? "Added" : "Add to Cart"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOrderNow(product)}
                      disabled={showAddressForm && selectedProduct?.id === product.id}
                      className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_10px_rgba(249,115,22,0.25)] cursor-pointer disabled:opacity-50"
                    >
                      <Zap size={13} />
                      <span>Order Now</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA] space-y-2">
            <Package size={28} className="mx-auto text-[#A1A1AA]/40" />
            <p className="text-sm font-bold text-white">No products found</p>
            <p className="text-xs text-[#A1A1AA]">Try adjusting your search criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
