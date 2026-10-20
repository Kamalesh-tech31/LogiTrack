"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Ensures an active Administrator session cannot access or break
 * customer, business owner, or delivery agent interfaces,
 * redirecting them cleanly to /admin.
 */
export function AdminRoleRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const role = localStorage.getItem("role");
      if (role === "Admin") {
        router.replace("/admin");
      }
    } catch {
      // ignore
    }
  }, [router]);

  return null;
}
