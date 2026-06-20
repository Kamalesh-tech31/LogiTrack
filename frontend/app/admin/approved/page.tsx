"use client";

import { useEffect, useState } from "react";
import ApprovedUserCard from "@/components/admin/ApprovedUserCard";



export default function ApprovedUsersPage() {
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        async function loadUsers() {
            const response = await fetch(
                "http://localhost:5000/api/admin/approved"
            );

            const data = await response.json();
            setUsers(data);
        }

        loadUsers();
    }, []);

    return (
        <main className="min-h-screen bg-[#0B0B0B] text-white p-8">
            <h1 className="text-5xl font-bold mb-3">
                Approved Users
            </h1>

            <p className="text-gray-400 mb-10">
                All approved registrations.
            </p>

            <div className="space-y-8">
                {users.map((user) => (
                    <ApprovedUserCard
                        key={user._id}
                        user={user}
                    />
                ))}
            </div>
        </main>
    );
}