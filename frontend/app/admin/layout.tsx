"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";
import { fetchAdminMe } from "@/lib/api";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyAdmin = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          router.replace("/register");
        }
        return;
      }

      try {
        const adminData = await fetchAdminMe();
        if (!isMounted) return;

        if (adminData && adminData.role === "Admin") {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          localStorage.removeItem("user");
          localStorage.removeItem("userId");
          localStorage.removeItem("userName");
          localStorage.removeItem("userEmail");
          setIsAuthenticated(false);
          router.replace("/register");
        }
      } catch {
        if (!isMounted) return;
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        localStorage.removeItem("userName");
        localStorage.removeItem("userEmail");
        setIsAuthenticated(false);
        router.replace("/register");
      }
    };

    void verifyAdmin();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    router.replace("/");
  };

  // Show nothing from admin pages until verification passes
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#111214] text-[#F4F4F5] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A1A1AA] text-sm">Verifying administrator authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111214] text-[#F4F4F5] flex">
      {/* Shared Admin Sidebar */}
      <AdminSidebar onLogout={handleLogout} />

      {/* Main Content Area with Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar onLogout={handleLogout} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
