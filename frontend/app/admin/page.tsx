"use client";

import { useEffect, useState } from "react";

import AdminNavbar from "@/components/admin/AdminNavbar";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCards from "@/components/admin/StatsCards";
import PendingUserCard from "@/components/admin/PendingUserCard";

export default function AdminPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        pendingUsers: 0,
        approvedUsers: 0,
        rejectedUsers: 0,
    });

    async function loadUsers() {
        try {
            const response = await fetch(
                "http://localhost:5000/api/admin/pending"
            );

            const data = await response.json();

            setUsers(data);

            const statsResponse = await fetch(
                "http://localhost:5000/api/admin/stats"
            );

            const statsData = await statsResponse.json();

            setStats(statsData);

        } catch (error) {
            console.error(error);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function approveUser(id: string) {
        await fetch(
            `http://localhost:5000/api/admin/approve/${id}`,
            {
                method: "PATCH",
            }
        );

        loadUsers();
    }

    async function rejectUser(id: string) {
        await fetch(
            `http://localhost:5000/api/admin/reject/${id}`,
            {
                method: "PATCH",
            }
        );

        loadUsers();
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center">
                Loading...
            </main>
        );
    }

    async function updateDocument(
        userId: string,
        documentName: string,
        status: "approved" | "rejected"
    ) {
        let rejectionReason = "";

        if (status === "rejected") {
            rejectionReason = prompt("Enter rejection reason") || "";

            if (!rejectionReason) return;
        }

        const response = await fetch(
            `http://localhost:5000/api/admin/${userId}/document`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    documentName,
                    status,
                    rejectionReason,
                }),
            }
        );

        const data = await response.json();

        alert(data.message);

        loadUsers();
    }

    return (
        <main className="min-h-screen bg-[#0B0B0B] text-white flex">

            {/* Sidebar */}
            <AdminSidebar />

            {/* Main Area */}
            <div className="flex-1">

                {/* Top Navbar */}
                <AdminNavbar />

                <div className="p-8">

                    {/* Dashboard Header */}
                    <div className="mb-8">
                        <h1 className="text-5xl font-bold">
                            Admin Dashboard
                        </h1>

                        <p className="text-gray-400 mt-2">
                            Review and manage all pending registrations.
                        </p>
                    </div>

                    {/* Stats */}
                    <StatsCards
                        totalUsers={stats.totalUsers}
                        pendingUsers={stats.pendingUsers}
                        approvedUsers={stats.approvedUsers}
                        rejectedUsers={stats.rejectedUsers}
                    />

                    {/* Pending Users */}
                    <div className="mt-10">

                        <h2 className="text-3xl font-bold mb-8">
                            Pending Users
                        </h2>

                        {users.length === 0 ? (
                            <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-12 text-center">
                                <h2 className="text-2xl text-gray-300">
                                    No Pending Users
                                </h2>

                                <p className="text-gray-500 mt-3">
                                    All registrations have been processed.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {users.map((user) => (
                                    <PendingUserCard
                                        key={user._id}
                                        user={user}
                                        onApprove={() =>
                                            approveUser(user._id)
                                        }
                                        onReject={() =>
                                            rejectUser(user._id)
                                        }
                                        onDocumentUpdate={(documentName, status) =>
                                            updateDocument(
                                                user._id,
                                                documentName,
                                                status
                                            )
                                        }
                                />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}