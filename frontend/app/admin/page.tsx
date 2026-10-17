"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Clock3, RefreshCw, CheckCircle2, FileCheck } from "lucide-react";
import StatsCards from "@/components/admin/StatsCards";
import PendingUserCard from "@/components/admin/PendingUserCard";
import {
  fetchAdminStats,
  fetchAdminPendingUsers,
  approveAdminUser,
  rejectAdminUser,
  updateAdminDocumentStatus,
  type AdminStats,
  type AdminUser,
} from "@/lib/api";

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    pendingUsers: 0,
    approvedUsers: 0,
    rejectedUsers: 0,
  });

  async function loadData() {
    try {
      const [pendingUsersData, statsData] = await Promise.all([
        fetchAdminPendingUsers(),
        fetchAdminStats(),
      ]);

      setUsers(Array.isArray(pendingUsersData) ? pendingUsersData : []);
      setStats(
        statsData || {
          totalUsers: 0,
          pendingUsers: 0,
          approvedUsers: 0,
          rejectedUsers: 0,
        }
      );
    } catch (error: any) {
      console.error("Admin loadData error:", error);
      toast.error(error?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  async function handleApproveUser(id: string) {
    try {
      const res = await approveAdminUser(id);
      toast.success(res.message || "User approved successfully!");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to approve user.");
    }
  }

  async function handleRejectUser(id: string, reason: string) {
    try {
      const res = await rejectAdminUser(id, reason);
      toast.success(res.message || "User registration rejected.");
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to reject user.");
    }
  }

  async function handleUpdateDocument(
    userId: string,
    documentName: "aadhaar" | "drivingLicense" | "gstCertificate" | "shopLicense",
    status: "approved" | "rejected",
    rejectionReason?: string
  ) {
    try {
      const res = await updateAdminDocumentStatus(
        userId,
        documentName,
        status,
        rejectionReason
      );
      toast.success(res.message || `Document marked as ${status}.`);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update document status.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#A1A1AA] text-sm">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">
            Admin Overview
          </h1>
          <p className="text-[#A1A1AA] text-sm mt-1.5">
            Monitor registration metrics, review pending KYC applications, and manage permissions.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-[#1A1B1E] hover:bg-[#2A2B30] text-[#A1A1AA] hover:text-white border border-[#2A2B30] rounded-2xl text-xs font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Metric Tiles */}
      <StatsCards
        totalUsers={stats.totalUsers}
        pendingUsers={stats.pendingUsers}
        approvedUsers={stats.approvedUsers}
        rejectedUsers={stats.rejectedUsers}
      />

      {/* Pending Verifications Queue */}
      <div className="space-y-6 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
              <Clock3 size={18} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#F4F4F5]">
                Pending KYC Applications
              </h2>
              <p className="text-[#A1A1AA] text-xs mt-0.5">
                {users.length} account{users.length === 1 ? "" : "s"} waiting for manual document verification
              </p>
            </div>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-semibold text-white">
              All Registrations Processed
            </h3>
            <p className="text-neutral-500 text-sm mt-2 max-w-md mx-auto">
              There are no accounts currently pending KYC verification. New business owner and delivery agent submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {users.map((user) => (
              <PendingUserCard
                key={user._id}
                user={user}
                onApprove={() => handleApproveUser(user._id)}
                onReject={(reason) => handleRejectUser(user._id, reason)}
                onDocumentUpdate={(documentName, status, reason) =>
                  handleUpdateDocument(user._id, documentName, status, reason)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}