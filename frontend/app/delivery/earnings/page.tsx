"use client";

import { useEffect, useState } from "react";

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
    <div className="p-4 md:p-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#A1A1AA]">
          Earnings tracker
        </p>
        <h1 className="text-3xl font-bold text-white mt-2">
          Revenue performance dashboard
        </h1>
        <p className="text-[#D5D5D5] mt-3 max-w-2xl">
          Track payout momentum, premium route bonuses, and conversion-rich
          delivery performance in one premium earnings workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="mt-8 rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] p-6 text-white">
          Loading earnings data from the backend...
        </div>
      ) : error || !earnings ? (
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || "Unable to load earnings data from the backend."}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {earnings.highlights.map((item) => (
              <StatsCard
                key={item.title}
                title={item.title}
                value={item.value}
                description={item.description}
              />
            ))}
          </div>

          <div className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="bg-[#1A1B1E] rounded-2xl border border-[#2A2B30] p-5 shadow-sm">
              <p className="text-sm text-[#A1A1AA]">Performance pulse</p>
              <h2 className="text-xl font-semibold text-white mt-1">
                Backend insights
              </h2>

              <div className="mt-5 rounded-xl border border-[#2A2B30] bg-[#111214] p-4">
                <p className="text-sm text-[#F4F4F5]">
                  {earnings.highlights.length} live earnings metrics are
                  currently sourced from the backend.
                </p>
                {earnings.incentives && earnings.incentives.length > 0 && (
                  <p className="text-sm text-[#A1A1AA] mt-3">
                    {`${earnings.incentives.length} incentives are available from the latest backend state.`}
                  </p>
                )}
              </div>
            </div>

            {earnings.incentives && earnings.incentives.length > 0 && (
              <div className="bg-[#1A1B1E] rounded-2xl border border-[#2A2B30] p-5 shadow-sm">
                <p className="text-sm text-[#A1A1AA]">Incentives</p>
                <h2 className="text-xl font-semibold text-white mt-1">
                  Bonus tracker
                </h2>

                <div className="mt-5 space-y-3">
                  {earnings.incentives.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-[#2A2B30] bg-[#111214] px-4 py-3"
                    >
                      <span className="text-sm text-[#F4F4F5]">
                        {item.label}
                      </span>
                      <span className="text-sm font-semibold text-[#FDBA74]">
                        {item.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom summary */}
          <div className="mt-8 grid grid-cols-1 gap-4">
            <div className="rounded-2xl border border-[#2A2B30] bg-[#1A1B1E] p-5 text-sm text-[#F4F4F5] shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#A1A1AA]">Orders completed</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {earnings.orders}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A1A1AA]">Bonus</p>
                  <p className="text-lg font-semibold text-[#FDBA74] mt-1">
                    ₹{earnings.bonus || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#A1A1AA]">Total (with bonus)</p>
                  <p className="text-lg font-bold text-[#F97316] mt-1">
                    ₹{earnings.totalWithBonus ?? earnings.earned}
                  </p>
                </div>
              </div>
              {earnings.meta && (
                <p className="mt-3 text-xs text-[#A1A1AA]">
                  Rates: ₹{earnings.meta.perOrderBase} per order, ₹
                  {earnings.meta.perOrderPremium} for orders &gt; ₹
                  {earnings.meta.premiumThreshold}. Bonus: ₹
                  {earnings.meta.bonusPerStep} for every ₹
                  {earnings.meta.bonusStep} earned.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
