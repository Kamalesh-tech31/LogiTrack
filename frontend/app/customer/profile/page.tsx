"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentUser, updateCurrentPassword, updateCurrentUser } from "@/lib/api";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";
import { useLogout } from "@/lib/logout";
import { User, Lock, ArrowLeft, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { logout } = useLogout();
  const profileSectionRef = useRef<HTMLDivElement>(null);
  const securitySectionRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    gstNumber: "",
    businessAddress: "",
    role: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      try {
        const user = await fetchCurrentUser();
        if (!isMounted) return;
        setProfile({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          businessName: user.businessName || "",
          gstNumber: user.gstNumber || "",
          businessAddress: user.businessAddress || "",
          role: user.role || "Customer",
        });
      } catch {
        if (isMounted) {
          setMessage({ text: "Unable to load profile data.", type: "error" });
        }
      }
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingProfile(true);
    setMessage(null);

    try {
      const updated = await updateCurrentUser({
        fullName: profile.fullName,
        phone: profile.phone,
        businessName: profile.businessName,
        gstNumber: profile.gstNumber,
        businessAddress: profile.businessAddress,
      });
      setProfile((current) => ({
        ...current,
        ...updated,
        email: current.email,
        role: current.role,
      }));
      setMessage({ text: "Profile details updated successfully.", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to update profile.",
        type: "error",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingPassword(true);
    setMessage(null);

    try {
      await updateCurrentPassword(passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setMessage({ text: "Password changed successfully.", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to update password.",
        type: "error",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.25em] text-[#A1A1AA]">
          Account Preferences
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
          Manage your personal information, delivery contacts, and account security.
        </p>
      </div>

      {/* Account Identity Card */}
      <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 sm:p-8 shadow-sm flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316] text-xl font-bold font-display shadow-[0_0_20px_rgba(249,115,22,0.2)]">
            {profile.fullName ? profile.fullName[0].toUpperCase() : "C"}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white font-display">
                {profile.fullName || "Customer Account"}
              </h2>
              <span className="rounded-full bg-[#111214] border border-[#2A2B30] px-2.5 py-0.5 text-[10px] font-mono text-[#FDBA74]">
                {profile.role || "Customer"}
              </span>
            </div>
            <p className="text-xs text-[#A1A1AA] mt-1">
              {profile.email || "No email on record"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => profileSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-4 py-2 rounded-2xl border border-[#2A2B30] bg-[#111214] text-xs font-semibold text-white hover:border-[#F97316]/40 transition cursor-pointer"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={() => securitySectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="px-4 py-2 rounded-2xl border border-[#2A2B30] bg-[#111214] text-xs font-semibold text-white hover:border-[#F97316]/40 transition cursor-pointer"
          >
            Password & Security
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl border border-[#2A2B30] bg-[#111214] text-xs font-semibold text-[#A1A1AA] hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Status Message Banner */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-2xl border p-4 text-xs font-medium ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Forms Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal & Contact Details */}
        <div ref={profileSectionRef} className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-[#2A2B30]/60">
              <User size={16} className="text-[#F97316]" />
              <h2 className="text-base font-bold text-white font-display">Personal Details</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  placeholder="Your full name"
                  value={profile.fullName}
                  onChange={(e) => setProfile((c) => ({ ...c, fullName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Email Address</label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-[#111214]/60 border border-[#2A2B30]/60 rounded-xl text-xs text-[#A1A1AA] cursor-not-allowed opacity-80"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Phone Number</label>
                  <input
                    type="text"
                    placeholder="Contact phone"
                    value={profile.phone}
                    onChange={(e) => setProfile((c) => ({ ...c, phone: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Business / Company Name</label>
                <input
                  type="text"
                  placeholder="Optional company name"
                  value={profile.businessName}
                  onChange={(e) => setProfile((c) => ({ ...c, businessName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Default Delivery Address</label>
                <textarea
                  rows={3}
                  placeholder="Street, City, Postal Code"
                  value={profile.businessAddress}
                  onChange={(e) => setProfile((c) => ({ ...c, businessAddress: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer disabled:opacity-50"
              >
                {savingProfile ? "Saving Changes..." : "Save Details"}
              </button>
            </form>
          </div>
        </div>

        {/* Password & Account Security */}
        <div ref={securitySectionRef} className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 border-b border-[#2A2B30]/60">
              <Lock size={16} className="text-[#F97316]" />
              <h2 className="text-base font-bold text-white font-display">Password & Security</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm((c) => ({ ...c, currentPassword: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm((c) => ({ ...c, newPassword: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-[#111214] border border-[#2A2B30] rounded-xl text-xs text-white placeholder-[#A1A1AA]/50 focus:border-[#F97316]/60 focus:outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-xs font-bold text-white transition shadow-[0_0_12px_rgba(249,115,22,0.3)] cursor-pointer disabled:opacity-50"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-[#2A2B30]/60 mt-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Danger Zone</p>
              <p className="text-[11px] text-[#A1A1AA]">Permanently remove your account and order history.</p>
            </div>

            <AccountDeletionDialog
              roleLabel="Customer"
              buttonClassName="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 border border-red-900/40 rounded-xl px-3 py-1.5 transition"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => router.push("/customer/orders")}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#2A2B30] bg-[#1A1B1E] text-xs text-[#A1A1AA] hover:text-white transition cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>Back to Orders</span>
        </button>
      </div>
    </div>
  );
}