"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ShoppingBag,
  MapPin,
  Truck,
  ShieldCheck,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DeliveryAddressSection,
  DeliveryAddressData,
} from "@/components/customer/delivery-address-section";
import { OrderCompletionPill } from "@/components/customer/order-completion-pill";
import { OrderSuccessModal } from "@/components/customer/order-success-modal";
import { loadCart, removeFromCart, clearCart, CartItem } from "@/lib/cart";
import { saveAddressItem } from "@/lib/addressStorage";
import { API_BASE_URL } from "@/lib/api";

export default function CartCheckoutPage() {
  const router = useRouter();

  const [itemsToCheckout, setItemsToCheckout] = useState<CartItem[]>([]);
  const [isSingleItemMode, setIsSingleItemMode] = useState(false);
  const [singleItemId, setSingleItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Address state
  const [addressData, setAddressData] = useState<DeliveryAddressData>({
    doorNo: "",
    street: "",
    area: "",
    city: "",
    state: "",
    postalCode: "",
    fullAddress: "",
    latitude: 13.0827,
    longitude: 80.2707,
  });

  const [saveAddressOnOrder, setSaveAddressOnOrder] = useState(true);
  const [selectedLabelType, setSelectedLabelType] = useState<
    "Home" | "Work" | "Friend" | "Custom"
  >("Home");
  const [customLabelName, setCustomLabelName] = useState("");

  // Post-order modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [placedOrderInfo, setPlacedOrderInfo] = useState<{
    orderId: string;
    totalAmount: number;
    itemsCount: number;
    deliveryAddress: string;
  } | null>(null);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const itemId = params.get("itemId");

    const cart = loadCart();

    if (itemId) {
      const item = cart.find((entry) => entry.id === itemId);
      if (item) {
        setItemsToCheckout([item]);
        setIsSingleItemMode(true);
        setSingleItemId(itemId);
      } else {
        setItemsToCheckout(cart);
      }
    } else {
      setItemsToCheckout(cart);
    }
    setLoading(false);
  }, []);

  const totalAmount = useMemo(() => {
    return itemsToCheckout.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
  }, [itemsToCheckout]);

  const totalItemsCount = useMemo(() => {
    return itemsToCheckout.reduce((sum, item) => sum + item.quantity, 0);
  }, [itemsToCheckout]);

  const handlePlaceOrder = async (): Promise<boolean | void> => {
    if (itemsToCheckout.length === 0) {
      toast.error("Your cart has no items to checkout.");
      return false;
    }

    if (
      !addressData.street?.trim() ||
      !addressData.city?.trim() ||
      !addressData.state?.trim() ||
      !addressData.postalCode?.trim()
    ) {
      toast.error(
        "Please fill in all required address fields (Street, City, State, PIN).",
      );
      return false;
    }

    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (!userId || !token) {
      toast.error("Please log in to complete your order.");
      router.push("/login");
      return false;
    }

    setPlacingOrder(true);

    try {
      // 1. Prepare delivery address payload
      const fullAddressCompiled =
        addressData.fullAddress?.trim() ||
        [
          addressData.doorNo,
          addressData.street,
          addressData.area,
          addressData.city,
          addressData.state,
          addressData.postalCode,
        ]
          .filter(Boolean)
          .join(", ");

      const payload = {
        userId,
        items: itemsToCheckout.map((it) => ({
          productId: it.id,
          quantity: it.quantity,
          price: it.price,
        })),
        deliveryAddress: {
          doorNo: addressData.doorNo?.trim() || "",
          street: addressData.street?.trim() || "",
          area: addressData.area?.trim() || "",
          city: addressData.city?.trim() || "",
          state: addressData.state?.trim() || "",
          postalCode: addressData.postalCode?.trim() || "",
          country: "India",
          fullAddress: fullAddressCompiled,
          fullName: addressData.recipientName || undefined,
          phone: addressData.recipientPhone || undefined,
          latitude: Number(addressData.latitude) || 13.0827,
          longitude: Number(addressData.longitude) || 80.2707,
        },
      };

      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create order.");
      }

      const createdOrder = await response.json();
      const orderData = createdOrder.data || createdOrder;

      // 2. Save address to addressStorage if requested
      if (saveAddressOnOrder) {
        let label = selectedLabelType as string;
        if (
          (selectedLabelType === "Friend" || selectedLabelType === "Custom") &&
          customLabelName.trim()
        ) {
          label = customLabelName.trim();
        }

        saveAddressItem(
          {
            id: addressData.savedId,
            label,
            fullName: addressData.recipientName || "",
            phone: addressData.recipientPhone || "",
            doorNo: addressData.doorNo,
            street: addressData.street,
            area: addressData.area,
            city: addressData.city,
            state: addressData.state,
            postalCode: addressData.postalCode,
            fullAddress: fullAddressCompiled,
            latitude: Number(addressData.latitude) || 13.0827,
            longitude: Number(addressData.longitude) || 80.2707,
            country: "India",
          },
          userId,
        );
      }

      // 3. Clear checkout items from cart
      if (isSingleItemMode && singleItemId) {
        removeFromCart(singleItemId);
      } else {
        clearCart();
      }

      setPlacedOrderInfo({
        orderId: orderData.orderId || `#ORD-${orderData._id?.slice(-4)}`,
        totalAmount: orderData.totalPrice || totalAmount,
        itemsCount: totalItemsCount,
        deliveryAddress: fullAddressCompiled,
      });

      return true;
    } catch (err: any) {
      console.error("Checkout order creation error:", err);
      toast.error(err?.message || "Checkout failed. Please try again.");
      return false;
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-10 text-center text-[#A1A1AA]">
          <p className="text-xs">Loading checkout session...</p>
        </div>
      </div>
    );
  }

  if (itemsToCheckout.length === 0 && !showSuccessModal) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm rounded-3xl">
          <CardContent className="p-10 text-center space-y-3">
            <ShoppingBag className="mx-auto h-12 w-12 text-[#A1A1AA]/40 mb-2" />
            <p className="text-xl font-bold text-white font-display">
              No items selected for checkout
            </p>
            <p className="text-xs text-[#A1A1AA]">
              Your cart is empty or items have already been processed.
            </p>
            <div className="pt-4 flex justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#2A2B30] bg-[#111214] hover:bg-[#1A1B1E] text-xs font-semibold text-white rounded-xl cursor-pointer"
                onClick={() => router.push("/customer/cart")}
              >
                View Cart
              </Button>
              <Button
                type="button"
                className="bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold rounded-xl shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer"
                onClick={() => router.push("/customer/products")}
              >
                Browse Marketplace
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F97316] transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Cart</span>
          </button>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">
            Order Checkout
          </h1>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Review your order details and specify your precise delivery
            destination.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Left Column: Delivery Address Section */}
        <div className="space-y-6">
          <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#2A2B30] pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316]">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold text-white font-display">
                      Destination & Recipient
                    </CardTitle>
                    <p className="text-xs text-[#A1A1AA]">
                      Structured delivery address & courier routing
                    </p>
                  </div>
                </div>

                {addressData.savedId && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-[#FDBA74] bg-[#F97316]/10 border border-[#F97316]/25 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Preset Loaded</span>
                  </span>
                )}
              </div>
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
                userId={typeof window !== "undefined" ? localStorage.getItem("userId") : null}
              />
            </CardContent>
          </Card>

          {/* Delivery Transparency Note */}
          <div className="flex items-center gap-3 rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 text-xs text-[#A1A1AA]">
            <Truck className="h-5 w-5 text-[#F97316] shrink-0" />
            <span>
              Your full structured address is transmitted directly to your
              assigned delivery courier with automatic high-precision GPS
              mapping.
            </span>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-6">
          <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#2A2B30] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white font-display">
                  Order Summary
                </CardTitle>
                <span className="text-xs text-[#A1A1AA]">
                  {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {itemsToCheckout.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#2A2B30] bg-[#111214] p-3"
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
                      <p className="truncate text-sm font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-[#A1A1AA] mt-0.5">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white font-mono">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#2A2B30] pt-4 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#A1A1AA]">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#A1A1AA]">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-400 font-semibold">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-2.5 border-t border-[#2A2B30]">
                  <span>Total Amount</span>
                  <span className="text-base font-bold text-[#F97316] font-display">
                    ₹{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Order Completion Animation Pill */}
              <div className="pt-4 pb-2 flex flex-col items-center justify-center">
                <OrderCompletionPill
                  onClick={handlePlaceOrder}
                  disabled={placingOrder || itemsToCheckout.length === 0}
                  onAnimationFinished={() => {
                    setShowSuccessModal(true);
                  }}
                />
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#A1A1AA] pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span>Encrypted & Verified Order Processing</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Confirmation Modal */}
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
