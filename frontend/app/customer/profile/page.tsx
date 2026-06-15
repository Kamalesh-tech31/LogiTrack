"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCurrentUser, updateCurrentPassword, updateCurrentUser } from "@/lib/api";
import { AccountDeletionDialog } from "@/components/common/account-deletion-dialog";
import { useLogout } from "@/lib/logout";

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
  const [message, setMessage] = useState<string | null>(null);

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
          setMessage("Unable to load profile data.");
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
      setMessage("Profile updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update profile.");
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
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6 p-2 md:p-4">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
        <Card className="border border-[#27272A] bg-[#111111]">
          <CardContent className="flex flex-col gap-6 p-6 md:p-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Account</p>
                <h1 className="mt-2 text-3xl font-bold text-white">Profile</h1>
                <p className="mt-2 max-w-2xl text-sm text-neutral-400">
                  Manage your profile, security, and account session from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-neutral-300">
                <span className="rounded-full border border-neutral-800 bg-[#0B0B0B] px-3 py-1">{profile.role || "Customer"}</span>
                <span className="rounded-full border border-neutral-800 bg-[#0B0B0B] px-3 py-1">{profile.email || "No email loaded"}</span>
                <span className="rounded-full border border-neutral-800 bg-[#0B0B0B] px-3 py-1">{profile.phone || "No phone added"}</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-56">
              <Button
                variant="outline"
                onClick={() => profileSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="justify-start rounded-2xl border-neutral-700 bg-[#0B0B0B] text-white hover:bg-[#1A1A1A]"
              >
                Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => securitySectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="justify-start rounded-2xl border-neutral-700 bg-[#0B0B0B] text-white hover:bg-[#1A1A1A]"
              >
                Settings
              </Button>
              <AccountDeletionDialog
                roleLabel="Customer"
                buttonClassName="w-full justify-start rounded-2xl border-[#7F1D1D]/50 bg-[#7F1D1D]/10 text-[#FCA5A5] hover:bg-[#7F1D1D]/20 hover:text-white"
              />
              <Button onClick={logout} className="w-full justify-start rounded-2xl bg-red-600 hover:bg-red-700">
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-[#27272A] bg-[#111111]">
          <CardHeader>
            <CardTitle>Session overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-neutral-400">
            <p>This page now contains the full customer account menu, so the dashboard header stays clean and direct.</p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-neutral-800 bg-[#0B0B0B] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Status</p>
                <p className="mt-2 text-white">Signed in</p>
              </div>
              <div className="rounded-2xl border border-neutral-800 bg-[#0B0B0B] p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-neutral-500">Profile</p>
                <p className="mt-2 text-white">Editable account details</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {message && <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-4 text-sm text-neutral-200">{message}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
        <Card ref={profileSectionRef} className="border border-[#27272A] bg-[#111111]">
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Full name" value={profile.fullName} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} />
                <Input placeholder="Email" value={profile.email} disabled className="opacity-80" />
                <Input placeholder="Phone" value={profile.phone} onChange={(event) => setProfile((current) => ({ ...current, phone: event.target.value }))} />
                <Input placeholder="Role" value={profile.role} disabled className="opacity-80" />
              </div>
              <Input placeholder="Business name" value={profile.businessName} onChange={(event) => setProfile((current) => ({ ...current, businessName: event.target.value }))} />
              <Input placeholder="GST number" value={profile.gstNumber} onChange={(event) => setProfile((current) => ({ ...current, gstNumber: event.target.value }))} />
              <Input placeholder="Business address" value={profile.businessAddress} onChange={(event) => setProfile((current) => ({ ...current, businessAddress: event.target.value }))} />
              <Button type="submit" disabled={savingProfile} className="rounded-2xl bg-red-600 hover:bg-red-700">
                {savingProfile ? "Saving..." : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card ref={securitySectionRef} className="border border-[#27272A] bg-[#111111]">
          <CardHeader>
            <CardTitle>Settings & security</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="rounded-2xl border border-neutral-800 bg-[#0B0B0B] p-4 text-sm text-neutral-400">
                Update your password below. These controls stay on the profile page so the dashboard header does not need a dropdown.
              </div>
              <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                <Input placeholder="Current password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
                <Input placeholder="New password" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
                <Input placeholder="Confirm password" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
                <Button type="submit" disabled={savingPassword} className="rounded-2xl bg-red-600 hover:bg-red-700">
                  {savingPassword ? "Updating..." : "Update password"}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={() => router.push("/customer/orders")} className="rounded-2xl border-neutral-700 bg-[#111111] text-white hover:bg-[#1A1A1A]">
          Back to orders
        </Button>
      </div>
    </div>
  );
}