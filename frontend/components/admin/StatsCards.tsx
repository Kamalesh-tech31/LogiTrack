"use client";

import {
    Users,
    Clock3,
    CheckCircle2,
    XCircle,
} from "lucide-react";

interface StatsProps {
    totalUsers: number;
    pendingUsers: number;
    approvedUsers: number;
    rejectedUsers: number;
}

export default function StatsCards({
    totalUsers,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
}: StatsProps) {

    const cards = [
        {
            title: "Total Users",
            value: totalUsers,
            icon: Users,
        },
        {
            title: "Pending",
            value: pendingUsers,
            icon: Clock3,
        },
        {
            title: "Approved",
            value: approvedUsers,
            icon: CheckCircle2,
        },
        {
            title: "Rejected",
            value: rejectedUsers,
            icon: XCircle,
        },
    ];

    return (
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.title}
                        className="rounded-3xl border border-[#27272A] bg-[#111111] p-6"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">
                                    {card.title}
                                </p>

                                <h1 className="text-4xl font-bold text-white mt-3">
                                    {card.value}
                                </h1>
                            </div>

                            <div className="rounded-2xl bg-[#7F1D1D]/20 p-4">
                                <Icon
                                    size={28}
                                    className="text-[#F87171]"
                                />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}