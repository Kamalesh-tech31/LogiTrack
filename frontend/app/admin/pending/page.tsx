"use client";

import { useEffect, useState } from "react";
import PendingUserCard from "@/components/admin/PendingUserCard";

export default function PendingUsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadUsers() {
        try {
            const response = await fetch(
                "http://localhost:5000/api/admin/pending"
            );

            const data = await response.json();

            setUsers(data);
        } catch (error) {
            console.error(error);
        }

        setLoading(false);
    }

    useEffect(() => {
        loadUsers();
    }, []);

    async function approveUser(id: string) {
        const response = await fetch(
            `http://localhost:5000/api/admin/approve/${id}`,
            {
                method: "PATCH",
            }
        );

        const data = await response.json();

        alert(data.message);

        loadUsers();
    }

    async function rejectUser(id: string) {
        const reason = prompt("Enter rejection reason");

        if (!reason) return;

        const response = await fetch(
            `http://localhost:5000/api/admin/reject/${id}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    rejectionReason: reason,
                }),
            }
        );

        const data = await response.json();

        alert(data.message);

        loadUsers();
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

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0B0B] text-white flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#0B0B0B] text-white p-8">
            <h1 className="text-5xl font-bold mb-3">
                Pending Users
            </h1>

            <p className="text-gray-400 mb-10">
                Review and approve registrations.
            </p>

            <div className="space-y-8">
                {users.map((user) => (
                    <PendingUserCard
                        key={user._id}
                        user={user}
                        onApprove={() => approveUser(user._id)}
                        onReject={() => rejectUser(user._id)}
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
        </main>
    );
}