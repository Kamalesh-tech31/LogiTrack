"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchOrders } from "@/lib/api";
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Ban } from "lucide-react";
import { CancelOrderModal } from "@/components/customer/cancel-order-modal";

type CustomerOrder = {
  id: string;
  rawId: string;
  customer: string;
  product: string;
  status: string;
  amount: number;
  date: string;
  items?: Array<{ product: string; quantity: number; price: number }>;
};

const statusConfig = {
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    icon: CheckCircle,
  },
  shipped: {
    label: "Shipped",
    color: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    icon: Truck,
  },
  pending: {
    label: "Pending",
    color: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    icon: Package,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500/10 text-red-400 border border-red-500/20",
    icon: XCircle,
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const router = useRouter();

  const normalizeOrder = (order: any, index: number): CustomerOrder => {
    const productName =
      order.items?.[0]?.product?.name ||
      order.items?.[0]?.product ||
      "N/A";
    const rawStatus = String(order.status || "pending").toLowerCase();
    const normalizedStatus =
      rawStatus === "completed" ? "delivered" : rawStatus;
    const internalId = String(order._id || order.id || "");
    const displayId = String(order.orderId || order.id || order._id || `order-${index}`);

    return {
      id: displayId,
      rawId: internalId || displayId,
      customer: order.customerName || order.customer || "Unknown customer",
      product: productName,
      status: normalizedStatus,
      amount:
        typeof order.amount === "number"
          ? order.amount
          : typeof order.totalPrice === "number"
            ? order.totalPrice
            : 0,
      date:
        order.date ||
        order.createdAt ||
        order.updatedAt ||
        new Date().toISOString(),
      items: order.items,
    };
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const ordersData = await fetchOrders(searchQuery || undefined);
      const normalizedOrders = Array.isArray(ordersData)
        ? ordersData.map(normalizeOrder)
        : [];
      setOrders(normalizedOrders);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Failed to load orders",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      void loadOrders();
    }, 200);

    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleOrderCancelled = (cancelledId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === cancelledId || o.rawId === cancelledId
          ? { ...o, status: "cancelled" }
          : o,
      ),
    );
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    return (
      String(order.id).toLowerCase().includes(query) ||
      String(order.customer).toLowerCase().includes(query) ||
      String(order.product).toLowerCase().includes(query)
    );
  });

  const orderStats = {
    total: orders.length,
    delivered: orders.filter(
      (o) => String(o.status).toLowerCase() === "delivered",
    ).length,
    shipped: orders.filter((o) => String(o.status).toLowerCase() === "shipped")
      .length,
    pending: orders.filter((o) => String(o.status).toLowerCase() === "pending")
      .length,
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-neutral-400">
          View, track, and manage all your orders in real time.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-neutral-800 text-neutral-300">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orderStats.total}</p>
                <p className="text-xs text-neutral-400">Total Orders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orderStats.delivered}</p>
                <p className="text-xs text-neutral-400">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-950/40 text-blue-400 border border-blue-800/40">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orderStats.shipped}</p>
                <p className="text-xs text-neutral-400">Shipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-2xl">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-950/40 text-amber-400 border border-amber-800/40">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{orderStats.pending}</p>
                <p className="text-xs text-neutral-400">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-neutral-800 bg-[#111111] shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-neutral-800/80 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg text-white">All Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                placeholder="Search orders by ID or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:w-72 bg-[#161616] border-neutral-800 text-white rounded-xl h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-neutral-400">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-base font-semibold text-white">
                Unable to load orders
              </p>
              <p className="mt-1 text-xs text-red-400">{error}</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="bg-[#161616]">
                  <TableRow className="border-neutral-800 hover:bg-transparent">
                    <TableHead className="text-neutral-400">Order ID</TableHead>
                    <TableHead className="text-neutral-400">Customer</TableHead>
                    <TableHead className="text-neutral-400">Product</TableHead>
                    <TableHead className="text-neutral-400">Date</TableHead>
                    <TableHead className="text-neutral-400">Status</TableHead>
                    <TableHead className="text-right text-neutral-400">Amount</TableHead>
                    <TableHead className="text-right text-neutral-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order, index) => {
                    const status =
                      statusConfig[order.status as keyof typeof statusConfig] || {
                        label:
                          order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1) || "Unknown",
                        color: "bg-neutral-800 text-neutral-300",
                        icon: Package,
                      };
                    const StatusIcon = status.icon;
                    const canCancel =
                      order.status === "pending" || order.status === "processing";

                    return (
                      <TableRow
                        key={order.id || `order-${index}`}
                        className="border-neutral-800/60 hover:bg-white/5 transition-colors"
                      >
                        <TableCell className="font-mono text-xs font-semibold text-white">
                          {order.id}
                        </TableCell>
                        <TableCell className="text-neutral-300">{order.customer}</TableCell>
                        <TableCell className="text-white font-medium">
                          {order.product || "N/A"}
                        </TableCell>
                        <TableCell className="text-neutral-400 text-xs">
                          {new Date(order.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}
                          >
                            <StatusIcon className="h-3 w-3 shrink-0" />
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-white">
                          ₹{order.amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canCancel && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-red-400 hover:text-red-300 border-red-950 bg-red-950/20 hover:bg-red-950/40 rounded-lg gap-1 cursor-pointer"
                                onClick={() => setCancellingOrderId(order.rawId || order.id)}
                              >
                                <Ban className="h-3 w-3" />
                                Cancel
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-lg gap-1.5 cursor-pointer"
                              onClick={() =>
                                router.push(
                                  `/customer/tracking?orderId=${order.id}`,
                                )
                              }
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Track
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredOrders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                  <Package className="h-10 w-10 text-neutral-600 mb-2" />
                  <p className="text-base font-medium text-white">
                    No orders found
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Try adjusting your search criteria
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Cancel Order Modal with matching LogiTrack cancellation pill */}
      <CancelOrderModal
        isOpen={Boolean(cancellingOrderId)}
        onClose={() => setCancellingOrderId(null)}
        orderId={cancellingOrderId || ""}
        onOrderCancelled={handleOrderCancelled}
      />
    </div>
  );
}
