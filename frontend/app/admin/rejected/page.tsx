"use client";

import { useEffect, useState } from "react";
import RejectedUserCard from "@/components/admin/RejectedUserCard";

export default function RejectedUsersPage() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        async function loadUsers() {
            const response = await fetch(
                "http://localhost:5000/api/admin/rejected"
            );

            const data = await response.json();
            setUsers(data);
        }

        loadUsers();
    }, []);

    return (
        <main className="min-h-screen bg-[#0B0B0B] text-white p-8">
            <h1 className="text-5xl font-bold mb-3">
                Rejected Users
            </h1>

            <p className="text-gray-400 mb-10">
                All rejected registrations.
            </p>

            {users.length === 0 ? (
                <div className="rounded-3xl border border-[#27272A] bg-[#111111] p-12 text-center">
                    <h2 className="text-2xl text-gray-300">
                        No Rejected Users
                    </h2>
                </div>
            ) : (
                <div className="space-y-8">
                        {users.map((user) => (
                            <RejectedUserCard
                                key={user._id}
                                user={user}
                            />
                        ))}
                </div>
            )}
        </main>
    );
}