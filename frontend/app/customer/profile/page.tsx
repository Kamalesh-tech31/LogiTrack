"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCurrentUser, updateCurrentPassword, updateCurrentUser } from "@/lib/api";
import { useLogout } from "@/lib/logout";

export default function CustomerProfilePage() {
  const router = useRouter();
  const { logout } = useLogout();
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
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Account</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Profile</h1>
          <p className="mt-2 text-sm text-neutral-400">Manage your account details, password, and session.</p>
        </div>
        <Button onClick={logout} className="w-fit rounded-2xl bg-red-600 hover:bg-red-700">Logout</Button>
      </div>

      {message && <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-4 text-sm text-neutral-200">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-[#27272A] bg-[#111111]">
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

        <Card className="border border-[#27272A] bg-[#111111]">
          <CardHeader>
            <CardTitle>Change password</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePasswordSubmit}>
              <Input placeholder="Current password" type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} />
              <Input placeholder="New password" type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} />
              <Input placeholder="Confirm password" type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} />
              <Button type="submit" disabled={savingPassword} className="rounded-2xl bg-red-600 hover:bg-red-700">
                {savingPassword ? "Updating..." : "Update password"}
              </Button>
            </form>
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