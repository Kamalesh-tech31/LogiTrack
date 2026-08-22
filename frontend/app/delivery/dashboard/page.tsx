"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Truck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

import DeliveryCard from "@/components/delivery/DeliveryCard";
import StatsCard from "@/components/delivery/StatsCard";
import type { DeliveryRecord } from "@/components/delivery/deliveryData";
import { fetchDashboard } from "@/lib/api";

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<{
    activeDeliveries: number;
    completedDeliveries: number;
    followUps: number;
    avgEta: string;
    routeUpdates: number;
    activeRoutes: DeliveryRecord[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchDashboard();

        if (isMounted) {
          setDashboard(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load dashboard data.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeRoutesSafe = dashboard?.activeRoutes ?? [];
  const failedRoutes =
    activeRoutesSafe.filter((route) => route.status === "Failed Attempt")
      .length ?? 0;
  const pendingRoutes =
    activeRoutesSafe.filter((route) => route.status === "Pending").length ?? 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {isLoading ? (
        <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-12 text-center text-[#A1A1AA]">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#F97316] mb-3 animate-pulse">
            <Truck size={20} />
          </div>
          <p className="text-sm font-medium text-white">Loading dashboard metrics...</p>
          <p className="text-xs text-[#A1A1AA] mt-1">Synchronizing active routes</p>
        </div>
      ) : error || !dashboard ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-red-300">
          {error || "Unable to load dashboard overview. Please check connection."}
        </div>
      ) : (
        <>
          {/* Header & Stats Cards */}
          <section className="space-y-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#A1A1AA] font-mono">
                Fleet Operations
              </p>
              <h1 className="text-3xl font-extrabold text-white font-display tracking-tight mt-1">
                Dashboard Overview
              </h1>
              <p className="text-[#A1A1AA] mt-1.5 text-sm max-w-2xl leading-relaxed">
                Real-time dispatch overview, active courier assignments, and route health metrics.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
              <StatsCard
                title="Active Routes"
                value={String(dashboard.activeDeliveries)}
                description="Live shipments currently in transit"
                trend={dashboard.activeDeliveries > 0 ? "Active" : undefined}
                icon={Truck}
              />
              <StatsCard
                title="Completed"
                value={String(dashboard.completedDeliveries)}
                description="Successful customer handoffs"
                icon={CheckCircle2}
              />
              <StatsCard
                title="Pending Actions"
                value={String(dashboard.followUps)}
                description="Dispatches awaiting agent claim"
                icon={AlertCircle}
              />
              <StatsCard
                title="Average ETA"
                value={dashboard.avgEta || "--"}
                description="Estimated time across active routes"
                icon={Package}
              />
            </div>
          </section>

          {/* Main Grid: Priority Routes & Route Health */}
          <section className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
            {/* Priority Routes Panel */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-4 pb-4 border-b border-[#2A2B30]/60">
                  <div>
                    <h2 className="text-lg font-bold text-white font-display">
                      Assigned Deliveries
                    </h2>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      Live route queue and progress tracking
                    </p>
                  </div>

                  <Link
                    href="/delivery/deliveries"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#F97316] hover:text-[#EA580C] transition cursor-pointer"
                  >
                    <span>View all</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>

                {activeRoutesSafe.length > 0 ? (
                  <div className="mt-5 space-y-4">
                    {activeRoutesSafe.map((delivery) => (
                      <DeliveryCard
                        key={delivery.id}
                        id={delivery.id}
                        customer={delivery.customer}
                        address={delivery.address}
                        eta={delivery.eta}
                        status={delivery.status}
                        priority={delivery.priority}
                        contact={delivery.contact}
                        location={delivery.location}
                        lastUpdated={delivery.lastUpdated}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="py-16 text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#111214] border border-[#2A2B30] text-[#A1A1AA] mb-3">
                      <Package size={22} />
                    </div>
                    <h3 className="text-sm font-bold text-white">No Active Deliveries</h3>
                    <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto">
                      You have no active shipments in transit. Check available dispatches to claim new orders.
                    </p>
                    <div className="mt-4">
                      <Link
                        href="/delivery/deliveries"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-4 py-2 text-xs font-bold text-white transition shadow-sm"
                      >
                        <span>Browse Available Deliveries</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Operational Snapshot / Route Health */}
            <div className="space-y-6">
              <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-6 shadow-sm">
                <div className="pb-4 border-b border-[#2A2B30]/60">
                  <h2 className="text-lg font-bold text-white font-display">
                    Route Health
                  </h2>
                  <p className="text-xs text-[#A1A1AA] mt-0.5">
                    Real-time operational distribution
                  </p>
                </div>

                <div className="mt-5 space-y-3.5">
                  <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#A1A1AA]">Active Deliveries</p>
                      <p className="text-2xl font-bold text-white font-display mt-1">
                        {dashboard.activeDeliveries}
                      </p>
                    </div>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-[#F97316] animate-pulse" />
                  </div>

                  <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#A1A1AA]">Pending Claim</p>
                      <p className="text-2xl font-bold text-white font-display mt-1">
                        {pendingRoutes}
                      </p>
                    </div>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
                  </div>

                  <div className="rounded-2xl border border-[#2A2B30] bg-[#111214] p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#A1A1AA]">Failed Attempts</p>
                      <p className="text-2xl font-bold text-white font-display mt-1">
                        {failedRoutes}
                      </p>
                    </div>
                    <span className="flex h-2.5 w-2.5 rounded-full bg-red-400" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
