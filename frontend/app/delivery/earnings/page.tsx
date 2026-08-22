"use client";

import { useEffect, useState } from "react";
import { Coins, TrendingUp, Award, CheckCircle2, Zap } from "lucide-react";

import StatsCard from "@/components/delivery/StatsCard";
import type { EarningsResponse } from "@/lib/api";
import { fetchEarnings } from "@/lib/api";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEarnings() {
      try {
        const data = await fetchEarnings();

        if (isMounted) {
          setEarnings(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load earnings data.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadEarnings();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
          Revenue Tracker
        </p>
        <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
          Earnings & Incentives
        </h1>
        <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
          Comprehensive breakdown of your delivery payouts, premium route bonuses, and incentive milestones.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316] mb-3 animate-pulse">
            <Coins size={20} />
          </div>
          <p className="text-sm font-medium text-white">Calculating earnings & payouts...</p>
        </div>
      ) : error || !earnings ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || "Unable to load earnings data. Please try again later."}
        </div>
      ) : (
        <>
          {/* Top Metrics Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <StatsCard
              title="Total Net Payout"
              value={`₹${earnings.totalWithBonus ?? earnings.earned}`}
              description="Net compensation including base fees and bonuses"
              icon={Coins}
            />
            <StatsCard
              title="Fulfilled Dispatches"
              value={String(earnings.orders)}
              description="Total completed customer handoffs"
              icon={TrendingUp}
            />
            <StatsCard
              title="Milestone Bonuses"
              value={`₹${earnings.bonus || 0}`}
              description="Performance bonuses accrued this cycle"
              icon={Award}
            />
          </div>

          {/* Main Content Grid: Payout Summary & Incentives */}
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            {/* Payout & Rate Card */}
            <div className="bg-[#1A1B1E] rounded-3xl border border-[#2A2B30] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Settlement Breakdown
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Itemized breakdown of base delivery fees and performance incentives
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F97316]/10 text-[#F97316]">
                    <Zap size={16} />
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Base Delivery Pay</p>
                    <p className="text-2xl font-extrabold text-white font-display mt-1.5">
                      ₹{earnings.earned}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA] mt-1">From {earnings.orders} completed deliveries</p>
                  </div>

                  <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#A1A1AA] font-semibold">Performance Bonus</p>
                    <p className="text-2xl font-extrabold text-[#FDBA74] font-display mt-1.5">
                      +₹{earnings.bonus || 0}
                    </p>
                    <p className="text-[10px] text-[#A1A1AA] mt-1">Milestone tier rewards</p>
                  </div>

                  <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/10 p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#FDBA74] font-semibold">Net Payout</p>
                    <p className="text-2xl font-extrabold text-[#F97316] font-display mt-1.5">
                      ₹{earnings.totalWithBonus ?? earnings.earned}
                    </p>
                    <p className="text-[10px] text-[#FDBA74]/80 mt-1">Base + bonus combined</p>
                  </div>
                </div>
              </div>

              {/* Rate Rules Tier */}
              {earnings.meta && (
                <div className="mt-6 rounded-2xl border border-[#2A2B30] bg-[#111214] p-4">
                  <p className="text-xs font-bold text-white">Rate Structure & Tiers</p>
                  <div className="mt-2 space-y-1 text-xs text-[#A1A1AA]">
                    <p>• Base fee: ₹{earnings.meta.perOrderBase} per fulfilled delivery</p>
                    <p>• High-value bonus: ₹{earnings.meta.perOrderPremium} for orders above ₹{earnings.meta.premiumThreshold}</p>
                    {earnings.meta.bonusPerStep && (
                      <p>• Milestone reward: ₹{earnings.meta.bonusPerStep} for every ₹{earnings.meta.bonusStep} generated</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Incentives Card */}
            <div className="bg-[#1A1B1E] rounded-3xl border border-[#2A2B30] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#2A2B30]/60">
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Active Milestones
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Earn extra payouts by hitting delivery goals
                    </p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                    <CheckCircle2 size={16} />
                  </div>
                </div>

                {earnings.incentives && earnings.incentives.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {earnings.incentives.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between rounded-2xl border border-[#2A2B30] bg-[#111214] px-4 py-3.5 hover:border-[#F97316]/40 transition"
                      >
                        <span className="text-xs font-medium text-[#F4F4F5]">
                          {item.label}
                        </span>
                        <span className="text-xs font-bold text-[#FDBA74] px-2.5 py-1 rounded-full bg-[#1A1B1E] border border-[#2A2B30]">
                          {item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#A1A1AA]">
                    <Award size={24} className="mx-auto mb-2 opacity-40 text-[#F97316]" />
                    <p>All active milestones currently unlocked</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-[#2A2B30]/60 text-right">
                <span className="text-[11px] text-[#A1A1AA]">
                  Payouts reconciled daily at 23:59 UTC
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
