"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  RotateCcw,
  Truck,
  User,
  ShieldCheck,
  KeyRound,
  Lock,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { PasswordInput } from "@/components/common/PasswordInput";
import { Button } from "@/components/ui/button";
import { FloatingAuthCards } from "@/components/landing/FloatingAuthCards";
import { TruckLoader } from "@/components/ui/TruckLoader";
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

function cleanErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    if (
      err.message.includes("JSON") ||
      err.message.includes("Unexpected token") ||
      err.message.includes("is not valid JSON")
    ) {
      return fallback;
    }
    return err.message;
  }
  return fallback;
}

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "otp" | "details">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [registrationToken, setRegistrationToken] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("Business Owner");

  const [aadhaar, setAadhaar] = useState<File | null>(null);
  const [drivingLicense, setDrivingLicense] = useState<File | null>(null);
  const [gstCertificate, setGstCertificate] = useState<File | null>(null);
  const [shopLicense, setShopLicense] = useState<File | null>(null);

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

  const handleOtpDigitChange = (index: number, value: string) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = "";
      setOtpDigits(nextDigits);
      setOtp(nextDigits.join(""));
      return;
    }

    // Handle single digit or multiple pasted digits
    const nextDigits = [...otpDigits];
    if (cleanVal.length === 1) {
      nextDigits[index] = cleanVal;
      setOtpDigits(nextDigits);
      setOtp(nextDigits.join(""));
      if (index < OTP_LENGTH - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }
    } else {
      const chars = cleanVal.slice(0, OTP_LENGTH).split("");
      chars.forEach((c, idx) => {
        if (index + idx < OTP_LENGTH) {
          nextDigits[index + idx] = c;
        }
      });
      setOtpDigits(nextDigits);
      setOtp(nextDigits.join(""));
      const nextFocus = Math.min(OTP_LENGTH - 1, index + chars.length);
      otpInputRefs.current[nextFocus]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const nextDigits = ["", "", "", "", "", ""];
    pasted.split("").forEach((c, i) => {
      nextDigits[i] = c;
    });
    setOtpDigits(nextDigits);
    setOtp(nextDigits.join(""));
    const focusIdx = Math.min(OTP_LENGTH - 1, pasted.length - 1);
    otpInputRefs.current[focusIdx]?.focus();
  };

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
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpExpiresAt(response.expiresAt);
      setResendCountdown(response.resendAfterSeconds || DEFAULT_RESEND_SECONDS);
      setSuccess("Verification OTP dispatched to your Gmail address.");
      toast.success("Verification OTP dispatched to your Gmail address.");
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (requestError) {
      const message = cleanErrorMessage(
        requestError,
        "Unable to send verification code. Please try again.",
      );
      setError(message);
      toast.error(message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedOtp = otp.trim();

    setError(null);
    setSuccess(null);

    if (!isGmailAddress(normalizedEmail)) {
      setError("Please provide a valid Gmail address.");
      return;
    }

    if (normalizedOtp.length !== OTP_LENGTH) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await verifyRegistrationOtp(normalizedEmail, normalizedOtp);
      setRegistrationToken(response.registrationToken);
      setStep("details");
      setSuccess("Email verified successfully! Please complete your account profile.");
      toast.success("Email verified successfully!");
    } catch (verifyError) {
      const message = cleanErrorMessage(
        verifyError,
        "Invalid or expired OTP. Please try again.",
      );
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

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    setError(null);
    setSuccess(null);

    if (!canSubmitDetails) {
      setError("Please complete all required fields and verify requirements.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("registrationToken", registrationToken);
      formData.append("fullName", fullName);
      formData.append("email", email.trim().toLowerCase());
      formData.append("password", password);
      formData.append("role", selectedRole);

      if (selectedRole === "Delivery Agent") {
        if (!aadhaar || !drivingLicense) {
          setError("Please upload both Aadhaar and Driving License documents.");
          setIsSubmitting(false);
          return;
        }
        formData.append("aadhaar", aadhaar);
        formData.append("drivingLicense", drivingLicense);
      }

      if (selectedRole === "Business Owner") {
        if (!gstCertificate || !shopLicense) {
          setError("Please upload both GST Certificate and Shop License documents.");
          setIsSubmitting(false);
          return;
        }
        formData.append("gstCertificate", gstCertificate);
        formData.append("shopLicense", shopLicense);
      }

      const response = await completeRegistration(formData);

      if (response.token) {
        localStorage.setItem("token", response.token);
      }

      if (response.status === "approved" || response.data?.status === "approved") {
        toast.success("Account registered successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        toast.success("Account created! Redirecting to verification status...");
        setTimeout(() => {
          router.push("/awaiting_approval");
        }, 1500);
      }
    } catch (registerError) {
      const message = cleanErrorMessage(
        registerError,
        "Registration failed. Please try again.",
      );
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
    <main className="min-h-screen bg-[#111214] flex items-center justify-center px-4 py-12 text-[#F4F4F5] relative overflow-hidden selection:bg-[#F97316]/30">
      {/* Ambient Lighting Orbs */}
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#F97316]/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-10 w-[350px] h-[200px] bg-[#FDBA74]/5 rounded-full blur-[120px]" />

      {/* Background Grid Pattern */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15 bg-[radial-gradient(#2A2B30_1px,transparent_1px)] [background-size:24px_24px]"
      />

      {/* Ambient Floating Product Snippet Preview Cards */}
      <FloatingAuthCards variant="register" />

      <div className="w-full max-w-2xl rounded-3xl border border-[#2A2B30] bg-[#1A1B1E]/95 p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative z-10 hover:border-[#F97316]/30 transition-all duration-300">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-3 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316] shadow-sm group-hover:border-[#F97316]/60 transition-all">
              <Truck size={18} />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white font-display">
              Logi<span className="text-[#F97316]">Track</span>
            </span>
          </a>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            Create your account & join the verified logistics network
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="mb-8 rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 text-xs sm:text-sm text-[#A1A1AA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === "otp" && <ShieldCheck size={16} className="text-[#F97316]" />}
            <span>
              {step === "email" && "Step 1 of 3: Verify Gmail address to begin"}
              {step === "otp" && "Step 2 of 3: Enter 6-digit cryptographic OTP"}
              {step === "details" && "Step 3 of 3: Complete role details & KYC documents"}
            </span>
          </div>
          <span className="text-xs font-mono text-[#F97316] font-semibold bg-[#F97316]/10 border border-[#F97316]/20 px-2.5 py-0.5 rounded-full">
            {step === "email" ? "STEP 1" : step === "otp" ? "STEP 2" : "STEP 3"}
          </span>
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
            {/* Email Input (Active in Step 1, Locked/Disabled in Step 2) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm text-[#A1A1AA] font-semibold">
                  Email Address
                </label>
                {step === "otp" && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-[#FDBA74] font-mono">
                    <Lock size={12} />
                    <span>LOCKED FOR VERIFICATION</span>
                  </span>
                )}
              </div>

              <input
                type="email"
                value={email}
                disabled={step === "otp"}
                readOnly={step === "otp"}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@gmail.com"
                className={`w-full rounded-2xl border px-5 py-4 outline-none transition text-sm ${
                  step === "otp"
                    ? "bg-[#111214]/60 border-[#2A2B30] text-[#A1A1AA] cursor-not-allowed select-none opacity-80"
                    : "bg-[#111214] border-[#2A2B30] text-[#F4F4F5] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20"
                }`}
              />
              <p className="mt-2 text-xs text-[#A1A1AA]">
                {step === "otp"
                  ? "Verification code dispatched to this address. Click 'Edit email' below to modify."
                  : "Only Gmail addresses are supported for account verification."}
              </p>
            </div>

            {/* STEP 2: Dedicated Zero-Trust Security Checkpoint Card */}
            {step === "otp" && (
              <div className="rounded-3xl border border-[#F97316]/30 bg-[#111214]/80 p-6 sm:p-7 shadow-[0_0_30px_rgba(249,115,22,0.12)] space-y-6">
                <div className="flex items-center justify-between border-b border-[#2A2B30] pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Security Checkpoint</h3>
                      <p className="text-[11px] text-[#A1A1AA]">Enter 6-digit one-time passcode</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#22C55E] bg-[#22C55E]/10 border border-[#22C55E]/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                    LIVE AWAIT
                  </span>
                </div>

                {/* 6 Individual Boxed Digit Inputs */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA] text-center mb-3">
                    6-Digit Cryptographic Code
                  </label>

                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpInputRefs.current[idx] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-black font-mono rounded-2xl border outline-none transition-all duration-200 ${
                          digit
                            ? "border-[#F97316] bg-[#1A1B1E] text-white shadow-[0_0_15px_rgba(249,115,22,0.25)] ring-1 ring-[#F97316]"
                            : "border-[#2A2B30] bg-[#111214] text-[#F4F4F5] focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/30"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-[#A1A1AA]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#F97316]" />
                      <span>
                        {otpExpiresAt
                          ? `Expires at ${new Date(otpExpiresAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : "Expires in 5 minutes"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={resendOtp}
                      disabled={resendCountdown > 0 || isSendingOtp}
                      className="inline-flex items-center gap-1.5 text-[#FDBA74] hover:text-[#F97316] disabled:cursor-not-allowed disabled:text-gray-500 transition font-medium cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      {resendCountdown > 0
                        ? `Resend in ${resendCountdown}s`
                        : isSendingOtp
                          ? "Sending..."
                          : "Resend Code"}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-[#2A2B30] bg-transparent hover:bg-white/5 h-14 rounded-2xl text-sm font-semibold cursor-pointer"
                    onClick={() => {
                      setStep("email");
                      setOtp("");
                      setOtpDigits(["", "", "", "", "", ""]);
                      setRegistrationToken("");
                      setSuccess(null);
                    }}
                  >
                    Edit email
                  </Button>

                  <Button
                    type="button"
                    className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white h-14 rounded-2xl font-bold text-sm cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-[0.98]"
                    onClick={verifyOtp}
                    disabled={!canVerifyOtp}
                  >
                    {isVerifyingOtp ? <TruckLoader label="Verifying..." /> : "Verify & Authenticate"}
                  </Button>
                </div>
              </div>
            )}

            {step === "email" && (
              <Button
                type="button"
                className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white h-14 rounded-2xl font-semibold cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-[0.98]"
                onClick={startOtpFlow}
                disabled={!canRequestOtp}
              >
                {isSendingOtp ? <TruckLoader label="Sending Code..." /> : "Send Verification Code"}
              </Button>
            )}
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm text-[#A1A1AA]">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#F4F4F5] outline-none transition focus:border-[#F97316]"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#A1A1AA]">Email Address</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full cursor-not-allowed rounded-2xl border border-[#2A2B30] bg-[#111214]/60 px-5 py-4 text-[#A1A1AA] outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#A1A1AA]">Password</label>
              <PasswordInput
                placeholder="Create password"
                value={password}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#F4F4F5] outline-none transition focus:border-[#F97316]"
              />

              <ul className="mt-3 space-y-1">
                {passwordRequirements.map((rule) => (
                  <li
                    key={rule.id}
                    className={`text-xs ${rule.met ? "text-green-400" : "text-[#A1A1AA]"}`}
                  >
                    {rule.met ? "✓" : "•"} {rule.label}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#A1A1AA]">Confirm Password</label>
              <PasswordInput
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#F4F4F5] outline-none transition focus:border-[#F97316]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-[#A1A1AA]">Register As</label>

              <div className="grid grid-cols-3 gap-4" role="radiogroup" aria-label="Registration Role">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.name;

                  return (
                    <button
                      key={role.name}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedRole(role.name);
                      }}
                      className={`rounded-2xl border p-4 transition-all cursor-pointer select-none ${
                        active
                          ? "border-[#F97316] bg-[#F97316]/15 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-[#F97316]"
                          : "border-[#2A2B30] bg-[#111214] hover:border-[#F97316]/50"
                      }`}
                    >
                      <Icon className={`mx-auto mb-2 ${active ? "text-[#F97316]" : "text-white"}`} />
                      <p className="text-sm text-white font-medium">{role.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedRole === "Delivery Agent" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[#A1A1AA]">
                    Aadhaar Card (Image or PDF)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setAadhaar(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#A1A1AA]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#A1A1AA]">
                    Driving License (Image or PDF)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setDrivingLicense(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#A1A1AA]"
                    required
                  />
                </div>
              </div>
            )}

            {selectedRole === "Business Owner" && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-[#A1A1AA]">
                    GST Certificate (Image or PDF)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setGstCertificate(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#A1A1AA]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-[#A1A1AA]">
                    Shop License (Image or PDF)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setShopLicense(e.target.files?.[0] || null)}
                    className="w-full rounded-2xl border border-[#2A2B30] bg-[#111214] px-5 py-4 text-[#A1A1AA]"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmitDetails || isSubmitting}
              className="flex w-full h-14 items-center justify-center gap-2 rounded-2xl bg-[#F97316] py-3.5 font-bold text-white transition-all hover:bg-[#EA580C] disabled:cursor-not-allowed disabled:bg-neutral-800 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <TruckLoader label="Creating Account..." />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-[#A1A1AA]">
          Already have an account?{" "}
          <a href="/login" className="text-[#F97316] transition hover:text-[#EA580C] font-medium">
            Login
          </a>
        </p>
      </div>
    </main>
  );
}
