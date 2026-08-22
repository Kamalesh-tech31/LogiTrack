"use client";

import { useEffect } from "react";

export function ChunkErrorRecovery() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const isChunkLoadError =
        reason &&
        (reason.name === "ChunkLoadError" ||
          /Loading chunk .* failed/i.test(reason.message || "") ||
          /Failed to fetch dynamically imported module/i.test(
            reason.message || "",
          ));

      if (isChunkLoadError) {
        console.warn(
          "[LogiTrack] Outdated client chunk detected, refreshing page...",
          reason,
        );
        const lastReload = sessionStorage.getItem("chunk_reload_time");
        const now = Date.now();
        // Prevent continuous loop: allow at most 1 reload per 10 seconds
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem("chunk_reload_time", String(now));
          window.location.reload();
        }
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
