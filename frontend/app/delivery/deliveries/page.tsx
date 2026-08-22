"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Package,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  Truck,
  Phone,
  MapPin,
  Clock,
  RotateCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import type {
  DeliveryRecord,
  DeliveryStatus,
} from "@/components/delivery/deliveryData";
import {
  fetchDeliveries,
  claimDelivery,
  verifyCustomerDeliveryOtp,
  requestDeliveryOtp,
  acceptDelivery,
  updateDeliveryStatus,
  saveLocationUpdate,
} from "@/lib/api";

const statusOptions: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  Pending: ["Out for Delivery", "Failed Attempt"],
  pending: ["Out for Delivery", "Failed Attempt"],
  Assigned: ["Out for Delivery", "Failed Attempt"],
  assigned: ["Out for Delivery", "Failed Attempt"],
  "Out for Delivery": ["Delivered", "Failed Attempt"],
  "out-for-delivery": ["Delivered", "Failed Attempt"],
  Shipped: ["Delivered", "Failed Attempt"],
  shipped: ["Delivered", "Failed Attempt"],
  Delivered: [],
  delivered: [],
  "Failed Attempt": ["Returned"],
  "failed-attempt": ["Returned"],
  Returned: [],
  returned: [],
};

function toTitleCase(s?: string) {
  if (!s) return "";
  return s
    .split(/[- ]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"available" | "my-deliveries">(
    "available",
  );
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, DeliveryStatus>
  >({});
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [isClaiming, setIsClaiming] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [completionPhotos, setCompletionPhotos] = useState<
    Record<string, string>
  >({});
  const [completionPreviews, setCompletionPreviews] = useState<
    Record<string, string>
  >({});

  const loadDeliveries = async () => {
    try {
      const data = await fetchDeliveries();
      setDeliveries(data);
      setSelectedStatuses(
        Object.fromEntries(
          data.map((item) => [item.id, item.status]),
        ) as Record<string, DeliveryStatus>,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load deliveries.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeliveries();
  }, []);

  const isAssignedToCurrentUser = (delivery: DeliveryRecord) => {
    if (typeof window === "undefined") return false;
    const currentUserId = localStorage.getItem("userId");
    if (!currentUserId) return false;

    // Prefer the top-level agent field returned by mapOrderToRecord
    if (delivery.agent?._id && String(delivery.agent._id) === currentUserId) {
      return true;
    }

    // Fallback: check raw assignedAgent (object or string)
    const assigned = delivery.raw?.assignedAgent;
    if (!assigned) return false;
    if (typeof assigned === "string") return assigned === currentUserId;
    if (assigned._id) return String(assigned._id) === currentUserId;
    if (assigned.id) return String(assigned.id) === currentUserId;
    return false;
  };

  // Split deliveries into available (unassigned) and mine (assigned to me)
  const availableDeliveries = deliveries.filter(
    (d) => !d.isClaimed && !d.agent,
  );
  const myDeliveries = deliveries.filter((d) => isAssignedToCurrentUser(d));

  // Match the backend rule exactly: any active (non-terminal) assigned order blocks claiming
  const terminalStatuses = [
    "completed",
    "delivered",
    "failed",
    "returned",
    "cancelled",
  ];
  const hasActiveMine = myDeliveries.some(
    (d) => !terminalStatuses.includes(String(d.status || "").toLowerCase()),
  );

  const handleClaim = async (id: string) => {
    setIsClaiming((prev) => ({ ...prev, [id]: true }));
    try {
      const result = await claimDelivery(id);
      toast.success(
        "Order claimed! Verification OTP has been sent to customer.",
      );
      await loadDeliveries();
      setActiveTab("my-deliveries");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to claim delivery.",
      );
    } finally {
      setIsClaiming((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleVerifyOtp = async (id: string) => {
    const otp = otpInputs[id]?.trim();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP provided by customer.");
      return;
    }

    setIsVerifying((prev) => ({ ...prev, [id]: true }));
    try {
      await verifyCustomerDeliveryOtp(id, otp);
      toast.success("Customer delivery OTP verified! Customer details unlocked.");
      setOtpInputs((prev) => ({ ...prev, [id]: "" }));
      await loadDeliveries();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Invalid or expired OTP.",
      );
    } finally {
      setIsVerifying((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleResendOtp = async (id: string) => {
    try {
      await requestDeliveryOtp(id);
      toast.success("New verification OTP dispatched to customer's email.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resend OTP.",
      );
    }
  };

  const handleAccept = async (id: string) => {
    const item = deliveries.find((d) => d.id === id);
    if (!item) return;

    try {
      const accepted = await acceptDelivery(id);
      setDeliveries((prev) => prev.map((p) => (p.id === id ? accepted : p)));
      toast.success("Delivery accepted! Moving to Out for Delivery.");
      await loadDeliveries();

      if (!navigator.geolocation) {
        toast.error(
          "Geolocation is not supported by your browser. Please allow location access.",
        );
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const displayName = `Driver location ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
          const formattedAddress = displayName;

          try {
            await saveLocationUpdate({
              deliveryId: accepted.id,
              latitude: lat,
              longitude: lon,
              source: "browser",
              displayName,
              formattedAddress,
              city: "Unknown city",
              state: "Unknown state",
              country: "Unknown country",
              postalCode: "N/A",
              timestamp: new Date().toLocaleString(),
            });
            toast.success(
              "Driver live location synchronized for customer tracking.",
            );
          } catch (updateError) {
            console.error("Unable to save driver location:", updateError);
          }
        },
        (error) => {
          toast.error(`Unable to capture current location: ${error.message}`);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to accept delivery.",
      );
    }
  };

  const handlePhotoChange = (id: string, file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") return;
      setCompletionPhotos((prev) => ({ ...prev, [id]: result }));
      setCompletionPreviews((prev) => ({ ...prev, [id]: result }));
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = async (id: string) => {
    const photo = completionPhotos[id];
    if (!photo) {
      toast.error("Please upload a completion photo before marking completed.");
      return;
    }

    try {
      const updated = await updateDeliveryStatus(id, "completed", photo);
      setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)));
      setSelectedStatuses((prev) => ({
        ...prev,
        [id]: updated.status as DeliveryStatus,
      }));
      toast.success("Delivery marked completed.");
      await loadDeliveries();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to complete delivery.",
      );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">
            Delivery Dispatch & Verification
          </p>
          <h1 className="text-3xl font-bold text-white mt-2">
            Delivery Operations
          </h1>
          <p className="text-[#D5D5D5] mt-2 max-w-2xl text-sm">
            Claim available deliveries, verify customer OTPs upon arrival, and
            manage active routes with context-aware privacy controls.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 min-w-70">
          <div className="rounded-2xl border border-[#27272A] bg-[#1A1A1A] p-4">
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">
              Available
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {availableDeliveries.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#27272A] bg-[#1A1A1A] p-4">
            <p className="text-xs text-[#A1A1AA] uppercase tracking-wider">
              My Deliveries
            </p>
            <p className="text-2xl font-bold text-white mt-1">
              {myDeliveries.length}
            </p>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-[#27272A] pb-4">
        <button
          onClick={() => setActiveTab("available")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "available"
              ? "bg-[#DC2626] text-white shadow-lg shadow-red-950/40"
              : "bg-[#111111] text-[#A1A1AA] hover:text-white border border-[#27272A]"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Available Deliveries</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "available"
                ? "bg-white/20 text-white"
                : "bg-[#27272A] text-[#A1A1AA]"
            }`}
          >
            {availableDeliveries.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("my-deliveries")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
            activeTab === "my-deliveries"
              ? "bg-[#DC2626] text-white shadow-lg shadow-red-950/40"
              : "bg-[#111111] text-[#A1A1AA] hover:text-white border border-[#27272A]"
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>My Deliveries</span>
          <span
            className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
              activeTab === "my-deliveries"
                ? "bg-white/20 text-white"
                : "bg-[#27272A] text-[#A1A1AA]"
            }`}
          >
            {myDeliveries.length}
          </span>
        </button>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-2xl border border-[#27272A] bg-[#1A1A1A] p-8 text-center text-white">
          <RotateCw className="h-6 w-6 animate-spin mx-auto mb-3 text-red-500" />
          Loading deliveries from backend...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-[#FCA5A5] flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      ) : activeTab === "available" ? (
        /* TAB 1: AVAILABLE DELIVERIES */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Open Deliveries for Pickup
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Claim an available order to initiate customer delivery
            </p>
          </div>

          {availableDeliveries.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-12 text-center">
              <Package className="h-12 w-12 text-[#52525B] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">
                No Available Deliveries
              </h3>
              <p className="text-sm text-[#A1A1AA] mt-1 max-w-md mx-auto">
                All incoming orders have been claimed. Check back shortly for new
                orders ready for dispatch.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {availableDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="bg-linear-to-br from-[#0b0b0b] to-[#121216] border border-[#27272A] rounded-2xl p-6 shadow-md hover:border-red-950/60 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-lg bg-[#1F2937] text-xs text-[#E5E7EB] font-mono font-medium">
                            {delivery.orderId || delivery.id}
                          </span>
                          <span className="bg-amber-500/10 text-amber-500 text-xs px-3 py-1 rounded-full font-semibold border border-amber-500/20">
                            AVAILABLE
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white mt-3">
                          {delivery.customer}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#A1A1AA] block">
                          Estimated Time
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {delivery.eta || "20m"}
                        </span>
                      </div>
                    </div>

                    {/* Area / Destination (Masked, Non-Sensitive) */}
                    <div className="rounded-xl border border-[#27272A] bg-[#141417] p-3.5 flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs text-[#A1A1AA]">
                          Destination Area
                        </p>
                        <p className="text-sm font-medium text-white">
                          {delivery.city || delivery.address}
                        </p>
                      </div>
                    </div>

                    {/* Products summary */}
                    {delivery.raw?.items?.length > 0 && (
                      <div className="text-xs text-[#9CA3AF]">
                        <span className="text-[#A1A1AA]">Order Items:</span>{" "}
                        {delivery.raw.items
                          .map(
                            (it: any) =>
                              `${it.quantity}x ${it.product?.name || "Product"}`,
                          )
                          .join(", ")}
                      </div>
                    )}
                  </div>

                  {/* Claim action */}
                  <div className="mt-6 pt-4 border-t border-[#27272A]">
                    <button
                      onClick={() => void handleClaim(delivery.id)}
                      disabled={
                        hasActiveMine || isClaiming[delivery.id]
                      }
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        hasActiveMine
                          ? "bg-[#27272A] text-[#71717A] cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-950/50 cursor-pointer"
                      }`}
                    >
                      {isClaiming[delivery.id] ? (
                        <>
                          <RotateCw className="h-4 w-4 animate-spin" />
                          <span>Claiming & Notifying Customer...</span>
                        </>
                      ) : hasActiveMine ? (
                        <span>Complete current delivery before claiming</span>
                      ) : (
                        <>
                          <Package className="h-4 w-4" />
                          <span>CLAIM DELIVERY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: MY DELIVERIES */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              My Claimed & Active Deliveries
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              Verify customer passcodes before acceptance and completion
            </p>
          </div>

          {myDeliveries.length === 0 ? (
            <div className="rounded-2xl border border-[#27272A] bg-[#111111] p-12 text-center">
              <Truck className="h-12 w-12 text-[#52525B] mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white">
                No Deliveries in Your Queue
              </h3>
              <p className="text-sm text-[#A1A1AA] mt-1 max-w-md mx-auto">
                You haven&apos;t claimed any orders yet. Visit the Available
                Deliveries tab to pick up new assignments.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-2">
              {myDeliveries.map((delivery) => {
                const isVerified = Boolean(
                  delivery.customerVerified ||
                    delivery.raw?.customerVerified,
                );
                const s = String(delivery.status || "").toLowerCase();
                const isAccepted = ["shipped", "out-for-delivery"].includes(s);
                const isCompleted = ["completed", "delivered"].includes(s);

                const fullCustomerAddress =
                  delivery.fullAddress ||
                  (delivery.raw?.deliveryAddress
                    ? [
                        delivery.raw.deliveryAddress.street,
                        delivery.raw.deliveryAddress.city,
                        delivery.raw.deliveryAddress.state,
                        delivery.raw.deliveryAddress.postalCode,
                        delivery.raw.deliveryAddress.country,
                      ]
                        .filter(Boolean)
                        .join(", ")
                    : delivery.address);

                const customerPhone =
                  delivery.customerPhone ||
                  delivery.raw?.customerPhone ||
                  delivery.contact;

                return (
                  <div
                    key={delivery.id}
                    className={`border rounded-2xl p-6 transition-all ${
                      isCompleted
                        ? "bg-[#0c0c0e] border-[#27272A]"
                        : isVerified
                          ? "bg-linear-to-br from-[#0c0c0e] to-[#12161f] border-emerald-900/60 shadow-lg"
                          : "bg-linear-to-br from-[#0c0c0e] to-[#1a1414] border-amber-900/50 shadow-lg"
                    }`}
                  >
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 rounded-lg bg-[#1F2937] text-xs text-[#E5E7EB] font-mono font-medium">
                            {delivery.orderId || delivery.id}
                          </span>
                          {isCompleted ? (
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/20">
                              DELIVERED
                            </span>
                          ) : isAccepted ? (
                            <span className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full font-semibold border border-blue-500/20">
                              OUT FOR DELIVERY
                            </span>
                          ) : isVerified ? (
                            <span className="bg-emerald-500/10 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-500/20 flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-400 text-xs px-3 py-1 rounded-full font-semibold border border-amber-500/20">
                              CLAIMED
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg font-bold text-white mt-3">
                          {isVerified
                            ? delivery.raw?.customerName || delivery.customer
                            : delivery.customer}
                        </h3>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#A1A1AA] block">
                          Status
                        </span>
                        <span className="text-sm font-semibold text-white">
                          {toTitleCase(delivery.status)}
                        </span>
                      </div>
                    </div>

                    {/* Step 1: UNVERIFIED STATE -> Show OTP Input Box */}
                    {!isVerified && !isCompleted && (
                      <div className="mt-5 rounded-2xl border border-amber-800/40 bg-[#16120e] p-5 space-y-4">
                        <div className="flex items-start gap-3">
                          <KeyRound className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <h4 className="text-sm font-semibold text-amber-300">
                              Customer Verification Required
                            </h4>
                            <p className="text-xs text-[#D4D4D8] mt-1">
                              An OTP has been emailed to the customer. Ask the
                              customer for their 6-digit passcode to confirm
                              delivery and unlock delivery details.
                            </p>
                          </div>
                        </div>

                        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter 6-digit OTP"
                            value={otpInputs[delivery.id] || ""}
                            onChange={(e) =>
                              setOtpInputs((prev) => ({
                                ...prev,
                                [delivery.id]: e.target.value.replace(
                                  /\D/g,
                                  "",
                                ),
                              }))
                            }
                            className="w-full sm:w-48 bg-[#0B0B0B] border border-[#3F3F46] rounded-xl px-4 py-2.5 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-amber-500"
                          />

                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => void handleVerifyOtp(delivery.id)}
                              disabled={isVerifying[delivery.id]}
                              className="flex-1 sm:flex-none px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {isVerifying[delivery.id] ? (
                                <>
                                  <RotateCw className="h-3.5 w-3.5 animate-spin" />
                                  <span>Verifying...</span>
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-4 w-4" />
                                  <span>Verify Customer OTP</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => void handleResendOtp(delivery.id)}
                              className="px-3 py-2.5 bg-[#27272A] hover:bg-[#3F3F46] text-[#D4D4D8] rounded-xl text-xs font-medium transition cursor-pointer"
                              title="Resend OTP email to customer"
                            >
                              Resend
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2: VERIFIED STATE -> Reveal Customer Address & Phone */}
                    {isVerified && (
                      <div className="mt-5 rounded-2xl border border-emerald-800/40 bg-[#0d1712] p-5 space-y-3">
                        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Customer Identity Verified</span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 pt-1 text-sm">
                          <div className="bg-[#0A0F0C] border border-emerald-900/30 rounded-xl p-3">
                            <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                              Full Delivery Address
                            </span>
                            <p className="text-white font-medium mt-1 text-xs sm:text-sm">
                              {fullCustomerAddress}
                            </p>
                          </div>

                          <div className="bg-[#0A0F0C] border border-emerald-900/30 rounded-xl p-3">
                            <span className="text-xs text-[#A1A1AA] flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-emerald-500" />
                              Customer Contact
                            </span>
                            <p className="text-white font-medium mt-1 text-xs sm:text-sm">
                              {customerPhone || "Available via in-app call"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3: ACTIONS BASED ON WORKFLOW */}
                    <div className="mt-5 pt-4 border-t border-[#27272A] space-y-4">
                      {/* If verified but not yet accepted -> Show ACCEPT DELIVERY button */}
                      {isVerified && !isAccepted && !isCompleted && (
                        <button
                          onClick={() => void handleAccept(delivery.id)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer"
                        >
                          <Truck className="h-4 w-4" />
                          <span>ACCEPT DELIVERY & START ROUTE</span>
                        </button>
                      )}

                      {/* If accepted (in-flight) -> Show Status & Completion controls */}
                      {isAccepted && !isCompleted && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-[#A1A1AA]">
                              Active Route Status:
                            </label>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 font-semibold text-xs rounded-full border border-blue-500/20">
                              Out for Delivery
                            </span>
                          </div>

                          {/* Completion Photo & Finalize */}
                          <div className="rounded-xl border border-[#27272A] bg-[#111111] p-4 space-y-3">
                            <label className="block text-xs text-[#A1A1AA] font-semibold">
                              Proof of Delivery Photo (Required for Completion)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              aria-label="Upload completion photo"
                              onChange={(e) =>
                                handlePhotoChange(
                                  delivery.id,
                                  e.target.files?.[0],
                                )
                              }
                              className="w-full rounded-xl border border-[#27272A] bg-[#0B0B0B] px-4 py-2.5 text-xs text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700"
                            />
                            {completionPreviews[delivery.id] && (
                              <img
                                src={completionPreviews[delivery.id]}
                                alt="Completion preview"
                                className="h-32 w-full rounded-xl object-cover border border-[#27272A]"
                              />
                            )}

                            <button
                              onClick={() => void handleComplete(delivery.id)}
                              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                            >
                              MARK DELIVERED & COMPLETE ORDER
                            </button>
                          </div>
                        </div>
                      )}

                      {/* If completed */}
                      {isCompleted && (
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4" />
                            Order fulfilled successfully
                          </span>
                          <span className="text-[#A1A1AA]">
                            {delivery.lastUpdated}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
