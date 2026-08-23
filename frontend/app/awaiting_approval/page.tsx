"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, CheckCircle2, Clock, XCircle, AlertTriangle, FileText, ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { FloatingAuthCards } from "@/components/landing/FloatingAuthCards";

interface DocumentType {
  path: string;
  status: string;
  rejectionReason: string;
}

interface UserData {
  status: string;
  fullName?: string;
  role?: string;
  warehouseAddress?: {
    fullAddress?: string;
    street?: string;
    area?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    status?: "pending" | "approved" | "rejected";
    isVerified?: boolean;
    rejectionReason?: string;
  };
  documents: {
    aadhaar: DocumentType;
    drivingLicense: DocumentType;
    gstCertificate: DocumentType;
    shopLicense: DocumentType;
  };
}

export default function AwaitingApprovalPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!data.success || !data.data) return;

        const user = data.data;
        setUserData(user);

        // Customers never require approval
        if (user.role === "Customer") {
          router.push("/customer");
          return;
        }

        if (user.status === "approved") {
          setTimeout(() => {
            if (user.role === "Business Owner") {
              router.push("/owner");
            } else if (user.role === "Delivery Agent") {
              router.push("/delivery/dashboard");
            } else {
              router.push("/customer");
            }
          }, 2500);
        }
      } catch (error) {
        console.log(error);
      }
    }

    void fetchStatus();

    const interval = setInterval(() => {
      void fetchStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  function renderDocument(title: string, document: DocumentType) {
    if (!document || !document.path) return null;

    return (
      <div className="rounded-2xl p-5 border border-[#2A2B30] bg-[#111214] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316]">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-[#A1A1AA]">Cloudinary Secure Verification</p>
          </div>
        </div>

        <div>
          {document.status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <Clock size={14} className="animate-spin" />
              <span>Pending Review</span>
            </span>
          )}

          {document.status === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} />
              <span>Verified & Approved</span>
            </span>
          )}

          {document.status === "rejected" && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                <XCircle size={14} />
                <span>Document Rejected</span>
              </span>
              {document.rejectionReason && (
                <p className="text-xs text-red-300 mt-1">
                  Reason: {document.rejectionReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderLocationStatus() {
    if (userData?.role !== "Business Owner" && !userData?.warehouseAddress) {
      return null;
    }

    const warehouse = userData.warehouseAddress;
    const status = warehouse?.status || (warehouse?.isVerified ? "approved" : "pending");
    const addressPreview =
      warehouse?.fullAddress ||
      warehouse?.street ||
      (warehouse?.latitude && warehouse?.longitude
        ? `GPS: ${Number(warehouse.latitude).toFixed(4)}, ${Number(warehouse.longitude).toFixed(4)}`
        : "Address / Warehouse Location Verification");

    return (
      <div className="rounded-2xl p-5 border border-[#2A2B30] bg-[#111214] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316]">
            <MapPin size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Business Location</h3>
            <p className="text-xs text-[#A1A1AA] line-clamp-1 max-w-sm">
              {addressPreview}
            </p>
          </div>
        </div>

        <div>
          {status === "pending" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              <Clock size={14} className="animate-spin" />
              <span>Pending Review</span>
            </span>
          )}

          {status === "approved" && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 size={14} />
              <span>Verified & Approved</span>
            </span>
          )}

          {status === "rejected" && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                <XCircle size={14} />
                <span>Location Rejected</span>
              </span>
              {warehouse?.rejectionReason && (
                <p className="text-xs text-red-300 mt-1">
                  Reason: {warehouse.rejectionReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#111214] text-[#F4F4F5] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[#A1A1AA]">
          <span className="h-2.5 w-2.5 rounded-full bg-[#F97316] animate-pulse" />
          <span>Synchronizing KYC status with LogiTrack server...</span>
        </div>
      </div>
    );
  }

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
      <FloatingAuthCards variant="approval" />

      <div className="max-w-2xl w-full rounded-3xl border border-[#2A2B30] bg-[#1A1B1E]/95 p-8 sm:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl relative z-10 hover:border-[#F97316]/30 transition-all duration-300">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3 group cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111214] border border-[#2A2B30] text-[#F97316] shadow-sm group-hover:border-[#F97316]/60 transition-all">
              <Truck size={18} />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white">
              Logi<span className="text-[#F97316]">Track</span>
            </span>
          </Link>

          <h2 className="text-2xl font-bold text-white mt-1">
            KYC Verification Status
          </h2>
          <p className="text-xs sm:text-sm text-[#A1A1AA] mt-1">
            Auto-polling every 5 seconds for administrator review updates
          </p>
        </div>

        <div className="space-y-4">
          {/* Email Verification Banner */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-200">Gmail Verification</span>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-semibold">VERIFIED</span>
          </div>

          {/* Render KYC Documents */}
          {userData.documents && (
            <>
              {renderDocument("GST Certificate", userData.documents.gstCertificate)}
              {renderDocument("Shop License", userData.documents.shopLicense)}
              {renderLocationStatus()}
              {renderDocument("Aadhaar Card", userData.documents.aadhaar)}
              {renderDocument("Driving License", userData.documents.drivingLicense)}
            </>
          )}

          {/* Account Status Card */}
          <div
            className={`rounded-2xl p-5 border transition-all ${
              userData.status === "approved"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                : userData.status === "rejected"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {userData.status === "approved" && <CheckCircle2 size={20} className="text-emerald-400" />}
                {userData.status === "rejected" && <XCircle size={20} className="text-red-400" />}
                {userData.status === "pending" && <Clock size={20} className="text-amber-400 animate-spin" />}
                <div>
                  <p className="font-semibold text-sm">
                    {userData.status === "pending" && "Waiting for Admin Approval"}
                    {userData.status === "approved" && "Account Verified & Approved"}
                    {userData.status === "rejected" && "Account Application Rejected"}
                  </p>
                  <p className="text-xs opacity-80 mt-0.5">
                    {userData.status === "pending" && "Our operations team is reviewing your uploaded documents."}
                    {userData.status === "approved" && "Redirecting to portal login in 3 seconds..."}
                    {userData.status === "rejected" && "Please check your registered email for rejection details."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Login Action */}
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("token");
                router.push("/login");
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#A1A1AA] hover:text-[#F97316] transition cursor-pointer"
            >
              <span>Return to Sign In</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}