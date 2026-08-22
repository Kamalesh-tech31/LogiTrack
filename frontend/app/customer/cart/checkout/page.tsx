"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loadCart, removeFromCart } from "@/lib/cart";
import { API_BASE_URL } from "@/lib/api";

export default function CartCheckoutPage() {
  const router = useRouter();
  const [itemId, setItemId] = useState<string | null>(null);
  const [cartItem, setCartItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    latitude: "",
    longitude: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    const search = typeof window !== "undefined" ? window.location.search : "";
    const params = new URLSearchParams(search);
    const id = params.get("itemId");
    setItemId(id);

    const cart = loadCart();
    const item = cart.find((entry) => entry.id === id);
    setCartItem(item || null);
    setLoading(false);
  }, []);

  const handleChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMessage("Geolocation is not supported in your browser.");
      return;
    }

    setMessage("Capturing current location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setAddress((prev) => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lon.toFixed(6),
        }));
        setMessage("Current location captured.");
      },
      (error) => {
        setMessage(`Unable to get location: ${error.message}`);
      },
    );
  };

  const handlePlaceOrder = async () => {
    if (!cartItem) return;
    if (
      !address.street ||
      !address.city ||
      !address.country ||
      !address.latitude ||
      !address.longitude
    ) {
      setMessage("Please complete the shipping address and coordinates.");
      return;
    }

    const latitude = Number(address.latitude);
    const longitude = Number(address.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setMessage("Latitude and longitude must be valid numbers.");
      return;
    }

    const userId =
      typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId) {
      setMessage("Please sign in before placing an order.");
      return;
    }

    setPlacingOrder(true);
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
        body: JSON.stringify({
          userId,
          items: [
            {
              productId: cartItem.id,
              quantity: cartItem.quantity,
            },
          ],
          deliveryAddress: {
            street: address.street,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
            latitude,
            longitude,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to place order.");
      }

      removeFromCart(cartItem.id);
      setMessage("Order placed for this item.");
      setTimeout(() => {
        router.push("/customer/orders");
      }, 900);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again.",
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  if (!cartItem) {
    return (
      <div className="p-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 text-center">
            <p className="text-lg font-semibold text-foreground">
              No item found for checkout.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please select a product from your cart.
            </p>
            <Button
              className="mt-4"
              onClick={() => router.push("/customer/cart")}
            >
              Go to Cart
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Place order for one cart item only.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-4">
              <p className="text-sm text-[#A1A1AA]">Product</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {cartItem.name}
              </p>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                ₹{cartItem.price.toLocaleString()} x {cartItem.quantity}
              </p>
              <p className="mt-2 text-sm text-[#A1A1AA]">
                Total: ₹{(cartItem.price * cartItem.quantity).toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">
                  Shipping address
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="Street"
                  value={address.street}
                  onChange={(e) => handleChange("street", e.target.value)}
                />
                <Input
                  placeholder="City"
                  value={address.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
                <Input
                  placeholder="State"
                  value={address.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
                <Input
                  placeholder="Postal Code"
                  value={address.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                />
                <Input
                  placeholder="Country"
                  value={address.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={address.latitude}
                  onChange={(e) => handleChange("latitude", e.target.value)}
                />
                <Input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={address.longitude}
                  onChange={(e) => handleChange("longitude", e.target.value)}
                />
                <Button
                  variant="outline"
                  className="col-span-full"
                  onClick={handleUseCurrentLocation}
                >
                  Use Current Location
                </Button>
              </div>
            </div>

            {message && <p className="text-sm text-emerald-300">{message}</p>}

            <Button
              className="w-full"
              onClick={handlePlaceOrder}
              disabled={placingOrder}
            >
              {placingOrder ? "Placing order..." : "Place Order for this Item"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
