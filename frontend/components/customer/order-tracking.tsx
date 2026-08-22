"use client";

import { useEffect, useState } from "react";
import { Copy, Warehouse, Truck, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trackingSteps } from "@/lib/mock-data";
import { fetchOrders, fetchTrackingByOrderId } from "@/lib/api";
import { cn } from "@/lib/utils";

const stepIcons = {
  "Chennai Warehouse": Warehouse,
  "Out For Delivery": Truck,
  "Expected Delivery": MapPin,
};

const statusColors = {
  completed: "bg-emerald-500",
  "in-progress": "bg-[#F97316]",
  pending: "bg-[#2A2B30]",
};

export function OrderTracking() {
  const [trackingData, setTrackingData] = useState(trackingSteps);
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        const orders = await fetchOrders();
        if (Array.isArray(orders) && orders.length > 0) {
          const activeOrder =
            orders.find((o: any) => o.status !== "delivered") || orders[0];
          const id = activeOrder.id || activeOrder._id || activeOrder.orderId;
          setActiveOrderId(id);

          const tracking = await fetchTrackingByOrderId(id);
          if (tracking && tracking.steps) {
            setTrackingData(tracking.steps);
          }
        }
      } catch (error) {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, []);

  const copyOrderId = () => {
    if (activeOrderId) {
      navigator.clipboard.writeText(activeOrderId);
    }
  };

  return (
    <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <p className="text-sm text-muted-foreground">Live Tracking</p>
          <h2 className="text-lg font-semibold text-foreground">
            Order #{activeOrderId}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-primary"
          onClick={copyOrderId}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-6">
          {trackingData.map((step, index) => {
            const Icon =
              stepIcons[step.title as keyof typeof stepIcons] || MapPin;
            const isLast = index === trackingData.length - 1;
            const statusKey = step.status as keyof typeof statusColors;

            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full",
                      statusColors[statusKey] || "bg-muted",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        step.status === "pending"
                          ? "text-muted-foreground"
                          : "text-white",
                      )}
                    />
                  </div>
                  {!isLast && (
                    <div
                      className={cn(
                        "mt-2 h-12 w-0.5",
                        step.status === "completed"
                          ? "bg-emerald-500"
                          : "bg-muted",
                      )}
                    />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <h3 className="font-medium text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                  {step.timestamp && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {step.timestamp}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
