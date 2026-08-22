"use client";
import { API_BASE_URL } from "@/lib/api";
import { useState } from "react";
import { BriefcaseBusiness, Truck, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PasswordInput } from "@/components/common/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState("Business Owner");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      name: "Business Owner",
      icon: BriefcaseBusiness,
    },
    {
      name: "Delivery Agent",
      icon: Truck,
    },
    {
      name: "Customer",
      icon: User,
    },
  ];

  const handleLogin = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email.");
      return;
    }
    if (!password) {
      toast.error("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (res.ok && data?.token && data?.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.user.fullName);
        localStorage.setItem("userId", data.user._id);

        toast.success(`Welcome back, ${data.user.fullName}!`);

        if (selectedRole === "Business Owner") {
          router.push("/owner");
        } else if (selectedRole === "Customer") {
          router.push("/customer");
        } else {
          router.push("/delivery/dashboard");
        }
      } else {
        toast.error(data?.message || "Invalid email, password, or role.");
      }
    } catch (error) {
      console.error("Login fetch error:", error);
      toast.error("Unable to connect to the backend server. Please ensure the backend is running on port 5000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#111111]/80 backdrop-blur-xl border border-[#7F1D1D]/20 rounded-3xl p-8 shadow-[0_0_40px_rgba(127,29,29,0.15)]">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight">
            Logi<span className="text-[#7F1D1D]">Track</span>
          </h1>

          <p className="text-gray-400 mt-3 text-sm">
            Smart Supply Chain & Delivery Platform
          </p>
        </div>

        {/* Form */}
        <form className="space-y-6" suppressHydrationWarning>
          {/* Email */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@logitrack.com"
              suppressHydrationWarning
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-4 outline-none text-white placeholder:text-gray-500 focus:border-[#7F1D1D] focus:ring-2 focus:ring-[#7F1D1D]/30 transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm mb-2 text-gray-300">Password</label>

            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              suppressHydrationWarning
              className="w-full bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl px-4 py-4 outline-none text-white placeholder:text-gray-500 focus:border-[#7F1D1D] focus:ring-2 focus:ring-[#7F1D1D]/30 transition-all"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm mb-3 text-gray-300">Login As</label>

            <div className="space-y-3">
              {roles.map((role) => {
                const Icon = role.icon;
                const active = selectedRole === role.name;
                return (
                  <button
                    type="button"
                    key={role.name}
                    onClick={() => setSelectedRole(role.name)}
                    suppressHydrationWarning
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all duration-300
                      ${
                        active
                          ? "border-[#7F1D1D] bg-[#161616] shadow-[0_0_20px_rgba(127,29,29,0.25)]"
                          : "border-[#262626] bg-[#121212] hover:border-[#7F1D1D]/60 hover:bg-[#161616]"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          active ? "bg-[#7F1D1D]/20" : "bg-[#1E1E1E]"
                        }`}
                      >
                        <Icon size={20} />
                      </div>

                      <span className="font-medium">{role.name}</span>
                    </div>

                    {active && (
                      <div className="w-2 h-2 rounded-full bg-[#7F1D1D]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Login Button */}
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            suppressHydrationWarning
            className="w-full bg-[#7F1D1D] hover:bg-[#991B1B] transition-all duration-300 rounded-2xl py-4 flex items-center justify-center gap-2 text-white font-semibold text-lg disabled:opacity-60"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight size={18} />
          </button>

          {/* Footer */}
          <p className="text-gray-400 text-sm text-center mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#7F1D1D] hover:text-[#991B1B] transition"
            >
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
