"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import type {
  DeliveryRecord,
  DeliveryStatus,
} from "@/components/delivery/deliveryData";
import {
  acceptDelivery,
  completeDelivery,
  fetchDeliveries,
  updateDeliveryStatus,
} from "@/lib/api";

const statusOptions: Record<DeliveryStatus, DeliveryStatus[]> = {
  Assigned: ["Picked Up", "Out for Delivery", "Delayed", "Failed"],
  "Picked Up": ["Out for Delivery", "Delayed", "Failed"],
  "Out for Delivery": ["Completed", "Delayed", "Failed"],
  Delayed: ["Out for Delivery", "Failed"],
  Failed: ["Returned"],
  Completed: [],
  Returned: [],
};

const toTitleCase = (value: string) => {
  if (!value) return "";
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<
    Record<string, DeliveryStatus>
  >({});
  const [completionPhotos, setCompletionPhotos] = useState<
    Record<string, File | null>
  >({});
  const [completionPreviews, setCompletionPreviews] = useState<
    Record<string, string | null>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDeliveries() {
      try {
        const data = await fetchDeliveries();

        if (isMounted) {
          setDeliveries(data);
          setSelectedStatuses(
            Object.fromEntries(
              data.map((item) => [item.id, item.status]),
            ) as Record<string, DeliveryStatus>,
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : "Unable to load deliveries.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDeliveries();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAssignedToCurrentUser = (delivery: DeliveryRecord) => {
    if (typeof window === "undefined") return false;
    const currentUserId = localStorage.getItem("userId");
    const assigned = delivery.raw?.assignedAgent;
    if (!assigned) return false;
    if (typeof assigned === "string") return String(assigned) === currentUserId;
    if (assigned._id) return String(assigned._id) === currentUserId;
    if (assigned.id) return String(assigned.id) === currentUserId;
    return false;
  };

  const activeCount = deliveries.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return !["completed", "delivered", "returned", "cancelled"].includes(s);
  }).length;

  const hasActiveAssignedOrder = deliveries.some((delivery) => {
    const s = String(delivery.status || "").toLowerCase();
    return (
      !["completed", "delivered", "returned", "cancelled"].includes(s) &&
      isAssignedToCurrentUser(delivery)
    );
  });

  const completedCount = deliveries.filter((item) => {
    const s = String(item.status || "").toLowerCase();
    return s === "completed" || s === "delivered";
  }).length;

  const handleUpdateStatus = async (id: string) => {
    const current = deliveries.find((item) => item.id === id);
    const nextStatus = selectedStatuses[id];

    if (!current || !nextStatus || nextStatus === current.status) {
      toast.error("Select a valid status change before saving.");
      return;
    }

    try {
      const updatedDelivery = await updateDeliveryStatus(id, nextStatus);

      setDeliveries((prev) =>
        prev.map((item) => (item.id === id ? updatedDelivery : item)),
      );
      setSelectedStatuses((prev) => ({
        ...prev,
        [id]: updatedDelivery.status,
      }));
      toast.success(
        `Updated ${updatedDelivery.orderId || updatedDelivery.id} to ${updatedDelivery.status}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update delivery status",
      );
    }
  };

  const handleAccept = async (id: string) => {
    try {
      const updatedDelivery = await acceptDelivery(id);
      setDeliveries((prev) =>
        prev.map((item) => (item.id === id ? updatedDelivery : item)),
      );
      setSelectedStatuses((prev) => ({
        ...prev,
        [id]: updatedDelivery.status,
      }));
      toast.success(
        `Claimed delivery ${updatedDelivery.orderId || updatedDelivery.id}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to claim delivery",
      );
    }
  };

  const handlePhotoChange = (id: string, file?: File) => {
    if (!file) {
      setCompletionPhotos((prev) => ({ ...prev, [id]: null }));
      setCompletionPreviews((prev) => ({ ...prev, [id]: null }));
      return;
    }

    setCompletionPhotos((prev) => ({ ...prev, [id]: file }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompletionPreviews((prev) => ({
        ...prev,
        [id]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleComplete = async (id: string) => {
    try {
      const photo = completionPhotos[id] || undefined;
      const updatedDelivery = await completeDelivery(id, photo);
      setDeliveries((prev) =>
        prev.map((item) => (item.id === id ? updatedDelivery : item)),
      );
      setSelectedStatuses((prev) => ({
        ...prev,
        [id]: updatedDelivery.status,
      }));
      setCompletionPhotos((prev) => ({ ...prev, [id]: null }));
      setCompletionPreviews((prev) => ({ ...prev, [id]: null }));
      toast.success(
        `Completed delivery ${updatedDelivery.orderId || updatedDelivery.id}`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to complete delivery",
      );
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <p className="text-xs uppercase font-semibold tracking-wider text-neutral-400">
            Delivery Operations
          </p>
          <h1 className="text-3xl font-bold text-white tracking-tight mt-1">
            Assigned Deliveries
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5 max-w-2xl">
            Claim available deliveries, manage active shipments, and record proof of delivery.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-64">
          <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-4 shadow-sm">
            <p className="text-xs text-neutral-400">Active Shipments</p>
            <p className="text-2xl font-bold text-white mt-1.5">{activeCount}</p>
          </div>

          <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-4 shadow-sm">
            <p className="text-xs text-neutral-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1.5">
              {completedCount}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-neutral-800 bg-[#111111] p-12 text-center text-neutral-400 text-sm">
          Loading deliveries from backend...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-red-300 text-sm">
          {error}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {deliveries.map((delivery) => {
            const options =
              statusOptions[delivery.status as unknown as DeliveryStatus] ||
              statusOptions[
                toTitleCase(delivery.status) as unknown as DeliveryStatus
              ] ||
              [];

            const assignedToMe = isAssignedToCurrentUser(delivery);

            return (
              <div
                key={delivery.id}
                className="bg-[#111111] border border-neutral-800 rounded-3xl p-6 shadow-md hover:border-neutral-700 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 rounded-lg bg-neutral-800 text-xs font-mono text-white font-medium">
                        {delivery.orderId || delivery.id}
                      </div>
                      <h3 className="text-base font-semibold text-white">
                        {delivery.customer}
                      </h3>
                    </div>

                    <p className="text-xs text-neutral-400 mt-2.5 max-w-xl leading-relaxed">
                      {delivery.address}
                    </p>
                    {/* Show product name if available */}
                    {delivery.raw?.items?.length > 0 && (
                      <p className="text-xs text-neutral-300 mt-2 font-medium">
                        Item:{" "}
                        <span className="text-white">
                          {delivery.raw.items[0].product?.name ||
                            delivery.raw.items[0].product}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block bg-neutral-800 text-xs text-neutral-200 px-3 py-1 rounded-full font-medium">
                      {toTitleCase(delivery.status)}
                    </span>
                    <div className="text-xs text-neutral-400 mt-1.5">
                      ETA: {delivery.eta || "--"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-neutral-800/80 bg-[#161616] p-3">
                    <p className="text-[11px] text-neutral-400">Priority</p>
                    <p className="text-xs text-white font-semibold mt-1">
                      {delivery.priority || "Normal"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-neutral-800/80 bg-[#161616] p-3">
                    <p className="text-[11px] text-neutral-400">Last Updated</p>
                    <p className="text-xs text-white font-semibold mt-1">
                      {delivery.lastUpdated || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-neutral-800/80 bg-[#161616] p-4.5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Shipment Action
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <select
                      aria-label="Select delivery status"
                      value={selectedStatuses[delivery.id]}
                      onChange={(event) =>
                        setSelectedStatuses((prev) => ({
                          ...prev,
                          [delivery.id]: event.target.value as DeliveryStatus,
                        }))
                      }
                      className="flex-1 w-full bg-[#111111] border border-neutral-800 text-xs text-white rounded-xl px-3.5 h-11 outline-none focus:border-[#7F1D1D]"
                    >
                      {options && options.length > 0 ? (
                        options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))
                      ) : (
                        <option value={delivery.status}>
                          {delivery.status}
                        </option>
                      )}
                    </select>

                    <div className="w-full sm:w-auto flex flex-col gap-2">
                      {!delivery.raw?.assignedAgent && (
                        <button
                          onClick={() => void handleAccept(delivery.id)}
                          disabled={hasActiveAssignedOrder}
                          className={`h-11 px-5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all cursor-pointer ${
                            hasActiveAssignedOrder
                              ? "bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700"
                              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/40"
                          }`}
                        >
                          {hasActiveAssignedOrder
                            ? "Claim Disabled (Active Trip Exists)"
                            : "Claim & Accept"}
                        </button>
                      )}

                      {delivery.raw?.assignedAgent && assignedToMe && (
                        <div className="space-y-3 w-full">
                          <label className="block text-xs text-neutral-400">
                            Upload Proof of Delivery
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            aria-label="Upload completion photo"
                            onChange={(event) =>
                              handlePhotoChange(
                                delivery.id,
                                event.target.files?.[0],
                              )
                            }
                            className="w-full rounded-xl border border-neutral-800 bg-[#111111] px-3 py-2 text-xs text-white file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-neutral-800 file:text-white"
                          />
                          {completionPreviews[delivery.id] ? (
                            <img
                              src={completionPreviews[delivery.id]!}
                              alt="Completion preview"
                              className="h-28 w-full rounded-xl object-cover border border-neutral-800"
                            />
                          ) : null}

                          {delivery.status !== "completed" && (
                            <button
                              onClick={() => void handleComplete(delivery.id)}
                              className="w-full h-11 rounded-xl bg-[#7F1D1D] hover:bg-[#991B1B] px-5 text-xs text-white font-semibold shadow-md shadow-red-950/40 transition-all cursor-pointer"
                            >
                              Confirm Delivery Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
