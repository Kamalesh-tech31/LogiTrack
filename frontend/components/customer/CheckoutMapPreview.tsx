"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface CheckoutMapPreviewProps {
  latitude: number;
  longitude: number;
  address?: string;
  orderId?: string;
  zoom?: number;
  zoomControl?: boolean;
  interactive?: boolean;
}

const DynamicCheckoutMap = dynamic(
  () => import("./CheckoutMapPreviewInner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#111214] text-[#A1A1AA]">
        <div className="flex flex-col items-center gap-2 text-xs font-mono">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          <span>Rendering destination map...</span>
        </div>
      </div>
    ),
  },
);

export function CheckoutMapPreview(props: CheckoutMapPreviewProps) {
  return <DynamicCheckoutMap {...props} />;
}

export default CheckoutMapPreview;
