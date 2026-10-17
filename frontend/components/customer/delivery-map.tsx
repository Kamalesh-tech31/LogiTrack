"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { deliveryRoute } from "@/lib/mock-data";

// ✅ Dynamic import with ssr: false - prevents Leaflet from loading on server
const MapContent = dynamic(
  () => import("./map-content").then((mod) => ({ default: mod.MapContent })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center bg-muted lg:h-80">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  },
);

export function DeliveryMap({ route }: { route?: any }) {
  const currentRoute = route || deliveryRoute;

  return (
    <Card className="border border-[#2A2B30] bg-[#1A1B1E] shadow-sm">
      <CardHeader className="pb-2">
        <h2 className="text-lg font-semibold text-foreground">
          Live Delivery Map
        </h2>
        <p className="text-sm text-muted-foreground">
          Track delivery in real-time • {currentRoute.origin.name} to{" "}
          {currentRoute.destination.name}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 w-full overflow-hidden rounded-b-lg lg:h-80">
          <MapContent route={currentRoute} />
        </div>
      </CardContent>
    </Card>
  );
}
