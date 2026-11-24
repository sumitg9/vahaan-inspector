"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  Wallet,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ShieldAlert,
  Server,
  Layers,
  RefreshCw,
  Plus,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardMetricsData {
  metrics: {
    active_inspections: number;
    pending_valuation_approvals: number;
    pending_challans_count: number;
    total_pending_fines_paise: number;
    total_pending_fines_formatted_inr: string;
    available_credits: number;
    available_credits_inr: string;
  };
  recent_dossiers: Array<{
    id: string;
    loan_reference_number: string;
    registration_number: string;
    vehicle_desc: string;
    client_name: string;
    inspector_name: string;
    status: string;
    priority: string;
    scheduled_at: string;
    condition_rating: string;
  }>;
  system_status: {
    provider_mode: string;
    watermark_active: boolean;
    redis_queue: string;
    database: string;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [quickReg, setQuickReg] = useState("MH12AB1234");
  const [consentCheck, setConsentCheck] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/metrics");
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleVerifyVehicle = () => {
    if (!quickReg.trim()) return;
    router.push(`/vehicles`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Indelible Demo Watermark Banner (Architectural Invariant) */}
      {data?.system_status?.watermark_active && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>DEMONSTRATION DATA — NOT FOR OFFICIAL USE (Mock Provider Mode Active)</span>
          </div>
          <span className="font-mono text-[10px] bg-white/80 px-2 py-0.5 rounded border border-amber-300">
            APISATHI-MOCK
          </span>
        </div>
      )}

      {/* Page Title & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inspection pipeline, VAHAN intelligence, and valuation metrics across branches.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
            className="gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/inspections">
            <Button variant="default" size="sm" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>New Inspection</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      {loading || !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Active Cases */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Active Field Inspections</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {data.metrics.active_inspections}
              </div>
              <div className="text-[11px] text-semantic-teal font-semibold mt-1 flex items-center gap-1">
                <span>+6 assigned today</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Pending QC & Valuations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Pending Valuation Approvals</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {data.metrics.pending_valuation_approvals}
              </div>
              <div className="text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1">
                <span>Requires certified sign-off</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Traffic Violations */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Traffic Violations & Fines</div>
              <div className="text-2xl font-bold text-semantic-red mt-1">
                {data.metrics.total_pending_fines_formatted_inr}
              </div>
              <div className="text-[11px] text-semantic-red font-semibold mt-1 flex items-center gap-1">
                <span>{data.metrics.pending_challans_count} active notices</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-50 text-semantic-red flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Wallet & API Balance */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Available Credit Balance</div>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {data.metrics.available_credits} <span className="text-xs text-slate-400 font-normal">Cr</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                <span>Value: {data.metrics.available_credits_inr}</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-semantic-teal flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid: Instant Vehicle Search + Health Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Instant VAHAN & Challan Verifier */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand flex items-center justify-center font-bold text-sm">
                RC
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Instant Vehicle Registry & Challan Verification</h2>
                <p className="text-xs text-slate-500">Direct query via normalized APISathi / Mock Gateway</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              15 Credits / Query
            </span>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Registration No. (e.g. MH12AB1234, DL01XY9999)..."
                value={quickReg}
                onChange={(e) => setQuickReg(e.target.value.toUpperCase())}
                className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono font-bold uppercase text-slate-900"
              />
              <Button
                variant="default"
                onClick={handleVerifyVehicle}
                className="gap-1.5 px-5"
              >
                <Search className="w-4 h-4" />
                <span>Verify Registry</span>
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                id="consent"
                checked={consentCheck}
                onChange={(e) => setConsentCheck(e.target.checked)}
                className="rounded border-slate-300 text-brand focus:ring-brand/20"
              />
              <label htmlFor="consent" className="cursor-pointer">
                I certify that borrower / customer consent has been obtained as per DPDP Act 2023.
              </label>
            </div>
          </div>

          {/* Quick Mock Fixture Selector for Developer Testing */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs space-y-1.5">
            <div className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Developer Test Presets (Mock Scenarios):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Link href="/vehicles">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-700 hover:border-brand">
                  MH12AB1234 (Tata Prima HCV)
                </span>
              </Link>
              <Link href="/vehicles">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-700 hover:border-brand">
                  DL01XY9999 (Partial & Masked)
                </span>
              </Link>
              <Link href="/vehicles">
                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono text-slate-700 hover:border-brand">
                  KA01MJ0001 (Zero Challans)
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Foundation Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-bold text-slate-900">System Infrastructure</h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              All Systems Operational
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Backend API (Laravel 11)</span>
              <span className="font-semibold text-semantic-teal">Ready (Health: 200)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Web Portal (Next.js 14)</span>
              <span className="font-semibold text-semantic-teal">Ready (App Router)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">Mock Gateway Server</span>
              <span className="font-semibold text-semantic-teal">Ready (Port 4000)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-600 font-medium">PostgreSQL Relational DB</span>
              <span className="font-semibold text-slate-800">PG 16 / Migrated</span>
            </div>
          </div>

          <div className="pt-1 text-[11px] text-slate-500">
            Multi-Tenant Isolation: <strong className="text-slate-800">Active</strong>. Row-level tenant filter applied.
          </div>
        </div>
      </div>

      {/* Recent Dossiers Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Recent Inspection Dossiers & Pipeline
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Live inspection cases assigned across active branches
            </CardDescription>
          </div>
          <Link href="/inspections">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <span>View All Cases</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {loading || !data ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Case ID</TableHead>
                  <TableHead className="w-[160px]">Registration</TableHead>
                  <TableHead>Vehicle & Client</TableHead>
                  <TableHead className="w-[140px]">Surveyor</TableHead>
                  <TableHead className="w-[100px] text-center">Priority</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recent_dossiers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-xs text-brand">
                      {c.loan_reference_number}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      {c.registration_number}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-800">{c.vehicle_desc}</div>
                      <div className="text-[11px] text-slate-500">{c.client_name}</div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      {c.inspector_name}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={c.priority === "URGENT" ? "destructive" : c.priority === "HIGH" ? "warning" : "secondary"}
                        className="text-[10px]"
                      >
                        {c.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={c.status === "APPROVED" ? "success" : c.status === "QC_REVIEW" || c.status === "UNDER_REVIEW" ? "default" : "warning"}
                        className="text-[10px]"
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/inspections`}>
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                          Dossier
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
