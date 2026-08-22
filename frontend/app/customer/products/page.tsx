"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/mock-data";
import { fetchProducts, API_BASE_URL } from "@/lib/api";
import { addToCart } from "@/lib/cart";
import { OrderSuccessModal } from "@/components/customer/order-success-modal";
import {
  DeliveryAddressSection,
  type StructuredAddressData,
} from "@/components/customer/delivery-address-section";
import { saveAddressItem, buildFullAddress } from "@/lib/addressStorage";
import { OrderCompletionPill } from "@/components/customer/order-completion-pill";
import {
  Search,
  MapPin,
  ShoppingCart,
} from "lucide-react";

type NormalizedProduct = Product;

type OrderMessage = {
  type: "success" | "error";
  text: string;
};

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

  const [addressData, setAddressData] = useState<StructuredAddressData>({
    fullName: "",
    phone: "",
    doorNo: "",
    street: "",
    area: "",
    city: "",
    state: "",
    postalCode: "",
    fullAddress: "",
    latitude: null,
    longitude: null,
  });

  const [saveAddressOnOrder, setSaveAddressOnOrder] = useState(false);
  const [selectedLabelType, setSelectedLabelType] = useState<
    "Home" | "Work" | "Friend" | "Custom"
  >("Home");
  const [customLabelName, setCustomLabelName] = useState("");

  const [placedOrderInfo, setPlacedOrderInfo] = useState<{
    orderId?: string;
    totalAmount?: number;
    itemsCount?: number;
    deliveryAddress?: any;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
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

  const handleOrderNow = async (product: NormalizedProduct) => {
    setSelectedProduct(product);
    try {
      const defaultName = localStorage.getItem("userName") || "";
      if (defaultName && !addressData.fullName) {
        setAddressData((prev) => ({ ...prev, fullName: defaultName }));
      }
    } catch {}
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
    toast.success(`Added "${product.name}" to cart`);
  };

  const submitOrder = async (): Promise<boolean> => {
    setOrderMessage(null);
    setOrderingProductId(selectedProduct?.id || null);

    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;

    if (!userId) {
      toast.error("Please sign in before placing an order.");
      setOrderMessage({
        type: "error",
        text: "Please sign in before placing an order.",
      });
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.fullName.trim()) {
      toast.error("Please enter recipient Full Name.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.phone.trim()) {
      toast.error("Please enter contact Phone Number.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.doorNo.trim()) {
      toast.error("Please enter House / Door No.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.street.trim()) {
      toast.error("Please enter Street / Avenue.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.area.trim()) {
      toast.error("Please enter Area / Locality.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.city.trim()) {
      toast.error("Please enter City.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.state.trim()) {
      toast.error("Please enter State.");
      setOrderingProductId(null);
      return false;
    }

    if (!addressData.postalCode.trim()) {
      toast.error("Please enter PIN Code.");
      setOrderingProductId(null);
      return false;
    }

    if (!selectedProduct) return false;

    const compiledFullAddress =
      addressData.fullAddress?.trim() ||
      buildFullAddress({
        doorNo: addressData.doorNo,
        street: addressData.street,
        area: addressData.area,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
      });

    try {
      let finalLat = addressData.latitude;
      let finalLon = addressData.longitude;

      if (
        finalLat === null ||
        finalLon === null ||
        isNaN(finalLat) ||
        isNaN(finalLon)
      ) {
        const geocodeToast = toast.loading("Verifying delivery location...", {
          id: "prod-order-geocode",
        });

        const geocodeResponse = await fetch(`${API_BASE_URL}/api/orders/geocode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              typeof window !== "undefined"
                ? `Bearer ${localStorage.getItem("token")}`
                : "",
          },
          body: JSON.stringify({ address: compiledFullAddress }),
        });

        const geoJson = await geocodeResponse.json();

        if (!geocodeResponse.ok || !geoJson.success || !geoJson.data) {
          toast.error(
            geoJson.message ||
              "We could not determine the exact location for this address. Please verify your address details.",
            { id: "prod-order-geocode", duration: 5000 },
          );
          setOrderingProductId(null);
          return false;
        }

        toast.dismiss("prod-order-geocode");
        finalLat = geoJson.data.latitude;
        finalLon = geoJson.data.longitude;
      }

      if (
        finalLat === null ||
        finalLon === null ||
        isNaN(finalLat) ||
        isNaN(finalLon)
      ) {
        toast.error(
          "Unable to resolve valid delivery coordinates. Please check your address details.",
        );
        setOrderingProductId(null);
        return false;
      }

      // Save address if requested
      if (saveAddressOnOrder) {
        let labelToSave = selectedLabelType;
        if (
          selectedLabelType === "Friend" ||
          selectedLabelType === "Custom"
        ) {
          labelToSave = (customLabelName.trim() || selectedLabelType) as any;
        }

        saveAddressItem(
          {
            label: labelToSave,
            fullName: addressData.fullName.trim(),
            phone: addressData.phone.trim(),
            doorNo: addressData.doorNo.trim(),
            street: addressData.street.trim(),
            area: addressData.area.trim(),
            city: addressData.city.trim(),
            state: addressData.state.trim(),
            postalCode: addressData.postalCode.trim(),
            fullAddress: compiledFullAddress,
            latitude: finalLat,
            longitude: finalLon,
            country: "India",
          },
          userId,
        );
      }

      const orderPayload = {
        userId,
        items: [
          {
            productId: selectedProduct.id,
            quantity: 1,
          },
        ],
        deliveryAddress: {
          fullName: addressData.fullName.trim(),
          phone: addressData.phone.trim(),
          fullAddress: compiledFullAddress,
          street: compiledFullAddress,
          city: addressData.city.trim(),
          state: addressData.state.trim(),
          postalCode: addressData.postalCode.trim(),
          country: "India",
          latitude: finalLat,
          longitude: finalLon,
        },
      };

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

      if (!response.ok) {
        const responseText = await response.text();
        throw new Error(responseText || "Failed to place order.");
      }

      const resData = await response.json();
      const orderId =
        resData?.data?.orderId || resData?.data?._id || `ORD-${Date.now()}`;

      setPlacedOrderInfo({
        orderId,
        totalAmount: selectedProduct.price,
        itemsCount: 1,
        deliveryAddress: {
          fullName: addressData.fullName,
          phone: addressData.phone,
          street: compiledFullAddress,
          city: addressData.city,
          state: addressData.state,
          postalCode: addressData.postalCode,
        },
      });

      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to place order. Please try again.";
      toast.error(errorMessage);
      setOrderMessage({
        type: "error",
        text: errorMessage,
      });
      return false;
    } finally {
      setOrderingProductId(null);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data)) {
          setProducts(data.map(normalizeProduct));
        } else if (Array.isArray(data?.products)) {
          setProducts(data.products.map(normalizeProduct));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Products fetch error:", err);
        setError("Failed to load products. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const filteredProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    const nameMatch = product.name?.toLowerCase().includes(query);
    const categoryMatch = product.category?.toLowerCase().includes(query);
    return nameMatch || categoryMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse and order products for delivery
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Address Form Modal */}
      {showAddressForm && selectedProduct && (
        <Card className="border border-[#7F1D1D]/40 bg-[#161616] shadow-2xl rounded-3xl overflow-hidden animate-in fade-in-0 duration-200">
          <CardContent className="p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3.5">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-red-500" />
                  Delivery Details for {selectedProduct.name}
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Confirm recipient and delivery address to place your order.
                </p>
              </div>
              <span className="text-base font-bold text-white">
                ₹{selectedProduct.price.toLocaleString()}
              </span>
            </div>

            <DeliveryAddressSection
              value={addressData}
              onChange={setAddressData}
              saveAddressOnOrder={saveAddressOnOrder}
              onSaveAddressOnOrderChange={setSaveAddressOnOrder}
              selectedLabelType={selectedLabelType}
              onSelectedLabelTypeChange={setSelectedLabelType}
              customLabelName={customLabelName}
              onCustomLabelNameChange={setCustomLabelName}
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-800/80">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddressForm(false);
                  setSelectedProduct(null);
                }}
                className="border-neutral-800 hover:bg-white/5 rounded-xl px-5"
              >
                Cancel
              </Button>
              <OrderCompletionPill
                onClick={submitOrder}
                disabled={orderingProductId === selectedProduct.id}
                onAnimationFinished={() => {
                  setShowAddressForm(false);
                  setShowSuccessModal(true);
                }}
              />
            </div>

            {orderMessage && (
              <p
                className={
                  orderMessage.type === "success"
                    ? "text-emerald-400 text-sm"
                    : "text-red-400 text-sm"
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
          <div className="col-span-full flex items-center justify-center py-16">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className="group overflow-hidden border border-[#27272A] bg-[#111111] shadow-sm transition-all hover:border-[#3F3F46]"
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden bg-[#0B0B0B]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute right-3 top-3">
                    <button
                      type="button"
                      className="rounded-full bg-black/60 p-2 text-white backdrop-blur-xs transition-colors hover:bg-black/80"
                      aria-label="Save product"
                    >
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {product.category}
                  </Badge>
                  <h3 className="line-clamp-1 font-semibold text-white">
                    {product.name}
                  </h3>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-white">
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

      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          setSelectedProduct(null);
        }}
        orderId={placedOrderInfo?.orderId}
        totalAmount={placedOrderInfo?.totalAmount}
        itemsCount={placedOrderInfo?.itemsCount}
        deliveryAddress={placedOrderInfo?.deliveryAddress}
      />
    </div>
  );
}
