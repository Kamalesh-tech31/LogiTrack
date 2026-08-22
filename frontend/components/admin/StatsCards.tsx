"use client";

import { Users, Clock3, CheckCircle2, XCircle } from "lucide-react";

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
      title: "Total Registered Users",
      value: totalUsers,
      icon: Users,
      iconColor: "text-[#EF4444]",
      badgeBg: "bg-[#7F1D1D]/20",
      badgeBorder: "border-[#7F1D1D]",
      subtext: "Across all system roles",
    },
    {
      title: "Pending Verifications",
      value: pendingUsers,
      icon: Clock3,
      iconColor: "text-yellow-400",
      badgeBg: "bg-yellow-500/10",
      badgeBorder: "border-yellow-500/30",
      subtext: "Awaiting document review",
    },
    {
      title: "Approved Accounts",
      value: approvedUsers,
      icon: CheckCircle2,
      iconColor: "text-green-400",
      badgeBg: "bg-green-500/10",
      badgeBorder: "border-green-500/30",
      subtext: "Active & authenticated",
    },
    {
      title: "Rejected Registrations",
      value: rejectedUsers,
      icon: XCircle,
      iconColor: "text-red-400",
      badgeBg: "bg-red-500/10",
      badgeBorder: "border-red-500/30",
      subtext: "Failed compliance checks",
    },
  ];

  return (
    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="bg-[#111111] border border-neutral-900 rounded-3xl p-6 hover:border-[#7F1D1D] transition-all duration-300 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm font-medium">
                  {card.title}
                </p>
                <h2 className="text-3xl font-bold text-white mt-3">
                  {card.value}
                </h2>
              </div>

              <div
                className={`w-14 h-14 rounded-2xl ${card.badgeBg} border ${card.badgeBorder} flex items-center justify-center ${card.iconColor}`}
              >
                <Icon size={26} />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-900/80">
              <span className="text-neutral-500 text-xs font-medium">
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}