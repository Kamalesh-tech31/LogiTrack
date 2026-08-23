"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, RefreshCw, CheckCircle2 } from "lucide-react";
import PendingUserCard from "@/components/admin/PendingUserCard";
import {
  fetchAdminPendingUsers,
  approveAdminUser,
  rejectAdminUser,
  updateAdminDocumentStatus,
  updateAdminLocationStatus,
  type AdminUser,
} from "@/lib/api";

export default function PendingUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadUsers() {
    try {
      const data = await fetchAdminPendingUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch pending users:", error);
      toast.error(error?.message || "Failed to load pending users.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUsers();
  };

  async function handleApprove(id: string) {
    try {
      const res = await approveAdminUser(id);
      toast.success(res.message || "User approved successfully!");
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve user.");
    }
  }

  async function handleReject(id: string, reason: string) {
    try {
      const res = await rejectAdminUser(id, reason);
      toast.success(res.message || "User registration rejected.");
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject user.");
    }
  }

  async function handleUpdateDocument(
    userId: string,
    documentName: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense",
    status: "approved" | "rejected",
    reason?: string
  ) {
    try {
      const res = await updateAdminDocumentStatus(
        userId,
        documentName,
        status,
        reason
      );
      toast.success(res.message || `Document marked as ${status}.`);
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update document.");
    }
  }

  async function handleUpdateLocation(
    userId: string,
    status: "approved" | "rejected",
    reason?: string
  ) {
    try {
      const res = await updateAdminLocationStatus(userId, status, reason);
      toast.success(res.message || `Business location marked as ${status}.`);
      loadUsers();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update location status.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A1A1AA] text-sm">Loading pending registrations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Pending KYC Applications
            </h1>
            <span className="px-3 py-1 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold">
              {users.length} Pending
            </span>
          </div>
          <p className="text-[#A1A1AA] text-sm mt-1.5">
            Review submitted government IDs and business licenses before authorizing accounts.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1B1E] hover:bg-[#2A2B30] text-[#A1A1AA] hover:text-white border border-[#2A2B30] rounded-2xl text-xs font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* List / Empty State */}
      {users.length === 0 ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white">
            Queue is Empty
          </h3>
          <p className="text-neutral-500 text-sm mt-2 max-w-md mx-auto">
            All submitted applications have been reviewed. New registrations will automatically appear in this queue.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {users.map((user) => (
            <PendingUserCard
              key={user._id}
              user={user}
              onApprove={() => handleApprove(user._id)}
              onReject={(reason) => handleReject(user._id, reason)}
              onDocumentUpdate={(documentName, status, reason) =>
                handleUpdateDocument(user._id, documentName, status, reason)
              }
              onLocationUpdate={(status, reason) =>
                handleUpdateLocation(user._id, status, reason)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}