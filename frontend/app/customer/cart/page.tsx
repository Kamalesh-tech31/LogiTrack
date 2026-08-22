"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, CreditCard, ShoppingBag, ArrowRight } from "lucide-react";
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
    const item = cart.find((i) => i.id === id);
    const updated = removeFromCart(id);
    setCart(updated);
    toast.success(
      item ? `Removed "${item.name}" from cart` : "Item removed from cart",
    );
  };

  const handleClearCart = () => {
    clearCart();
    setCart([]);
    toast.success("Cart cleared");
  };

  const canCheckout = cart.length > 0;
  const router = useRouter();

  const handleCheckout = (itemId: string) => {
    const selectedItem = cart.find((item) => item.id === itemId);
    if (!selectedItem) return;
    router.push(`/customer/cart/checkout?itemId=${encodeURIComponent(itemId)}`);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">My Cart</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Review your selected items before proceeding to checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-4">
          <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-800/80 pb-4">
              <CardTitle className="text-lg text-white">Cart Items ({cart.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-neutral-800 bg-[#0E0E0E] p-12 text-center text-neutral-400">
                  <ShoppingBag className="mx-auto h-12 w-12 text-neutral-600 mb-3" />
                  <p className="text-lg font-semibold text-white">
                    Your cart is empty
                  </p>
                  <p className="mt-1.5 text-xs text-neutral-400">
                    Browse our products catalog and add items to your cart.
                  </p>
                  <Link
                    href="/customer/products"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-red-950/40 transition-all cursor-pointer"
                  >
                    Browse Products <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-neutral-800/80 bg-[#161616] p-4.5 transition-all hover:border-neutral-700"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                            {item.category}
                          </span>
                          <p className="text-base font-semibold text-white mt-0.5">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-neutral-400 font-medium">
                            ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <div className="flex flex-col gap-2.5 sm:items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-400 font-medium">
                              Qty:
                            </span>
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
                              className="w-18 h-9 bg-[#111111] border border-neutral-800 text-white rounded-lg text-center text-xs"
                            />
                          </div>
                          <p className="text-xs text-white font-semibold">
                            Total: ₹
                            {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-3 border-t border-neutral-800/60 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 px-3 text-xs text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl gap-1.5 cursor-pointer"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 px-4 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl gap-1.5 cursor-pointer"
                          onClick={() => handleCheckout(item.id)}
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          Checkout Single Item
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
          <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-neutral-800/80 pb-4">
              <CardTitle className="text-lg text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2.5 text-xs text-neutral-400">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-400 font-medium">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-2.5 border-t border-neutral-800/50">
                  <span>Estimated Total</span>
                  <span className="text-base font-bold text-red-500">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                disabled={!canCheckout}
                className="w-full h-12 bg-[#7F1D1D] hover:bg-[#991B1B] text-white text-xs font-semibold rounded-2xl shadow-lg shadow-red-950/40 transition-all cursor-pointer"
                onClick={() => {
                  if (canCheckout) {
                    router.push("/customer/cart/checkout");
                  } else {
                    router.push("/customer/products");
                  }
                }}
              >
                {canCheckout ? "Continue to Checkout" : "Add Items to Cart"}
              </Button>

              {cart.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full h-10 border-neutral-800 bg-[#161616] hover:bg-neutral-800 text-xs text-neutral-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  onClick={handleClearCart}
                >
                  Clear All Items
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
