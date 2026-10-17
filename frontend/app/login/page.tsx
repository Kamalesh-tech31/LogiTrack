"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import { BriefcaseBusiness, Truck, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PasswordInput } from "@/components/common/PasswordInput";
import { FloatingAuthCards } from "@/components/landing/FloatingAuthCards";
import { TruckLoader } from "@/components/ui/TruckLoader";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("Business Owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const roles = [
    {
      name: "Business Owner",
      icon: BriefcaseBusiness,
      desc: "Fleet, orders & inventory",
    },
    {
      name: "Delivery Agent",
      icon: Truck,
      desc: "Routes, tracking & OTP",
    },
    {
      name: "Customer",
      icon: User,
      desc: "Orders, live map & history",
    },
  ];

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.user.fullName);
        localStorage.setItem("userId", data.user._id);
        localStorage.setItem("userRole", data.user.role);
        localStorage.setItem("userEmail", data.user.email);

        if (selectedRole === "Business Owner") {
          router.push("/owner");
        } else if (selectedRole === "Customer") {
          router.push("/customer");
        } else {
          router.push("/delivery/dashboard");
        }
      } else {
        if (data.status === "pending" && selectedRole !== "Customer" && data.user?.role !== "Customer") {
          localStorage.setItem("token", data.token);
          if (data.user) {
            localStorage.setItem("userName", data.user.fullName);
            localStorage.setItem("userId", data.user._id);
          }
          router.push("/awaiting_approval");
          return;
        }

        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      console.log(error);
      alert("Server Error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111214] text-[#F4F4F5] flex items-center justify-center px-4 py-12 relative overflow-hidden selection:bg-[#F97316]/30">
      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#F97316]/12 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[350px] h-[200px] bg-[#FDBA74]/8 rounded-full blur-[120px]" />

      {/* Background Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(#2A2B30_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Ambient Floating Product Snippet Preview Cards */}
      <FloatingAuthCards variant="login" />

      {/* Elevated Card Container */}
      <div className="w-full max-w-md bg-[#1A1B1E]/95 backdrop-blur-2xl border border-[#2A2B30] rounded-3xl p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.6)] relative z-10 transition-all duration-300 hover:border-[#F97316]/30">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316] shadow-sm group-hover:border-[#F97316]/60 transition-all">
              <Truck size={18} />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white font-display">
              Logi<span className="text-[#F97316]">Track</span>
            </span>
          </Link>

          <p className="text-[#A1A1AA] text-sm">
            Sign in to access your logistics command portal
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); void handleLogin(); }}>
          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2.5">
              Select Portal Role
            </label>

            <div className="space-y-2" role="radiogroup" aria-label="Portal Role">
              {roles.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.name;
                return (
                  <button
                    type="button"
                    key={role.name}
                    role="radio"
                    aria-checked={active}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedRole(role.name);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer text-left select-none
                      ${
                        active
                          ? "border-[#F97316] bg-[#111214] shadow-[0_0_18px_rgba(249,115,22,0.2)] ring-1 ring-[#F97316]"
                          : "border-[#2A2B30] bg-[#111214]/60 hover:border-[#F97316]/50 hover:bg-[#111214]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl transition-colors ${
                          active ? "bg-[#F97316]/20 text-[#F97316]" : "bg-[#2A2B30] text-[#A1A1AA]"
                        }`}
                      >
                        <Icon size={18} />
                      </div>

                      <div>
                        <p className="font-semibold text-sm text-white">{role.name}</p>
                        <p className="text-[11px] text-[#A1A1AA]">{role.desc}</p>
                      </div>
                    </div>

                    {active ? (
                      <div className="flex items-center justify-center h-4 w-4 rounded-full bg-[#F97316]/20 border border-[#F97316]">
                        <div className="w-2 h-2 rounded-full bg-[#F97316] shadow-[0_0_8px_#F97316]" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 rounded-full border border-[#2A2B30]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] mb-2">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@logitrack.com"
              className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 outline-none text-[#F4F4F5] placeholder:text-[#A1A1AA]/60 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all text-sm"
              required
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#F97316] hover:text-[#EA580C] transition-colors"
              >
                Forgot?
              </Link>
            </div>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#111214] border border-[#2A2B30] rounded-2xl px-4 py-3.5 outline-none text-[#F4F4F5] placeholder:text-[#A1A1AA]/60 focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all text-sm"
              required
            />
          </div>

          {/* Login Button with TruckLoader */}
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-14 bg-[#F97316] hover:bg-[#EA580C] transition-all duration-200 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-white font-bold text-base cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-[0.98] disabled:opacity-90 disabled:cursor-not-allowed mt-2"
          >
            {isLoggingIn ? (
              <TruckLoader label="Signing In..." />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Footer */}
          <div className="pt-4 border-t border-[#2A2B30] text-center">
            <p className="text-[#A1A1AA] text-xs">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-[#F97316] hover:text-[#EA580C] font-semibold transition-colors"
              >
                Create Account
              </Link>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
