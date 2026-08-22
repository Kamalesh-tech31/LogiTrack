"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, CreditCard } from "lucide-react";
import {
  clearCart,
  loadCart,
  removeFromCart,
  updateCartQuantity,
} from "@/lib/cart";

export default function CustomerCartPage() {
  const [cart, setCart] = useState(() => loadCart());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    setQuantities(
      cart.reduce(
        (acc, item) => {
          acc[item.id] = item.quantity;
          return acc;
        },
        {} as Record<string, number>,
      ),
    );
  }, [cart]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const handleQuantityChange = (id: string, nextValue: number) => {
    const clamped = Math.max(1, nextValue);
    const updated = updateCartQuantity(id, clamped);
    setCart(updated);
  };

  const handleRemove = (id: string) => {
    const updated = removeFromCart(id);
    setCart(updated);
  };

  const handleClearCart = () => {
    clearCart();
    setCart([]);
  };

  const canCheckout = cart.length > 0;
  const router = useRouter();

  const handleCheckout = (itemId: string) => {
    const selectedItem = cart.find((item) => item.id === itemId);
    if (!selectedItem) return;
    router.push(`/customer/cart/checkout?itemId=${encodeURIComponent(itemId)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Cart</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review your selected items before placing an order.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Cart Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2A2B30] bg-[#1A1B1E] p-10 text-center text-muted-foreground">
                  <p className="text-lg font-medium text-white">
                    Your cart is empty.
                  </p>
                  <p className="mt-2 text-sm text-[#A1A1AA]">
                    Browse products and add items to your cart.
                  </p>
                  <Link
                    href="/customer/products"
                    className="mt-4 inline-flex rounded-full bg-[#F97316] px-5 py-2 text-sm font-semibold text-white hover:bg-[#EA580C] transition shadow-[0_0_12px_rgba(249,115,22,0.3)]"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-5 shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-[#A1A1AA]">
                            {item.category}
                          </p>
                          <p className="text-lg font-semibold text-white">
                            {item.name}
                          </p>
                          <p className="mt-1 text-sm text-[#A1A1AA]">
                            ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={1}
                              value={quantities[item.id] ?? item.quantity}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                if (value > 0) {
                                  setQuantities((prev) => ({
                                    ...prev,
                                    [item.id]: value,
                                  }));
                                  handleQuantityChange(item.id, value);
                                }
                              }}
                              className="w-20 bg-[#111214] border border-[#2A2B30] text-white"
                            />
                            <span className="text-sm text-muted-foreground">
                              Qty
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Total: ₹
                            {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="w-full sm:w-[190px] gap-2"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full sm:w-[190px] gap-2"
                          onClick={() => handleCheckout(item.id)}
                        >
                          <CreditCard className="h-4 w-4" />
                          Checkout Item
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Delivery fee</span>
                  <span>₹0</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Estimated total</span>
                  <span className="font-semibold">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                disabled={!canCheckout}
                className="w-full"
                onClick={() => window.location.assign("/customer/products")}
              >
                {canCheckout ? "Continue to Checkout" : "Add items to cart"}
              </Button>

              {cart.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
