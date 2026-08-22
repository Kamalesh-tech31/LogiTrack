"use client";

import { useEffect, useState } from "react";
import { Lock, ArrowRight, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminNavbar from "@/components/admin/AdminNavbar";

const ADMIN_PASS = "aswinabi1";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_auth");
    if (auth === ADMIN_PASS) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    setTimeout(() => {
      if (password === ADMIN_PASS) {
        sessionStorage.setItem("admin_auth", ADMIN_PASS);
        setIsAuthenticated(true);
      } else {
        setError("Invalid admin password. Access denied.");
      }
      setIsSubmitting(false);
    }, 200);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    setPassword("");
    setError(null);
  };

  // Initial client-side loading state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Password Gate Form
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#111111]/90 backdrop-blur-xl border border-[#7F1D1D]/30 rounded-3xl p-8 shadow-[0_0_50px_rgba(127,29,29,0.2)]">
          {/* Brand Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#7F1D1D]/20 border border-[#7F1D1D]/50 text-[#EF4444] mb-4">
              <KeyRound size={30} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Logi<span className="text-[#7F1D1D]">Track</span>
            </h1>
            <p className="text-neutral-400 text-sm mt-2">
              Administrator Control Center
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={18}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter admin password"
                  autoFocus
                  required
                  className="w-full bg-[#16131A] border border-neutral-800 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder:text-neutral-600 outline-none focus:border-[#7F1D1D] focus:ring-1 focus:ring-[#7F1D1D] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-red-950/50 border border-red-800/60 text-red-300 text-sm">
                <ShieldAlert size={18} className="shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !password}
              className="w-full bg-[#7F1D1D] hover:bg-[#991B1B] text-white font-semibold py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(127,29,29,0.3)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Unlock Admin Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-neutral-500 mt-8">
            Restricted area. Authorized personnel only.
          </p>
        </div>
      </main>
    );
  }

  // Authenticated Admin Shell
  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex">
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
