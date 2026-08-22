"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const router = useRouter();

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

  const handleCheckoutSingle = (itemId: string) => {
    const selectedItem = cart.find((item) => item.id === itemId);
    if (!selectedItem) return;
    router.push(`/customer/cart/checkout?itemId=${encodeURIComponent(itemId)}`);
  };

  const handleCheckoutAll = () => {
    if (canCheckout) {
      router.push("/customer/cart/checkout");
    } else {
      router.push("/customer/products");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
          Order Summary
        </p>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          My Shopping Cart
        </h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Review and manage your selected items before proceeding to secure
          checkout.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Cart Items List */}
        <div className="space-y-4">
          <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#2A2B30] pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-white font-display">
                  Cart Items
                </CardTitle>
                <span className="text-xs text-[#A1A1AA]">
                  {cart.length} {cart.length === 1 ? "Item" : "Items"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {cart.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#2A2B30] bg-[#111214] p-10 text-center space-y-3">
                  <ShoppingBag className="mx-auto h-12 w-12 text-[#A1A1AA]/40 mb-2" />
                  <p className="text-base font-bold text-white">
                    Your cart is empty
                  </p>
                  <p className="text-xs text-[#A1A1AA] max-w-xs mx-auto leading-relaxed">
                    Explore available products in the marketplace and add items
                    to start your order.
                  </p>
                  <Link
                    href="/customer/products"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#F97316] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#EA580C] transition shadow-[0_0_14px_rgba(249,115,22,0.3)] cursor-pointer mt-2"
                  >
                    <span>Browse Marketplace</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4.5 transition-all hover:border-[#F97316]/40"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-[#FDBA74] uppercase tracking-wider">
                            {item.category}
                          </span>
                          <p className="text-base font-bold text-white mt-0.5 font-display">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-[#A1A1AA] font-medium">
                            ₹{item.price.toLocaleString()} each
                          </p>
                        </div>
                        <div className="flex flex-col gap-2.5 sm:items-end">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[#A1A1AA] font-medium">
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
                              className="w-18 h-8 bg-[#1A1B1E] border border-[#2A2B30] text-white rounded-xl text-center text-xs font-mono"
                            />
                          </div>
                          <p className="text-xs text-white font-bold font-mono">
                            Total: ₹
                            {(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#2A2B30] flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs text-[#A1A1AA] hover:text-red-400 hover:bg-red-500/10 rounded-xl gap-1.5 cursor-pointer"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 px-4 text-xs font-semibold bg-[#1A1B1E] hover:bg-[#2A2B30] text-white border border-[#2A2B30] rounded-xl gap-1.5 cursor-pointer"
                          onClick={() => handleCheckoutSingle(item.id)}
                        >
                          <CreditCard className="h-3.5 w-3.5 text-[#F97316]" />
                          <span>Checkout Single Item</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Column */}
        <div className="space-y-4">
          <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-[#2A2B30] pb-4">
              <CardTitle className="text-lg font-bold text-white font-display">
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2.5 text-xs text-[#A1A1AA]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="text-white font-semibold">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delivery fee</span>
                  <span className="text-emerald-400 font-semibold">Free</span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-white pt-2.5 border-t border-[#2A2B30]">
                  <span>Estimated Total</span>
                  <span className="text-base font-bold text-[#F97316] font-display">
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                disabled={!canCheckout}
                className="w-full h-11 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs rounded-2xl shadow-[0_0_14px_rgba(249,115,22,0.3)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                onClick={handleCheckoutAll}
              >
                <span>
                  {canCheckout ? "Continue to Checkout" : "Add Items to Cart"}
                </span>
                <ArrowRight size={14} />
              </Button>

              {cart.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9 border-[#2A2B30] bg-[#111214] hover:bg-[#1A1B1E] text-xs text-[#A1A1AA] hover:text-white rounded-xl transition cursor-pointer"
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
