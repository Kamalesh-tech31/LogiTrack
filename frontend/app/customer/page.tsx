'use client';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchOrders, fetchProducts } from "@/lib/api";

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, productsData] = await Promise.all([
          fetchOrders(),
          fetchProducts(),
        ]);

        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (error) {
        setOrders([]);
        setProducts([]);
      } finally {
        setLoadingOrders(false);
        setLoadingProducts(false);
      }
    };

    fetchData();
  }, []);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeProducts = Array.isArray(products) ? products : [];

  const stats = useMemo(() => {
    const totalOrders = safeOrders.length;
    const deliveredOrders = safeOrders.filter(
      (order) => (order.status ?? "").toLowerCase() === "delivered",
    ).length;
    const pendingOrders = safeOrders.filter(
      (order) => (order.status ?? "").toLowerCase() !== "delivered",
    ).length;

    return [
      {
        label: "My Orders",
        value: totalOrders,
        icon: ShoppingCart,
        description: "Orders placed by you",
      },
      {
        label: "Pending Orders",
        value: pendingOrders,
        icon: Clock,
        description: "Orders still in progress",
      },
      {
        label: "Delivered Orders",
        value: deliveredOrders,
        icon: CheckCircle2,
        description: "Orders successfully delivered",
      },
    ];
  }, [safeOrders]);

  const featuredProducts = useMemo(() => {
    return [...safeProducts]
      .sort((a, b) => {
        const aDate = new Date(a.createdAt || a.updatedAt || a.date || 0).getTime();
        const bDate = new Date(b.createdAt || b.updatedAt || b.date || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 4);
  }, [safeProducts]);

  const recentOrders = useMemo(() => {
    return [...safeOrders]
      .sort((a, b) => {
        const aDate = new Date(a.date || a.createdAt || a.updatedAt || 0).getTime();
        const bDate = new Date(b.date || b.createdAt || b.updatedAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 5);
  }, [safeOrders]);

  return (
    <div className="p-8 space-y-8">
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon || (() => null);
            return (
              <Card
                key={stat.label}
                className="border border-[#27272A] bg-[#1A1A1A] shadow-sm"
              >
                <CardContent className="flex items-center justify-between gap-4 p-5 rounded-3xl">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-white">
                      {loadingOrders ? "..." : stat.value}
                    </p>
                    <p className="mt-1 text-sm text-[#A1A1AA]">
                      {stat.description}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#27272A] text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Featured Products
            </h2>
            <p className="text-sm text-muted-foreground">
              Newest products available for order.
            </p>
          </div>
          <Link
            href="/customer/products"
            className="text-sm font-medium text-[#F87171] hover:underline"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featuredProducts.map((product) => (
            <Card
              key={product.id || product._id || product.name}
              className="group overflow-hidden border border-[#27272A] bg-[#111111] shadow-sm"
            >
              <CardContent className="p-0 rounded-3xl">
                <div className="relative aspect-square overflow-hidden bg-[#0B0B0B]">
                  <Image
                    src={
                      product.image ||
                      (Array.isArray(product.images) && product.images[0]) ||
                      "/placeholder.png"
                    }
                    alt={product.name || "Product image"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-[#A1A1AA]">
                    {product.category || "General"}
                  </p>
                  <h3 className="mt-1 font-semibold text-white">
                    {product.name || "Untitled product"}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-lg font-bold text-white">
                      ₹{Number(product.price ?? 0).toLocaleString()}
                    </span>
                    <span className="rounded-full bg-[#27272A] px-3 py-1 text-xs text-white">
                      New
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {featuredProducts.length === 0 && !loadingProducts && (
            <div className="col-span-full rounded-3xl border border-[#27272A] bg-[#111111] p-8 text-center text-muted-foreground">
              No products are available right now.
            </div>
          )}
        </div>

        <Card className="border border-[#27272A] bg-[#111111] shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between pb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Recent Orders
                </h2>
                <p className="text-sm text-muted-foreground">
                  Latest 5 orders from your account.
                </p>
              </div>
              <Link
                href="/customer/orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left text-sm text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Order ID</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, index) => {
                    const orderId = order.orderId || order._id;
                    const amountValue = typeof order.amount === "number"
                      ? order.amount
                      : typeof order.totalPrice === "number"
                        ? order.totalPrice
                        : undefined;
                    const statusText = order.status
                      ? `${String(order.status).charAt(0).toUpperCase()}${String(order.status).slice(1)}`
                      : "Unknown";

                    return (
                      <tr key={orderId || String(index)} className="border-b border-border last:border-0">
                        <td className="px-6 py-4 font-medium text-foreground">
                          {orderId || "-"}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {statusText}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {amountValue != null ? `₹${amountValue.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {recentOrders.length === 0 && !loadingOrders && (
                <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-6 text-center text-muted-foreground">
                  No orders found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
