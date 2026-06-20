"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  RotateCcw,
  Truck,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { PasswordInput } from "@/components/common/PasswordInput";
import { Button } from "@/components/ui/button";
import {
  API_BASE_URL,
  completeRegistration,
  requestRegistrationOtp,
  verifyRegistrationOtp,
} from "@/lib/api";
import { isPasswordValid, PASSWORD_REQUIREMENTS } from "@/lib/passwordValidation";

const OTP_LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 60;

function isGmailAddress(value: string) {
  return /^[^\s@]+@gmail\.com$/i.test(value.trim());
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [gstCertificate, setGstCertificate] = useState<File | null>(null);
  const [shopLicense, setShopLicense] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState("Business Owner");
  const [registrationToken, setRegistrationToken] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setResendCountdown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [resendCountdown]);

  const passwordRequirements = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((rule) => ({
        ...rule,
        met: rule.test(password),
      })),
    [password],
  );

  const canRequestOtp = isGmailAddress(email) && !isSendingOtp;
  const canVerifyOtp = otp.trim().length === OTP_LENGTH && !isVerifyingOtp;
  const canSubmitDetails =
    step === "details" &&
    isPasswordValid(password) &&
    password === confirmPassword &&
    Boolean(registrationToken) &&
    !isSubmitting;

  const startOtpFlow = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    setError(null);
    setSuccess(null);

    if (!isGmailAddress(normalizedEmail)) {
      setError("Please enter a valid Gmail address ending in @gmail.com.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const response = await requestRegistrationOtp(normalizedEmail);
      setStep("otp");
      setOtp("");
      setOtpExpiresAt(response.expiresAt);
      setResendCountdown(response.resendAfterSeconds || DEFAULT_RESEND_SECONDS);
      setSuccess("OTP sent to your Gmail address.");
      toast.success("OTP sent to your Gmail address.");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unable to send OTP right now.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    setError(null);
    setSuccess(null);

    if (!otp || otp.trim().length !== OTP_LENGTH) {
      setError("Enter the 6-digit OTP sent to your Gmail address.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await verifyRegistrationOtp({
        email: normalizedEmail,
        otp: otp.trim(),
      });

      setRegistrationToken(response.registrationToken);
      setStep("details");
      setSuccess("Email verified successfully. Complete your account details below.");
      toast.success("Email verified successfully.");
    } catch (verifyError) {
      const message =
        verifyError instanceof Error
          ? verifyError.message
          : "OTP verification failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const resendOtp = async () => {
    if (resendCountdown > 0 || isSendingOtp) {
      return;
    }

    await startOtpFlow();
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (step !== "details") {
      return;
    }

    if (!registrationToken) {
      setError("Please verify your email before creating an account.");
      return;
    }

    if (!isPasswordValid(password)) {
      setError("Please meet all password requirements before continuing.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();

      formData.append("registrationToken", registrationToken);
      formData.append("fullName", fullName.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      formData.append("confirmPassword", confirmPassword);
      formData.append("role", selectedRole);

      if (aadhaar)
        formData.append("aadhaar", aadhaar);

      if (drivingLicense)
        formData.append("drivingLicense", drivingLicense);

      if (gstCertificate)
        formData.append("gstCertificate", gstCertificate);

      if (shopLicense)
        formData.append("shopLicense", shopLicense);
      const response = await fetch(
        `${API_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      if (
        selectedRole === "Business Owner" ||
        selectedRole === "Delivery Agent"
      ) {
        toast.success("Registration submitted successfully.");
        router.push("/awaiting_approval");
      } else {
        toast.success("Registration successful. Please sign in.");
        router.push("/login");
      }
    } catch (registrationError) {
      const message =
        registrationError instanceof Error
          ? registrationError.message
          : "Registration failed.";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = [
    { name: "Business Owner", icon: BriefcaseBusiness },
    { name: "Delivery Agent", icon: Truck },
    { name: "Customer", icon: User },
  ];

  return (
    <main className="min-h-screen bg-[#0B0B0B] flex items-center justify-center px-4 py-10 text-white">
      <div className="w-full max-w-2xl rounded-3xl border border-[#7F1D1D]/40 bg-[#1A1A1A]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight">
            Logi<span className="text-[#7F1D1D]">Track</span>
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            Smart Supply Chain & Delivery Platform
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-[#27272A] bg-[#111111] p-4 text-sm text-gray-300">
          {step === "email" && "Step 1: verify your Gmail address to begin registration."}
          {step === "otp" && "Step 2: enter the OTP sent to your Gmail inbox."}
          {step === "details" && "Step 3: complete your account details after verification."}
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 size={16} />
            {success}
          </div>
        ) : null}

        {step !== "details" ? (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@gmail.com"
                className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#7F1D1D]"
              />
              <p className="mt-2 text-xs text-gray-500">
                Only Gmail addresses are supported for account verification.
              </p>
            </div>

            {step === "otp" && (
              <>
                <div>
                  <label className="mb-2 block text-sm text-gray-300">OTP</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={OTP_LENGTH}
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-center tracking-[0.35em] text-white outline-none transition focus:border-[#7F1D1D]"
                  />
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {otpExpiresAt
                        ? `OTP expires at ${new Date(otpExpiresAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "OTP expires in 5 minutes"}
                    </span>
                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={resendCountdown > 0 || isSendingOtp}
                      className="inline-flex items-center gap-2 text-[#F87171] disabled:cursor-not-allowed disabled:text-gray-500"
                    >
                      <RotateCcw size={14} />
                      {resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : isSendingOtp
                          ? "Sending..."
                          : "Resend OTP"}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-gray-700 bg-transparent hover:bg-white/5"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setRegistrationToken("");
                      setSuccess(null);
                    }}
                  >
                    Edit email
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-[#7F1D1D] hover:bg-[#991B1B]"
                    onClick={verifyOtp}
                    disabled={!canVerifyOtp}
                  >
                    {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
              </>
            )}

            {step === "email" && (
              <Button
                type="button"
                className="w-full bg-[#7F1D1D] hover:bg-[#991B1B]"
                onClick={startOtpFlow}
                disabled={!canRequestOtp}
              >
                {isSendingOtp ? "Sending OTP..." : "Send Verification Code"}
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-gray-300">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#7F1D1D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-gray-300 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Password</label>
              <PasswordInput
                placeholder="Create password"
                value={password}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#7F1D1D]"
              />

              <ul className="mt-3 space-y-1">
                {passwordRequirements.map((rule) => (
                  <li
                    key={rule.id}
                    className={`text-xs ${rule.met ? "text-green-400" : "text-gray-500"}`}
                  >
                    {rule.met ? "✓" : "•"} {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Confirm Password</label>
              <PasswordInput
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4 text-white outline-none transition focus:border-[#7F1D1D]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-gray-300">Register As</label>

              <div className="grid grid-cols-3 gap-4">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.name;

                  return (
                    <button
                      key={role.name}
                      type="button"
                      onClick={() => setSelectedRole(role.name)}
                      className={`rounded-2xl border p-4 transition-all ${
                        active
                          ? "border-[#7F1D1D] bg-[#7F1D1D]/20"
                          : "border-gray-700 bg-black/30 hover:border-[#7F1D1D]"
                      }`}
                    >
                      <Icon className="mx-auto mb-2 text-white" />
                      <p className="text-sm text-white">{role.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
              {selectedRole === "Delivery Agent" && (
                <div className="space-y-4">

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Aadhaar Card
                    </label>

                    <input
                      type="file"
                      onChange={(e) =>
                        setAadhaar(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Driving License
                    </label>

                    <input
                      type="file"
                      onChange={(e) =>
                        setDrivingLicense(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4"
                    />
                  </div>

                </div>
              )}


              {selectedRole === "Business Owner" && (
                <div className="space-y-4">

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      GST Certificate
                    </label>

                    <input
                      type="file"
                      onChange={(e) =>
                        setGstCertificate(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-gray-300">
                      Shop License
                    </label>

                    <input
                      type="file"
                      onChange={(e) =>
                        setShopLicense(e.target.files?.[0] || null)
                      }
                      className="w-full rounded-2xl border border-gray-700 bg-black/40 px-5 py-4"
                    />
                  </div>

                </div>
              )}

            <button
              type="submit"
              disabled={!canSubmitDetails}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7F1D1D] py-4 font-semibold text-white transition-all hover:bg-[#991B1B] disabled:cursor-not-allowed disabled:bg-gray-700"
            >
              Create Account
              {isSubmitting ? "..." : <ArrowRight size={18} />}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-[#7F1D1D] transition hover:text-red-400">
            Login
          </a>
        </p>
      </div>
    </main>
 );
}
