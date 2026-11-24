"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Car,
  ShieldCheck,
  Calendar,
  Fuel,
  FileCheck2,
  Building,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  Layers,
  Database,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface VehicleProfileData {
  registration_number: string;
  chassis_number: string;
  engine_number: string;
  vin_masked?: string; // DPDP masked chassis alias
  engine_number_masked?: string; // DPDP masked engine alias
  owner_name_masked: string;
  ownership_sequence: number;
  maker_model: string;
  maker_name?: string;
  model_name?: string;
  variant_name?: string;
  vehicle_class: string;
  body_type?: string;
  fuel_type: string;
  color?: string;
  emission_norms?: string;
  seating_capacity?: number;
  gross_vehicle_weight_kg?: number;
  registration_date?: string;
  manufacturing_date?: string;
  rto_code?: string;
  rto_name?: string;
  state_code?: string;
  rc_status: string;
  hypothecated: boolean;
  financier_name?: string | null;
  insurance_company?: string | null;
  insurance_policy_number?: string | null;
  insurance_valid_until?: string | null;
  fitness_valid_until?: string | null;
  tax_valid_until?: string | null;
  pucc_valid_until?: string | null;
  national_permit_number?: string | null;
  blacklist_status: string;
  is_mock_data: boolean;
  watermark?: string;
  field_provenance?: Record<string, string>;
}

interface ChallanSummaryData {
  total_challans: number;
  pending_challans_count: number;
  total_pending_formatted: string;
  total_disposed_formatted: string;
  challans: Array<{
    challan_number: string;
    offence_details: string;
    offence_date_time: string;
    fine_amount_formatted: string;
    state_code: string;
    rto_name?: string;
    challan_status: string;
  }>;
}

export default function VehicleIntelligencePage() {
  const [searchReg, setSearchReg] = useState("MH12AB1234");
  const [verificationMode, setVerificationMode] = useState<"combined" | "rc_only" | "challan_only">("combined");
  const [consentGiven, setConsentGiven] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState<{ code: string; message: string; httpStatus: number } | null>(null);

  // Response Data
  const [vehicle, setVehicle] = useState<VehicleProfileData | null>(null);
  const [challans, setChallans] = useState<ChallanSummaryData | null>(null);
  const [isCached, setIsCached] = useState(true);
  const [creditsDeducted, setCreditsDeducted] = useState(0);

  // Modals
  const [isProvenanceOpen, setIsProvenanceOpen] = useState(false);
  const [isRefreshConfirmOpen, setIsRefreshConfirmOpen] = useState(false);

  const executeLookup = async (regToSearch?: string, forceFresh = false) => {
    const reg = (regToSearch || searchReg).trim().toUpperCase();
    if (!reg) return;

    if (!consentGiven) {
      setErrorData({
        code: "CONSENT_REQUIRED",
        message: "DPDP Act 2023 Compliance: Customer / borrower consent must be certified before querying registry data.",
        httpStatus: 403,
      });
      return;
    }

    setLoading(true);
    setErrorData(null);

    try {
      const res = await fetch(`/api/vehicles/lookup?reg=${encodeURIComponent(reg)}&mode=${verificationMode}&force_fresh=${forceFresh}`);
      const json = await res.json();

      if (!res.ok || json.status === "error") {
        setErrorData({
          code: json.error_code || "PROVIDER_ERROR",
          message: json.message || "Upstream provider error occurred while contacting registry.",
          httpStatus: res.status,
        });
        setVehicle(null);
        setChallans(null);
      } else {
        const payload = json.data || json;
        setVehicle(payload.vehicle || null);
        setChallans(payload.challans || null);
        setIsCached(Boolean(payload.cached?.vehicle && !forceFresh));
        setCreditsDeducted(payload.total_credits_deducted || 0);
      }
    } catch (err: any) {
      setErrorData({
        code: "NETWORK_FAILURE",
        message: err.message || "Failed to reach vehicle intelligence gateway.",
        httpStatus: 502,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeLookup("MH12AB1234", false);
  }, [verificationMode]);

  const handlePresetClick = (preset: string) => {
    setSearchReg(preset);
    executeLookup(preset, false);
  };

  const getProvenanceBadge = (fieldKey: string) => {
    const source = vehicle?.field_provenance?.[fieldKey] || "rto_registry";
    switch (source) {
      case "rto_registry":
        return <Badge variant="success" className="text-[9px]">RTO Verified</Badge>;
      case "dpdp_masked":
        return <Badge variant="secondary" className="text-[9px]">DPDP Masked</Badge>;
      case "restricted":
        return <Badge variant="warning" className="text-[9px]">Restricted by RTO</Badge>;
      case "provider_reported":
        return <Badge variant="default" className="text-[9px]">Insurer Reported</Badge>;
      case "not_applicable":
        return <Badge variant="outline" className="text-[9px] text-slate-400">N/A</Badge>;
      case "rto_enforcement":
        return <Badge variant="destructive" className="text-[9px]">Police / Parivahan</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px]">{source}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Vehicle Intelligence & Registry Verification</span>
            <Badge variant="default" className="text-[10px]">VAHAN 4.0</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Normalized registry intelligence, traffic violations, DPDP compliance, and field-level provenance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {vehicle && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsProvenanceOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-brand" />
              <span>Field Provenance</span>
            </Button>
          )}
          <Link href="/inspections">
            <Button variant="default" size="sm" className="gap-1.5 shadow-sm">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Initiate Inspection</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Mode Selector & Search Card */}
      <Card>
        <CardContent className="p-5 space-y-4">
          {/* Verification Mode Pills */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 mr-1 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                Mode:
              </span>
              <button
                type="button"
                onClick={() => setVerificationMode("combined")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  verificationMode === "combined"
                    ? "bg-brand text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Combined Dossier (25 Cr)
              </button>
              <button
                type="button"
                onClick={() => setVerificationMode("rc_only")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  verificationMode === "rc_only"
                    ? "bg-brand text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                RC Registry Only (15 Cr)
              </button>
              <button
                type="button"
                onClick={() => setVerificationMode("challan_only")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  verificationMode === "challan_only"
                    ? "bg-brand text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Challans Only (10 Cr)
              </button>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Cached replays within 24h deduct <strong className="text-emerald-600 font-bold">0 Credits</strong>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Registration No. (e.g. MH12AB1234, DL01XY9999)..."
                value={searchReg}
                onChange={(e) => setSearchReg(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && executeLookup()}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono font-bold tracking-wider text-slate-900 uppercase"
              />
            </div>
            <Button
              variant="default"
              onClick={() => executeLookup()}
              disabled={loading}
              className="gap-2 px-6 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Querying Registry..." : "Verify Vehicle"}</span>
            </Button>
          </div>

          {/* DPDP Consent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dpdp-consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-slate-300 text-brand focus:ring-brand/20 h-4 w-4"
              />
              <label htmlFor="dpdp-consent" className="cursor-pointer select-none">
                I certify borrower/owner consent has been obtained under the{" "}
                <span className="font-semibold text-slate-800">DPDP Act 2023</span>.
              </label>
            </div>
          </div>

          {/* Test Presets & Failure Simulator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 border-t border-slate-100 text-xs gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-semibold">Standard Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetClick("MH12AB1234")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono font-semibold text-slate-700"
              >
                MH12AB1234 (Tata HCV Tipper)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("DL01XY9999")}
                className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[10px] font-mono font-semibold text-amber-800"
              >
                DL01XY9999 (Partial/Restricted)
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("KA01MJ0001")}
                className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[10px] font-mono font-semibold text-teal-800"
              >
                KA01MJ0001 (Zero Challans)
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-semantic-red font-semibold text-[11px]">Simulate Failures:</span>
              <button
                type="button"
                onClick={() => handlePresetClick("UP16AB0000")}
                className="px-1.5 py-0.5 rounded bg-red-50 text-semantic-red border border-red-200 text-[10px] font-mono"
              >
                504 Timeout
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("RJ14XY0000")}
                className="px-1.5 py-0.5 rounded bg-red-50 text-semantic-red border border-red-200 text-[10px] font-mono"
              >
                429 RateLimit
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("GJ01AB0000")}
                className="px-1.5 py-0.5 rounded bg-red-50 text-semantic-red border border-red-200 text-[10px] font-mono"
              >
                503 BalanceExhausted
              </button>
              <button
                type="button"
                onClick={() => handlePresetClick("WB02AB0000")}
                className="px-1.5 py-0.5 rounded bg-red-50 text-semantic-red border border-red-200 text-[10px] font-mono"
              >
                404 NotFound
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Error Banner */}
      {errorData && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-semantic-red space-y-1.5 shadow-sm animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-semantic-red flex-shrink-0" />
              <span>Provider Gateway Failure: [{errorData.code}] (HTTP {errorData.httpStatus})</span>
            </span>
            <span className="font-mono text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-red-200">
              FAIL-SAFE ACTIVE
            </span>
          </div>
          <p className="text-red-800">{errorData.message}</p>
          <div className="text-[11px] text-red-600 font-medium pt-1 border-t border-red-100">
            Per Architectural Invariant 2, provider timeouts or errors are never interpreted as clean vehicle records. Zero mock substitution occurs in production.
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Vehicle Dossier Display */}
      {!loading && vehicle && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Cache Notice & Duplicate Detection Banner */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            isCached
              ? "bg-slate-50 border-slate-200 text-slate-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}>
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-brand flex-shrink-0" />
              <span>
                {isCached ? (
                  <>
                    <strong>Cached Dossier Record:</strong> Vehicle verified recently. Replay served from secure cache (
                    <strong className="text-emerald-700">0 Credits Deducted</strong>).
                  </>
                ) : (
                  <>
                    <strong>Fresh Live Verification:</strong> Query executed against transport registry. Deducted{" "}
                    <strong>{creditsDeducted} Credits</strong>.
                  </>
                )}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRefreshConfirmOpen(true)}
              className="gap-1.5 h-7 text-[11px] self-start sm:self-auto bg-white"
            >
              <RefreshCw className="w-3 h-3 text-slate-500" />
              <span>Force Live Refresh</span>
            </Button>
          </div>

          {/* Primary Vehicle Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-blue-50 border border-blue-100 text-brand flex items-center justify-center font-black text-xl">
                  RC
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-slate-900 tracking-wider">
                      {vehicle.registration_number}
                    </span>
                    <Badge variant="success" className="text-[10px] uppercase">
                      {vehicle.rc_status}
                    </Badge>
                    {vehicle.hypothecated ? (
                      <Badge variant="warning" className="text-[10px]">
                        HYPOTHECATED
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        UNENCUMBERED
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base font-bold text-slate-800 mt-0.5">
                    {vehicle.maker_model} {vehicle.variant_name ? `— ${vehicle.variant_name}` : ""}
                  </h2>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
                    <span>RTO: {vehicle.rto_name || "Regional Office"} ({vehicle.rto_code || "N/A"})</span>
                    <span>•</span>
                    <span>Class: {vehicle.vehicle_class}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProvenanceOpen(true)}
                  className="gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-brand" />
                  <span>Inspect Provenance</span>
                </Button>
                <Link href={`/challans?reg=${vehicle.registration_number}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>View Challans</span>
                  </Button>
                </Link>
                <Link href={`/valuation?reg=${vehicle.registration_number}`}>
                  <Button variant="default" size="sm" className="gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Appraise Vehicle</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Indelible Watermark Notice */}
            {vehicle.watermark && (
              <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <span>
                    <strong>Data Provenance Notice:</strong> {vehicle.watermark}. All PII (Owner Name, Chassis & Engine) is masked per DPDP Act 2023.
                  </span>
                </div>
                <span className="font-mono text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                  DPDP-MASKED
                </span>
              </div>
            )}
          </div>

          {/* 3-Pillar Normalized Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Registration & Ownership Details */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-brand" />
                  <span>Registration & Ownership</span>
                </CardTitle>
                {getProvenanceBadge("owner_name")}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Owner Name (DPDP):</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {vehicle.owner_name_masked}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Ownership Sequence:</span>
                  <span className="font-semibold text-slate-800">{vehicle.ownership_sequence} Owner(s)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Registration Date:</span>
                  <span className="font-semibold text-slate-800">{vehicle.registration_date || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Manufacturing Date:</span>
                  <span className="font-semibold text-slate-800">{vehicle.manufacturing_date || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Chassis No (Masked):</span>
                  <span className="font-mono font-semibold text-slate-800">{vehicle.chassis_number}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Engine No (Masked):</span>
                  <span className="font-mono font-semibold text-slate-800">{vehicle.engine_number}</span>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Technical Specifications */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-semantic-teal" />
                  <span>Powertrain & Dimensions</span>
                </CardTitle>
                {getProvenanceBadge("maker_model")}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fuel Type:</span>
                  <span className="font-semibold text-slate-800">{vehicle.fuel_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Emission Standard:</span>
                  <span className="font-semibold text-slate-800">{vehicle.emission_norms || "BS-VI"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Body Type:</span>
                  <span className="font-semibold text-slate-800">{vehicle.body_type || "Standard"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Vehicle Color:</span>
                  <span className="font-semibold text-slate-800">{vehicle.color || "Standard"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Seating Capacity:</span>
                  <span className="font-semibold text-slate-800">{vehicle.seating_capacity || 2} Persons</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Gross Weight (GVW):</span>
                  <span className="font-semibold text-slate-800">
                    {vehicle.gross_vehicle_weight_kg ? `${vehicle.gross_vehicle_weight_kg.toLocaleString()} kg` : "N/A"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Compliance & Hypothecation */}
            <Card>
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-600" />
                  <span>Compliance & Hypothecation</span>
                </CardTitle>
                {getProvenanceBadge("fitness_valid_until")}
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">RC Fitness Valid:</span>
                  {vehicle.fitness_valid_until ? (
                    <span className="font-semibold text-semantic-teal">{vehicle.fitness_valid_until}</span>
                  ) : (
                    <span className="font-semibold text-amber-700 italic">Restricted by State RTO</span>
                  )}
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Insurance Company:</span>
                  <span className="font-semibold text-slate-800 truncate max-w-[170px]">
                    {vehicle.insurance_company || "Unavailable"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Insurance Valid Upto:</span>
                  <span className="font-semibold text-slate-800">{vehicle.insurance_valid_until || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">PUC Valid Upto:</span>
                  <span className="font-semibold text-slate-800">{vehicle.pucc_valid_until || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tax Validity:</span>
                  <span className="font-semibold text-slate-800">{vehicle.tax_valid_until || "N/A"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Hypothecated Financier:</span>
                  {vehicle.hypothecated ? (
                    <span className="font-semibold text-amber-700 truncate max-w-[170px]">{vehicle.financier_name}</span>
                  ) : vehicle.financier_name === null && vehicle.field_provenance?.financier_name === "restricted" ? (
                    <span className="font-semibold text-amber-600 italic">Restricted / Unshared</span>
                  ) : (
                    <span className="font-semibold text-slate-500">None (Unencumbered)</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combined Challan Section if Mode is Combined */}
          {verificationMode === "combined" && challans && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-100">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Traffic Violation Records (Integrated Combined Check)</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    {challans.total_challans} violation notice(s) on file for {vehicle.registration_number}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Pending Fines:</span>
                  <span className="font-mono font-bold text-sm text-semantic-red">
                    {challans.total_pending_formatted}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {challans.challans.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-semantic-teal" />
                    <span className="font-bold text-slate-800">Clean Compliance Record</span>
                    <span>No active traffic challans or pending fines recorded against this registration.</span>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Challan No.</TableHead>
                        <TableHead className="w-[140px]">Date / Time</TableHead>
                        <TableHead>Offense Description</TableHead>
                        <TableHead className="w-[130px] text-right">Fine Amount</TableHead>
                        <TableHead className="w-[110px] text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {challans.challans.map((c) => (
                        <TableRow key={c.challan_number}>
                          <TableCell className="font-mono font-bold text-xs text-slate-900">
                            {c.challan_number}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {c.offence_date_time}
                          </TableCell>
                          <TableCell className="text-xs text-slate-800 font-medium">
                            {c.offence_details}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-xs text-right text-slate-900">
                            {c.fine_amount_formatted}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={c.challan_status === "PENDING" ? "destructive" : "success"}
                              className="text-[10px]"
                            >
                              {c.challan_status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Dialog: Field Provenance Inspector */}
      <Dialog
        open={isProvenanceOpen}
        onOpenChange={setIsProvenanceOpen}
        title="Field-Level Provenance & Traceability Audit"
        description="Verification audit trail detailing data origin, masking rules, and transport authority status."
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-700">
              <span><strong>Vehicle Registration:</strong> {vehicle?.registration_number}</span>
              <span className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border">SHA256-AUTHENTICATED</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Provider Source: <strong>apisathi_mock</strong> | Privacy Rule: <strong>DPDP Act 2023 Masked</strong>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Attribute Key</TableHead>
                  <TableHead className="text-xs">Current Value</TableHead>
                  <TableHead className="text-xs text-right">Field Provenance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">owner_name</TableCell>
                  <TableCell className="text-xs font-mono">{vehicle?.owner_name_masked}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("owner_name")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">chassis_number</TableCell>
                  <TableCell className="text-xs font-mono">{vehicle?.chassis_number}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("chassis_number")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">engine_number</TableCell>
                  <TableCell className="text-xs font-mono">{vehicle?.engine_number}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("engine_number")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">maker_model</TableCell>
                  <TableCell className="text-xs">{vehicle?.maker_model}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("maker_model")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">fitness_valid_until</TableCell>
                  <TableCell className="text-xs">{vehicle?.fitness_valid_until || "Restricted"}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("fitness_valid_until")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">financier_name</TableCell>
                  <TableCell className="text-xs">{vehicle?.financier_name || "None / Restricted"}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("financier_name")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="text-xs font-mono font-semibold">national_permit_number</TableCell>
                  <TableCell className="text-xs">{vehicle?.national_permit_number || "Not Applicable"}</TableCell>
                  <TableCell className="text-right">{getProvenanceBadge("national_permit_number")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="default" size="sm" onClick={() => setIsProvenanceOpen(false)}>
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Force Refresh Credit Warning Confirmation */}
      <Dialog
        open={isRefreshConfirmOpen}
        onOpenChange={setIsRefreshConfirmOpen}
        title="Confirm Live Registry Refresh"
        description="Execute fresh live query against transport registry"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Live Query Credit Deduction Notice</span>
            </div>
            <p>
              Re-querying central VAHAN/Parivahan records will bypass cache and deduct{" "}
              <strong>{verificationMode === "combined" ? "25 Credits" : verificationMode === "rc_only" ? "15 Credits" : "10 Credits"}</strong>{" "}
              from your organization balance.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsRefreshConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsRefreshConfirmOpen(false);
                executeLookup(searchReg, true);
              }}
            >
              Proceed & Deduct Credits
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
