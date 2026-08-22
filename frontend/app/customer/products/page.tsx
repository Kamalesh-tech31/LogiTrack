"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/mock-data";
import { fetchProducts, API_BASE_URL } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { Search, Filter, Heart, MapPin, ShoppingCart } from "lucide-react";

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

// Removed category filtering - users should use search only

export default function ProductsPage() {
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState<OrderMessage | null>(null);
  const [orderingProductId, setOrderingProductId] = useState<string | null>(
    null,
  );
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<NormalizedProduct | null>(null);
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

        // Try reverse-geocoding via Nominatim to fill address fields
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
        } catch (err) {
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
    setOrderMessage({
      type: "success",
      text: "Product added to cart.",
    });
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

    console.log("=== FRONTEND: PLACING ORDER ===");
    console.log(
      "Product selected:",
      selectedProduct.id,
      "Name:",
      selectedProduct.name,
    );
    console.log("Customer (userId):", userId);
    console.log("Delivery Address:", deliveryAddress);
    console.log("Sending payload:", JSON.stringify(orderPayload));

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

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response body:", responseText);

      if (!response.ok) {
        throw new Error(responseText || "Failed to place order.");
      }

      setOrderMessage({
        type: "success",
        text: "Order placed successfully. Redirecting...",
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
      console.error("Order error:", errorMessage);
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

    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse our collection of premium electronics and accessories
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Category filter removed - use search only */}
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && selectedProduct && (
        <Card className="border border-amber-500/50 bg-amber-500/5 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Address for {selectedProduct.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Street Address *"
                value={deliveryAddress.street}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="text"
                placeholder="City *"
                value={deliveryAddress.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="text"
                placeholder="State"
                value={deliveryAddress.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={deliveryAddress.postalCode}
                onChange={(e) =>
                  handleAddressChange("postalCode", e.target.value)
                }
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="text"
                placeholder="Country *"
                value={deliveryAddress.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="number"
                step="any"
                placeholder="Latitude *"
                value={deliveryAddress.latitude}
                onChange={(e) =>
                  handleAddressChange("latitude", Number(e.target.value))
                }
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <input
                type="number"
                step="any"
                placeholder="Longitude *"
                value={deliveryAddress.longitude}
                onChange={(e) =>
                  handleAddressChange("longitude", Number(e.target.value))
                }
                className="px-3 py-2 border border-muted-foreground/30 rounded-lg bg-background text-foreground placeholder-muted-foreground"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={useCurrentLocation}
                className="col-span-full sm:col-span-1"
              >
                Use Current Location
              </Button>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddressForm(false);
                  setSelectedProduct(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={submitOrder}
                disabled={orderingProductId === selectedProduct.id}
              >
                {orderingProductId === selectedProduct.id
                  ? "Placing Order..."
                  : "Place Order"}
              </Button>
            </div>

            {orderMessage && (
              <p
                className={
                  orderMessage.type === "success"
                    ? "text-emerald-300 text-sm"
                    : "text-red-300 text-sm"
                }
              >
                {orderMessage.text}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading products...</p>
          </div>
        ) : error ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium text-foreground">
              Unable to load products
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden border-none shadow-sm transition-shadow hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden bg-zinc-900">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    aria-label="Add product to favorites"
                    className="absolute right-3 top-3 rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Heart className="h-4 w-4 text-foreground" />
                  </button>
                  <Badge className="absolute left-3 top-3 bg-primary text-primary-foreground">
                    {product.category}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-foreground">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Premium quality product
                  </p>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xl font-bold text-foreground">
                      ₹{product.price.toLocaleString()}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => handleAddToCart(product)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="gap-2"
                        onClick={() => handleOrderNow(product)}
                        disabled={
                          showAddressForm && selectedProduct?.id === product.id
                        }
                      >
                        Order Now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-foreground">
              No products found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
