"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

interface MapLocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onSelectLocation: (coords: { latitude: number; longitude: number }) => void;
}

const DynamicMapPicker = dynamic(
  () => import("./MapLocationPickerInner"),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-2xl border border-[#2A2B30] bg-[#111214]">
        <div className="flex flex-col items-center gap-2 text-xs font-mono text-[#A1A1AA]">
          <Loader2 className="h-5 w-5 animate-spin text-[#F97316]" />
          <span>Loading map selector...</span>
        </div>
      </div>
    ),
  },
);

export function MapLocationPicker(props: MapLocationPickerProps) {
  return <DynamicMapPicker {...props} />;
}
