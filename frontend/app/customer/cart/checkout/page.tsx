"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { loadCart, removeFromCart, clearCart, type CartItem } from "@/lib/cart";
import { API_BASE_URL } from "@/lib/api";
import { OrderSuccessModal } from "@/components/customer/order-success-modal";
import {
  DeliveryAddressSection,
  type StructuredAddressData,
} from "@/components/customer/delivery-address-section";
import { saveAddressItem, buildFullAddress } from "@/lib/addressStorage";
import { OrderCompletionPill } from "@/components/customer/order-completion-pill";
import {
  MapPin,
  ShoppingBag,
  Truck,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

export default function CartCheckoutPage() {
  const router = useRouter();
  const [itemId, setItemId] = useState<string | null>(null);
  const [itemsToCheckout, setItemsToCheckout] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Structured address data
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

  // Save address options
  const [saveAddressOnOrder, setSaveAddressOnOrder] = useState(false);
  const [selectedLabelType, setSelectedLabelType] = useState<
    "Home" | "Work" | "Friend" | "Custom"
  >("Home");
  const [customLabelName, setCustomLabelName] = useState("");

  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<{
    orderId?: string;
    totalAmount?: number;
    itemsCount?: number;
    deliveryAddress?: any;
  } | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const id = params.get("itemId");
    setItemId(id);

    const cart = loadCart();
    if (id) {
      const single = cart.find((entry) => entry.id === id);
      setItemsToCheckout(single ? [single] : []);
    } else {
      setItemsToCheckout(cart);
    }

    // Default pre-fill user details
    try {
      const defaultName = localStorage.getItem("userName") || "";
      if (defaultName) {
        setAddressData((prev) => ({
          ...prev,
          fullName: prev.fullName || defaultName,
        }));
      }
    } catch {}

    setLoading(false);
  }, []);

  const totalAmount = useMemo(
    () =>
      itemsToCheckout.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    [itemsToCheckout],
  );

  const totalItemsCount = useMemo(
    () => itemsToCheckout.reduce((sum, item) => sum + item.quantity, 0),
    [itemsToCheckout],
  );

  const handlePlaceOrder = async (): Promise<boolean> => {
    if (itemsToCheckout.length === 0) {
      toast.error("No items selected for checkout.");
      return false;
    }

    if (!addressData.fullName.trim()) {
      toast.error("Please enter recipient Full Name.");
      return false;
    }

    if (!addressData.phone.trim()) {
      toast.error("Please enter contact Phone Number.");
      return false;
    }

    if (!addressData.doorNo.trim()) {
      toast.error("Please enter House / Door No.");
      return false;
    }

    if (!addressData.street.trim()) {
      toast.error("Please enter Street / Avenue.");
      return false;
    }

    if (!addressData.area.trim()) {
      toast.error("Please enter Area / Locality.");
      return false;
    }

    if (!addressData.city.trim()) {
      toast.error("Please enter City.");
      return false;
    }

    if (!addressData.state.trim()) {
      toast.error("Please enter State.");
      return false;
    }

    if (!addressData.postalCode.trim()) {
      toast.error("Please enter PIN Code.");
      return false;
    }

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

    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      toast.error("Please sign in before placing an order.");
      return false;
    }

    setPlacingOrder(true);

    try {
      let finalLat = addressData.latitude;
      let finalLon = addressData.longitude;

      // If coordinates are not yet resolved, geocode through backend Geoapify service
      if (
        finalLat === null ||
        finalLon === null ||
        isNaN(finalLat) ||
        isNaN(finalLon)
      ) {
        const geocodeToast = toast.loading("Verifying delivery location...", {
          id: "checkout-geocode",
        });

        const geocodeResponse = await fetch(
          `${API_BASE_URL}/api/orders/geocode`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                typeof window !== "undefined"
                  ? `Bearer ${localStorage.getItem("token")}`
                  : "",
            },
            body: JSON.stringify({ address: compiledFullAddress }),
          },
        );

        const geoJson = await geocodeResponse.json();

        if (!geocodeResponse.ok || !geoJson.success || !geoJson.data) {
          toast.error(
            geoJson.message ||
              "We could not determine the exact location for this address. Please verify your address details.",
            { id: "checkout-geocode", duration: 5000 },
          );
          setPlacingOrder(false);
          return false;
        }

        toast.dismiss("checkout-geocode");
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
        setPlacingOrder(false);
        return false;
      }

      // Save address if user opted to save for future orders
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
        items: itemsToCheckout.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
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
        const errorText = await response.text();
        throw new Error(errorText || "Failed to place order.");
      }

      const resData = await response.json();
      const orderId =
        resData?.data?.orderId || resData?.data?._id || `ORD-${Date.now()}`;

      // Clear ordered item(s) from cart
      if (itemId) {
        removeFromCart(itemId);
      } else {
        clearCart();
      }

      setPlacedOrderInfo({
        orderId,
        totalAmount,
        itemsCount: totalItemsCount,
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
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again.",
      );
      return false;
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-10 text-center text-muted-foreground">
          <p className="text-sm">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (itemsToCheckout.length === 0 && !showSuccessModal) {
    return (
      <div className="p-8">
        <Card className="border border-[#27272A] bg-[#111111] shadow-sm rounded-3xl">
          <CardContent className="p-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
            <p className="text-xl font-semibold text-white">
              No items selected for checkout.
            </p>
            <p className="mt-2 text-sm text-neutral-400">
              Browse our products or check your cart to proceed.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button
                variant="outline"
                className="border-neutral-800 hover:bg-white/5"
                onClick={() => router.push("/customer/cart")}
              >
                Go to Cart
              </Button>
              <Button
                className="bg-[#7F1D1D] hover:bg-[#991B1B] text-white"
                onClick={() => router.push("/customer/products")}
              >
                Browse Products
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push("/customer/cart")}
            className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Cart
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Checkout
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Review your order and specify your delivery address.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Structured Delivery Address Form */}
        <div className="space-y-6">
          <Card className="border border-[#27272A] bg-[#111111] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-900 pb-4">
              <CardTitle className="text-lg text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-500" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
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
            </CardContent>
          </Card>

          {/* Delivery & Dispatch Note */}
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-800/60 bg-[#0B0B0B] p-4 text-xs text-neutral-400">
            <Truck className="h-5 w-5 text-red-500 shrink-0" />
            <span>
              Your full address is preserved for your delivery agent, with precise map coordinates generated automatically.
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-6">
          <Card className="border border-[#27272A] bg-[#111111] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-900 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-white">
                  Order Summary
                </CardTitle>
                <span className="text-xs text-neutral-400">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {itemsToCheckout.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-neutral-800/80 bg-[#161616] p-3"
                  >
                    {item.image && (
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-black shrink-0">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-neutral-800/80 pt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="flex items-center justify-between text-base font-bold text-white pt-2 border-t border-neutral-800/50">
                  <span>Total Amount</span>
                  <span className="text-lg font-bold text-red-500">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Exact Replica Order Completion Animation Button */}
              <div className="pt-3 pb-2 flex flex-col items-center justify-center">
                <OrderCompletionPill
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || itemsToCheckout.length === 0}
                  onAnimationFinished={() => {
                    setShowSuccessModal(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-neutral-400" />
                <span>Encrypted & Verified Order Processing</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Professional Order Confirmation Modal */}
      <OrderSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push("/customer/orders");
        }}
        orderId={placedOrderInfo?.orderId}
        totalAmount={placedOrderInfo?.totalAmount}
        itemsCount={placedOrderInfo?.itemsCount}
        deliveryAddress={placedOrderInfo?.deliveryAddress}
      />
    </div>
  );
}
