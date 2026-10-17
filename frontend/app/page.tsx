"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  MapPin,
  Package,
  Activity,
  Layers,
  FileCheck2,
  KeyRound,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Radio,
} from "lucide-react";
import { VehicleAnimation } from "@/components/landing/VehicleAnimation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#111214] text-[#F4F4F5] selection:bg-[#F97316]/30 selection:text-white relative overflow-x-hidden">
      {/* Full-Page Background Logistics Dot Grid Texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-20 bg-[radial-gradient(#3A3D45_1px,transparent_1px)] [background-size:28px_28px] z-0"
      />

      {/* ---------------------------------------------------- */}
      {/* 1. TOP STICKY NAVIGATION BAR                          */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 w-full border-b border-[#2A2B30]/90 bg-[#111214]/85 backdrop-blur-xl transition-all">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316] shadow-[0_0_15px_rgba(249,115,22,0.2)] group-hover:border-[#F97316]/60 transition-all">
              <Truck size={20} className="transform -rotate-6 group-hover:rotate-0 transition-transform" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Logi<span className="text-[#F97316]">Track</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A1A1AA]">
            <a href="#roles" className="hover:text-white transition-colors">
              Role Portals
            </a>
            <a href="#telemetry" className="hover:text-white transition-colors">
              Live Telemetry
            </a>
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded-2xl px-5 py-2.5 text-sm font-semibold text-[#F4F4F5] hover:text-white hover:bg-[#1A1B1E] border border-transparent hover:border-[#2A2B30] transition-all cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-2 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all cursor-pointer hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* ---------------------------------------------------- */}
      {/* 2. EXPANSIVE HERO SECTION (ZERO TEXT OVERLAP)         */}
      {/* ---------------------------------------------------- */}
      <section className="relative min-h-[920px] flex items-center justify-center px-6 lg:px-8 pt-28 pb-32 overflow-hidden">
        {/* Multi-Layered Orange Ambient Light Sources */}
        <div className="pointer-events-none absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[580px] bg-[#F97316]/16 rounded-full blur-[170px] z-0" />
        <div className="pointer-events-none absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-[#FDBA74]/12 rounded-full blur-[110px] z-0" />
        <div className="pointer-events-none absolute top-10 right-10 w-[450px] h-[250px] bg-[#F97316]/10 rounded-full blur-[140px] z-0" />
        <div className="pointer-events-none absolute bottom-10 left-10 w-[400px] h-[250px] bg-[#FDBA74]/8 rounded-full blur-[130px] z-0" />

        {/* Ambient Floating Vehicles & Road Network Grid (Peripheral Only) */}
        <VehicleAnimation />

        {/* Hero Content Container (Undisputed Central Safe Zone) */}
        <div className="relative z-10 mx-auto max-w-4xl text-center space-y-10 sm:space-y-12 my-auto">
          {/* Overline Release Badge */}
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#2A2B30] bg-[#1A1B1E]/95 px-5 py-2.5 text-xs font-semibold text-[#FDBA74] backdrop-blur-md shadow-md">
              <span className="flex h-2 w-2 rounded-full bg-[#F97316] animate-pulse" />
              <span>LogiTrack 2.0 • Autonomous Fleet Orchestration</span>
              <span className="text-[#A1A1AA]">|</span>
              <a href="#roles" className="text-[#A1A1AA] hover:text-white flex items-center gap-1 cursor-pointer">
                Explore Roles <ChevronRight size={12} />
              </a>
            </div>
          </div>

          {/* Main H1 Headline with generous line-height and letter-spacing */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.16]">
            Intelligent Supply Chain & <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-white via-[#F4F4F5] to-[#FDBA74] bg-clip-text text-transparent">
              Precision Fleet Logistics
            </span>
          </h1>

          {/* Subtitle with increased breathing space */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-[#A1A1AA] leading-relaxed mt-2">
            Unify real-time GPS telemetry, inventory intelligence, and OTP-verified
            dispatching in one high-velocity operating system built for modern commerce.
          </p>

          {/* Dual Call-To-Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-3">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] px-9 py-4.5 text-base font-bold text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all cursor-pointer hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] active:scale-[0.98]"
            >
              <span>Start Free Dispatch</span>
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-[#1A1B1E] hover:bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 px-9 py-4.5 text-base font-semibold text-[#F4F4F5] hover:text-white transition-all cursor-pointer"
            >
              <Zap size={18} className="text-[#F97316]" />
              <span>Explore Live Portals</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 3. LIVE DEMO TELEMETRY & STATS TICKER                */}
      {/* ---------------------------------------------------- */}
      <section id="telemetry" className="relative z-20 border-y border-[#2A2B30] bg-[#1A1B1E]/70 backdrop-blur-md py-12 px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Visual Framing Micro-Label */}
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#2A2B30]/60">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F97316]/20 text-[#F97316]">
                <Radio size={14} className="animate-pulse" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#FDBA74]">
                LIVE DEMO TELEMETRY • REAL-TIME FLEET SIMULATION
              </span>
            </div>
            <span className="text-xs font-mono text-[#A1A1AA] hidden sm:inline-block">
              NODE SYNC: ACTIVE (STABLE)
            </span>
          </div>

          {/* Telemetry Stat Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-6 shadow-sm hover:border-[#F97316]/40 transition-colors">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Fulfillment Rate</p>
              <p className="mt-2 text-4xl font-extrabold text-white">99.8%</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#22C55E]">
                <Activity size={14} />
                <span>+2.4% over benchmark</span>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-6 shadow-sm hover:border-[#F97316]/40 transition-colors">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Dispatch Latency</p>
              <p className="mt-2 text-4xl font-extrabold text-[#F97316]">&lt; 4.2 min</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#A1A1AA]">
                <Zap size={14} className="text-[#F97316]" />
                <span>Sub-second GPS ping</span>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-6 shadow-sm hover:border-[#F97316]/40 transition-colors">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Verified Drivers</p>
              <p className="mt-2 text-4xl font-extrabold text-white">100% KYC</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#FDBA74]">
                <ShieldCheck size={14} />
                <span>Cloudinary doc-verified</span>
              </div>
            </div>

            <div className="rounded-3xl border border-[#2A2B30] bg-[#111214] p-6 shadow-sm hover:border-[#F97316]/40 transition-colors">
              <p className="text-xs uppercase tracking-wider text-[#A1A1AA] font-mono">Delivery Assurance</p>
              <p className="mt-2 text-4xl font-extrabold text-white">6-Digit OTP</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#22C55E]">
                <CheckCircle2 size={14} />
                <span>Zero-loss package handover</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 4. BALANCED THREE-WAY ROLE EXPERIENCE MATRIX          */}
      {/* ---------------------------------------------------- */}
      <section id="roles" className="py-24 px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#F97316] font-mono font-semibold">
              ROLE-BASED ORCHESTRATION
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              One Unified Engine. Three Specialized Portals.
            </h2>
            <p className="text-base sm:text-lg text-[#A1A1AA]">
              LogiTrack provides custom workflows tailored directly to Business Owners,
              Delivery Agents, and End-Customers.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Role 1: Business Owner */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 flex flex-col justify-between hover:border-[#F97316]/60 transition-all group shadow-sm relative">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] group-hover:scale-105 transition-transform">
                    <Layers size={28} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#FDBA74] bg-[#111214] border border-[#2A2B30] px-3 py-1 rounded-full">
                    FLEET & REVENUE COMMAND
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Business Owner</h3>
                  <p className="text-sm text-[#A1A1AA] mt-2">
                    Command center for inventory forecasting, fleet assignments, and business analytics.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-[#F4F4F5]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Real-time inventory restock triggers</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>30-Day revenue & sales velocity charts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Automated delivery driver dispatching</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Enter Owner Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Role 2: Delivery Agent */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 flex flex-col justify-between hover:border-[#F97316]/60 transition-all group shadow-sm relative">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] group-hover:scale-105 transition-transform">
                    <Truck size={28} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#FDBA74] bg-[#111214] border border-[#2A2B30] px-3 py-1 rounded-full">
                    LIVE DISPATCH & TELEMETRY
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Delivery Agent</h3>
                  <p className="text-sm text-[#A1A1AA] mt-2">
                    High-velocity route companion with turn-by-turn tracking and instant OTP settlement.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-[#F4F4F5]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Live GPS location sync & routing</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>6-Digit customer OTP verification</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Daily earnings & performance bonuses</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Enter Agent Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>

            {/* Role 3: Customer */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 flex flex-col justify-between hover:border-[#F97316]/60 transition-all group shadow-sm relative">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F97316]/10 border border-[#F97316]/30 text-[#F97316] group-hover:scale-105 transition-transform">
                    <Package size={28} />
                  </div>
                  <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#FDBA74] bg-[#111214] border border-[#2A2B30] px-3 py-1 rounded-full">
                    ORDER TRACKING & VERIFICATION
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white">Customer</h3>
                  <p className="text-sm text-[#A1A1AA] mt-2">
                    Transparent ordering experience with live driver tracking and secure delivery tokens.
                  </p>
                </div>

                <ul className="space-y-3 text-sm text-[#F4F4F5]">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Interactive live delivery route map</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Automated email OTP notifications</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-[#F97316] shrink-0" />
                    <span>Instant order history & spending trends</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-sm font-bold text-white transition-all shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] active:scale-[0.98] cursor-pointer"
                >
                  <span>Enter Customer Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 5. DEEP PLATFORM CAPABILITIES                         */}
      {/* ---------------------------------------------------- */}
      <section id="capabilities" className="py-24 px-6 lg:px-8 border-t border-[#2A2B30] bg-[#111214]/90 relative z-10">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <p className="text-xs uppercase tracking-widest text-[#F97316] font-mono font-semibold">
              CORE CAPABILITIES
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Engineered for Speed, Transparency & Compliance
            </h2>
            <p className="text-base sm:text-lg text-[#A1A1AA]">
              Every module is designed to eliminate friction between dispatch, driver, and destination.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Feature 1: Real-Time Radar */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 shadow-sm hover:border-[#F97316]/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                  <MapPin size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Live Fleet GPS Telemetry</h3>
                  <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">LAT/LONG STREAMING PROTOCOL</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#A1A1AA] leading-relaxed">
                Integrated OpenStreetMap and Leaflet engine calculates precise distances, driver waypoints,
                and dynamic ETAs in real-time with sub-second accuracy.
              </p>
            </div>

            {/* Feature 2: Cloudinary KYC */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 shadow-sm hover:border-[#F97316]/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                  <FileCheck2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Cloudinary KYC Verification</h3>
                  <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">SECURE DOCUMENT PIPELINE</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#A1A1AA] leading-relaxed">
                Business Owners and Delivery Agents undergo strict verification with secure cloud-stored
                GST Certificates, Shop Licenses, and Driving Licenses before account activation.
              </p>
            </div>

            {/* Feature 3: OTP Protocol */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 shadow-sm hover:border-[#F97316]/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                  <KeyRound size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Zero-Trust OTP Handover</h3>
                  <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">CRYPTOGRAPHIC VERIFICATION</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#A1A1AA] leading-relaxed">
                Orders cannot be marked delivered without customer-side 6-digit OTP confirmation,
                preventing false completions and eliminating delivery disputes.
              </p>
            </div>

            {/* Feature 4: Role Analytics */}
            <div className="rounded-3xl border border-[#2A2B30] bg-[#1A1B1E] p-8 shadow-sm hover:border-[#F97316]/50 transition-all">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316]/10 text-[#F97316]">
                  <BarChart3 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Interactive Recharts Analytics</h3>
                  <p className="text-xs font-mono text-[#A1A1AA] mt-0.5">REAL-TIME BUSINESS INTELLIGENCE</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#A1A1AA] leading-relaxed">
                Visual revenue curves, product sales distribution, inventory status indicators,
                and performance bonus tiers rendered in high-performance vector visualizations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 6. BOTTOM CONVERSION CTA BANNER                       */}
      {/* ---------------------------------------------------- */}
      <section className="py-20 px-6 lg:px-8 relative overflow-hidden z-10">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-[2.5rem] border border-[#2A2B30] bg-gradient-to-b from-[#1A1B1E] to-[#111214] p-10 sm:p-16 text-center overflow-hidden shadow-2xl">
            {/* Background Orange Radial Glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#F97316]/20 rounded-full blur-[110px]" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#F97316]/30 bg-[#F97316]/10 px-4 py-1.5 text-xs font-semibold text-[#FDBA74]">
                <Sparkles size={14} />
                <span>Ready to Modernize Your Fleet?</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
                Launch Your Logistics Engine in Minutes
              </h2>

              <p className="text-base sm:text-lg text-[#A1A1AA]">
                Join verified business owners and delivery agents across the country.
                No complex setup, zero hardware requirements.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] px-8 py-4 text-base font-bold text-white shadow-[0_0_25px_rgba(249,115,22,0.4)] transition-all cursor-pointer hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] active:scale-[0.98]"
                >
                  <span>Create Free Account</span>
                  <ArrowRight size={18} />
                </Link>

                <Link
                  href="/login"
                  className="w-full sm:w-auto rounded-2xl bg-[#111214] border border-[#2A2B30] hover:border-[#F97316]/50 px-8 py-4 text-base font-semibold text-[#F4F4F5] hover:text-white transition-all cursor-pointer"
                >
                  Sign In to Existing Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* 7. GLOBAL FOOTER                                      */}
      {/* ---------------------------------------------------- */}
      <footer className="border-t border-[#2A2B30] bg-[#111214] py-12 px-6 lg:px-8 text-sm text-[#A1A1AA] relative z-10">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1A1B1E] border border-[#2A2B30] text-[#F97316]">
              <Truck size={16} />
            </div>
            <span className="text-lg font-bold text-white">
              Logi<span className="text-[#F97316]">Track</span>
            </span>
            <span className="text-xs text-[#A1A1AA]/60 ml-2">
              © {new Date().getFullYear()} LogiTrack Inc. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <Link href="/login" className="hover:text-white transition-colors">
              Owner Portal
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Agent Portal
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Customer Portal
            </Link>
            <Link href="/admin" className="hover:text-[#F97316] transition-colors">
              Admin Gateway
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#22C55E] animate-pulse" />
            <span className="text-xs font-mono text-[#A1A1AA]">
              ALL SYSTEMS OPERATIONAL
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
