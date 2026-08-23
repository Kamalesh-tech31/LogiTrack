"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { BulkTwoStageRouteProps } from "./BulkTwoStageDeliveryMapInner";

const DynamicBulkMap = dynamic(
  () => import("./BulkTwoStageDeliveryMapInner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-72 w-full items-center justify-center rounded-2xl border border-[#2A2B30] bg-[#111214] text-[#A1A1AA]">
        <div className="flex flex-col items-center gap-2 text-xs font-mono">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          <span>Rendering multi-stop bulk route map...</span>
        </div>
      </div>
    ),
  },
);

export function BulkTwoStageDeliveryMap(props: BulkTwoStageRouteProps) {
  return <DynamicBulkMap {...props} />;
}

export default BulkTwoStageDeliveryMap;
