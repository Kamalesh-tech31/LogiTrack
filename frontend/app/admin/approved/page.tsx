"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, RefreshCw, Users } from "lucide-react";
import ApprovedUserCard from "@/components/admin/ApprovedUserCard";
import { fetchAdminApprovedUsers, type AdminUser } from "@/lib/api";

export default function ApprovedUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadUsers() {
    try {
      const data = await fetchAdminApprovedUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Failed to fetch approved users:", error);
      toast.error(error?.message || "Failed to load approved users.");
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-2 border-[#7F1D1D] border-t-transparent rounded-full animate-spin" />
        <p className="text-neutral-500 text-sm">Loading approved accounts...</p>
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
              Approved Accounts
            </h1>
            <span className="px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
              {users.length} Active
            </span>
          </div>
          <p className="text-neutral-400 text-sm mt-1.5">
            Verified Business Owners and Delivery Agents with active platform privileges.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-[#16131A] hover:bg-[#221c27] text-neutral-300 hover:text-white border border-neutral-800 rounded-2xl text-xs font-medium transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* List / Empty State */}
      {users.length === 0 ? (
        <div className="rounded-3xl border border-neutral-900 bg-[#111111] p-12 text-center shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 mx-auto mb-4">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-semibold text-white">
            No Approved Accounts Found
          </h3>
          <p className="text-neutral-500 text-sm mt-2 max-w-md mx-auto">
            Once pending accounts are verified and approved, their records and credentials will be indexed here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {users.map((user) => (
            <ApprovedUserCard key={user._id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}