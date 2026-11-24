"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Users,
  Activity,
  Layers,
  FileCheck2,
  Calculator,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Server,
  Zap,
  Lock,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
} from "lucide-react";

interface ProviderMetric {
  code: string;
  name: string;
  environment: "SANDBOX" | "TESTING" | "PRODUCTION";
  status: "HEALTHY" | "ONLINE" | "STANDBY" | "DEGRADED";
  avg_latency_ms: number;
  uptime_percentage: number;
  cost_per_query_paise: number;
  requests_today: number;
  error_rate_percentage: number;
  circuit_breaker_state: "CLOSED" | "OPEN" | "DISABLED";
}

const PROVIDERS_DATA: ProviderMetric[] = [
  {
    code: "apisathi_rc_v1",
    name: "APISathi Vehicle Registry Gateway",
    environment: "SANDBOX",
    status: "HEALTHY",
    avg_latency_ms: 142,
    uptime_percentage: 99.94,
    cost_per_query_paise: 450,
    requests_today: 1420,
    error_rate_percentage: 0.06,
    circuit_breaker_state: "CLOSED",
  },
  {
    code: "echallan_parivahan",
    name: "Parivahan eChallan Traffic Gateway",
    environment: "SANDBOX",
    status: "HEALTHY",
    avg_latency_ms: 218,
    uptime_percentage: 99.82,
    cost_per_query_paise: 250,
    requests_today: 1105,
    error_rate_percentage: 0.18,
    circuit_breaker_state: "CLOSED",
  },
  {
    code: "mock_provider_gateway",
    name: "Deterministic Mock Gateway (Failsafe Isolation)",
    environment: "TESTING",
    status: "ONLINE",
    avg_latency_ms: 24,
    uptime_percentage: 100.0,
    cost_per_query_paise: 0,
    requests_today: 3890,
    error_rate_percentage: 0.0,
    circuit_breaker_state: "DISABLED",
  },
  {
    code: "fastag_toll_intel",
    name: "NETC Fastag Toll Movement Intel",
    environment: "SANDBOX",
    status: "STANDBY",
    avg_latency_ms: 310,
    uptime_percentage: 99.5,
    cost_per_query_paise: 150,
    requests_today: 420,
    error_rate_percentage: 0.5,
    circuit_breaker_state: "CLOSED",
  },
];

export default function SuperAdminDashboardPage() {
  const [providers] = useState<ProviderMetric[]>(PROVIDERS_DATA);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Privileged Notice & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-900/60 text-purple-300 border border-purple-700/50 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Privileged Super Admin Console
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-900/40 text-blue-300 border border-blue-700/40">
              Platform Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Super Admin Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Cross-tenant system health, provider latency telemetry, operational throughput, and governance controls.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/organizations"
            className="px-3 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" /> Manage Tenants
          </Link>
          <Link
            href="/admin/providers"
            className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <Server className="w-3.5 h-3.5" /> Provider Vault
          </Link>
          <Link
            href="/admin/audit"
            className="px-3 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Security Alerts
          </Link>
        </div>
      </div>

      {/* Demonstration Data Warning Invariant */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900">
          <span className="font-bold">INVARIANT 2 ENFORCEMENT ACTIVE:</span> Platform is operating with mock providers
          isolated behind strict fail-safe boundaries. Live production mode strictly rejects mock data substitution. All
          derived reports carry the indelible watermark:{" "}
          <code className="font-mono font-bold bg-amber-100 px-1 py-0.5 rounded text-amber-800">
            DEMONSTRATION DATA — NOT FOR OFFICIAL USE
          </code>
          .
        </div>
      </div>

      {/* Top Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Organizations */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Tenants</span>
            <Building2 className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-black text-slate-900">14</div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span className="text-emerald-600 font-bold">12 Active</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">2 Trial</span>
            <span>•</span>
            <span className="text-slate-400">0 Suspended</span>
          </div>
        </div>

        {/* Total Platform Users */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Enterprise Users</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">158</div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span className="text-blue-600 font-bold">82 Field Surveyors</span>
            <span>•</span>
            <span className="text-purple-600 font-bold">34 Valuers</span>
          </div>
        </div>

        {/* Gross Valuation Telemetry */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Valuations (GMV)</span>
            <Calculator className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">₹145.20 Cr</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% monthly volume
          </div>
        </div>

        {/* Inspection Throughput */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-brand/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Inspections Delivered</span>
            <FileCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">1,210</div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
            <span className="text-teal-600 font-bold">95.8% QC Pass</span>
            <span>•</span>
            <span className="text-amber-600 font-bold">4.2% Corrections</span>
          </div>
        </div>
      </div>

      {/* Provider Health & Latency Telemetry Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-brand" /> External Provider Telemetry & Latency Budgets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live round-trip latency, uptime error budgets, and circuit breaker trip states across integrated gateways.
            </p>
          </div>
          <Link
            href="/admin/providers"
            className="text-xs font-bold text-brand hover:text-brand-hover flex items-center gap-1 self-start"
          >
            Configure Provider Vault <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.code}
              className="border border-slate-100 rounded-xl p-4 bg-slate-50/60 hover:bg-slate-50 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{p.name}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        p.status === "HEALTHY" || p.status === "ONLINE"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-blue-100 text-blue-800 border border-blue-300"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{p.code}</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {p.environment}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60 text-center">
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Latency</div>
                  <div className="text-sm font-black text-slate-800 mt-0.5">{p.avg_latency_ms} ms</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Uptime</div>
                  <div className="text-sm font-black text-emerald-600 mt-0.5">{p.uptime_percentage}%</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-100">
                  <div className="text-[10px] uppercase font-semibold text-slate-400">Circuit Breaker</div>
                  <div className="text-xs font-bold text-slate-700 mt-1">{p.circuit_breaker_state}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>
                  Cost: <strong className="text-slate-700 font-mono">₹{(p.cost_per_query_paise / 100).toFixed(2)}</strong> / lookup
                </span>
                <span>
                  Today: <strong className="text-slate-700 font-mono">{p.requests_today}</strong> calls
                </span>
                <span>
                  Error Rate: <strong className="text-slate-700 font-mono">{p.error_rate_percentage}%</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Operational Module Quick-Access Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Module 1: Organizations & Multi-Tenancy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Tenant Organizations</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provision valuation agencies, manage regional surveyor yards, configure credit balances, and enforce tenant isolation.
            </p>
          </div>
          <Link
            href="/admin/organizations"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-hover pt-1"
          >
            Manage Organizations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module 2: Users & Granular RBAC */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">User Directory & RBAC</h3>
            <p className="text-xs text-slate-500 mt-1">
              Administer field inspectors, certified valuers, branch managers, and verify privilege escalation defense rules.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 hover:text-purple-800 pt-1"
          >
            Manage User Roles <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Module 3: Feature Flags & Settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Feature Flags & Report Rules</h3>
            <p className="text-xs text-slate-500 mt-1">
              Toggle live Parivahan lookups, CMV Rule 95 tyre safety checks, report disclaimers, and watermark policies.
            </p>
          </div>
          <div className="flex items-center gap-4 pt-1">
            <Link
              href="/admin/feature-flags"
              className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
            >
              Feature Flags <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/admin/report-settings"
              className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              Report Settings <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
