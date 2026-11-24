"use client";

import React, { useState } from "react";
import {
  Calculator,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  Info,
  DollarSign,
  Printer,
  Sparkles,
  History,
  FileText,
  BadgeAlert,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { formatCurrencyINR } from "@/lib/utils";

interface VersionSnapshot {
  version: number;
  archived_at: string;
  fair_market_value_paise: number;
  override_applied: boolean;
  override_justification?: string;
}

interface ValuationModel {
  registration_number: string;
  make_model: string;
  manufacturing_year: number;
  vehicle_category: string;
  base_fmv_paise: number; // Base Fair Market Value
  ex_showroom_paise: number;
  age_in_months: number;
  odometer_km: number;
  body_score: number; // 1-10
  mechanical_score: number; // 1-10
  electrical_score: number; // 1-10
  tyre_avg_tread_percent: number; // 0-100%
  repair_estimates_paise: number; // Damage photos deduction
  tyre_refurbishment_paise: number; // Tyre audit deduction
  methodology: string;
  override_paise: number | null;
  override_reason: string;
  certified_valuer_remarks: string;
  is_certified: boolean;
  approved_at: string | null;
  version_history: VersionSnapshot[];
}

export default function ValuationDeskPage() {
  const [valuationData, setValuationData] = useState<ValuationModel>({
    registration_number: "MH12AB1234",
    make_model: "Tata Prima 2830.K Tipper (2023)",
    manufacturing_year: 2023,
    vehicle_category: "COMMERCIAL_HEAVY",
    base_fmv_paise: 420000000, // ₹42,00,000
    ex_showroom_paise: 510000000, // ₹51,00,000
    age_in_months: 36,
    odometer_km: 45210,
    body_score: 8,
    mechanical_score: 9,
    electrical_score: 8,
    tyre_avg_tread_percent: 75,
    repair_estimates_paise: 4000000, // ₹40,000 damage repair
    tyre_refurbishment_paise: 2650000, // ₹26,500 tyre wear (from tyre audit desk)
    methodology: "DEPRECIATED_MARKET_VALUE_COMMERCIAL",
    override_paise: null,
    override_reason: "",
    certified_valuer_remarks: "Commercial tipper in sound mechanical condition. Recommended for secondary market lease financing.",
    is_certified: false,
    approved_at: null,
    version_history: [],
  });

  const [hasOverride, setHasOverride] = useState(false);
  const [overrideInputRupees, setOverrideInputRupees] = useState("");
  const [isSnapshotFrozen, setIsSnapshotFrozen] = useState(false);
  const [snapshotHash, setSnapshotHash] = useState<string | null>(null);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isMethodologyInfoOpen, setIsMethodologyInfoOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Dynamic formula calculation
  // Deductions based on scores: (10 - score) * 2% of Base FMV
  const bodyDeductionPaise = Math.round(
    valuationData.base_fmv_paise * ((10 - valuationData.body_score) * 0.02)
  );
  const mechanicalDeductionPaise = Math.round(
    valuationData.base_fmv_paise * ((10 - valuationData.mechanical_score) * 0.025)
  );
  const electricalDeductionPaise = Math.round(
    valuationData.base_fmv_paise * ((10 - valuationData.electrical_score) * 0.015)
  );

  // Tyre wear deduction: if tread < 80%, deduction is (80 - tread)% of 5% of Base FMV
  const tyreDeductionPaise =
    valuationData.tyre_avg_tread_percent < 80
      ? Math.round(
          valuationData.base_fmv_paise *
            0.05 *
            ((80 - valuationData.tyre_avg_tread_percent) / 80)
        )
      : 0;

  // Additional repairs & tyre refurbishment deductions from modules
  const repairAndRefurbishmentPaise =
    valuationData.repair_estimates_paise + valuationData.tyre_refurbishment_paise;

  const totalDeductionsPaise =
    bodyDeductionPaise +
    mechanicalDeductionPaise +
    electricalDeductionPaise +
    tyreDeductionPaise +
    repairAndRefurbishmentPaise;

  // Proposed Algorithmic Estimate
  const algorithmicFairMarketValuePaise = Math.max(
    Math.round(valuationData.ex_showroom_paise * 0.15), // 15% scrap value floor
    valuationData.base_fmv_paise - totalDeductionsPaise
  );

  const algorithmicDistressValuePaise = Math.round(algorithmicFairMarketValuePaise * 0.85);

  const finalAppraisedValuePaise =
    hasOverride && valuationData.override_paise !== null
      ? valuationData.override_paise
      : algorithmicFairMarketValuePaise;

  const finalDistressValuePaise = Math.round(finalAppraisedValuePaise * 0.85);

  const handleApplyOverride = () => {
    const rupees = parseFloat(overrideInputRupees);
    if (!isNaN(rupees) && rupees > 0) {
      setValuationData({
        ...valuationData,
        override_paise: Math.round(rupees * 100),
      });
      setHasOverride(true);
      showToast(`Valuer override of ${formatCurrencyINR(Math.round(rupees * 100))} staged.`);
    }
  };

  const handleFreezeSnapshot = () => {
    // AC-VAL-02: Mandatory Written Justification for Override (minimum 30 characters)
    if (hasOverride) {
      const trimmedReason = valuationData.override_reason.trim();
      if (!trimmedReason || trimmedReason.length < 30) {
        alert(
          "AC-VAL-02 Invariant Violation: A detailed written override justification with a minimum of 30 characters is strictly mandatory before certifying valuation."
        );
        return;
      }
    }

    if (valuationData.certified_valuer_remarks.trim().length < 10) {
      alert("Professional valuer remarks are required (minimum 10 characters).");
      return;
    }

    // Preserve historical version if already certified
    const updatedHistory = [...valuationData.version_history];
    if (valuationData.is_certified) {
      updatedHistory.push({
        version: updatedHistory.length + 1,
        archived_at: new Date().toISOString(),
        fair_market_value_paise: finalAppraisedValuePaise,
        override_applied: hasOverride,
        override_justification: valuationData.override_reason,
      });
    }

    const pseudoHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    setSnapshotHash(pseudoHash);
    setIsSnapshotFrozen(true);

    setValuationData({
      ...valuationData,
      is_certified: true,
      approved_at: new Date().toISOString(),
      version_history: updatedHistory,
    });

    showToast("Valuation certified and approved by Valuer. Immutable SHA-256 snapshot frozen.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Valuation Desk & Certified Appraisal</span>
            <Badge variant="default" className="text-[10px]">IBBI Standard</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fair Market Value (FMV), Distress Sale Value (DSV), methodology assumptions, and authorized override governance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {valuationData.version_history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVersionHistoryOpen(true)}
              className="gap-1.5 text-xs"
            >
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Versions ({valuationData.version_history.length})</span>
            </Button>
          )}

          {isSnapshotFrozen ? (
            <Badge variant="success" className="gap-1 py-1.5 px-3 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Dossier Certified & Snapshot Frozen (SHA-256)</span>
            </Badge>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleFreezeSnapshot}
              className="gap-1.5 shadow-sm bg-brand hover:bg-brand/90"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Approve & Certify Dossier</span>
            </Button>
          )}
        </div>
      </div>

      {/* AC-VAL-01: Separation of Algorithmic vs Certified Valuation Banner */}
      {!valuationData.is_certified ? (
        <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-brand">
                AC-VAL-01 Disclosure: Proposed Algorithmic Estimate
              </span>
              <p className="text-[11px] text-blue-800 mt-0.5">
                This appraisal is currently an algorithmic calculation and is <strong>NOT</strong> an authorized certified valuation until reviewed and approved by an authorized valuer.
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider w-fit">
            Pending Valuer Certification
          </Badge>
        </div>
      ) : (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-emerald-800">
                Certified Valuation Dossier
              </span>
              <span className="text-[11px] text-emerald-700 ml-2">
                Certified by Mahesh Deshmukh (IBBI Reg. Valuer) • Report Snapshot Locked
              </span>
            </div>
          </div>
          <Badge variant="success" className="text-[10px] uppercase font-mono tracking-wider">
            Approved & Verified
          </Badge>
        </div>
      )}

      {/* Snapshot Confirmation Alert */}
      {isSnapshotFrozen && snapshotHash && (
        <div className="p-3 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Immutable SHA-256 Hash: {snapshotHash}</span>
          </div>
          <span className="text-[10px] text-slate-400">Locked for A4 PDF Snapshots</span>
        </div>
      )}

      {/* Summary KPI Appraisal Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Ex-Showroom Base</div>
          <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
            {formatCurrencyINR(valuationData.ex_showroom_paise)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">OEM Benchmark Price</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">
            {hasOverride ? "Proposed Algorithmic FMV" : "Fair Market Value (FMV)"}
          </div>
          <div className="text-2xl font-bold text-brand mt-1 font-mono">
            {formatCurrencyINR(algorithmicFairMarketValuePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Standard Market Liquidity (60d)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">
            {hasOverride ? "Certified Override FMV" : "Effective Fair Market Value"}
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono">
            {formatCurrencyINR(finalAppraisedValuePaise)}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            {hasOverride ? "Valuer Override Active" : "Algorithmic Certified Value"}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-medium text-slate-500">Distress Sale Value (DSV)</div>
          <div className="text-2xl font-bold text-rose-600 mt-1 font-mono">
            {formatCurrencyINR(finalDistressValuePaise)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">15% Immediate Liquidation Haircut</div>
        </div>
      </div>

      {/* Valuation Methodology & Assumptions Box */}
      <Card>
        <CardHeader className="p-4 pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand" />
              <span>Valuation Methodology & Assumptions</span>
            </CardTitle>
            <CardDescription className="text-[11px]">
              Standardized depreciation methodology and baseline actuarial assumptions.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMethodologyInfoOpen(true)}
            className="h-6 text-[10px] px-2 gap-1"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Assumptions</span>
          </Button>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Valuation Methodology
            </label>
            <select
              value={valuationData.methodology}
              onChange={(e) => setValuationData({ ...valuationData, methodology: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand/30"
            >
              <option value="DEPRECIATED_MARKET_VALUE_COMMERCIAL">Depreciated Market Value (Commercial Heavy)</option>
              <option value="STRAIGHT_LINE_DEPRECIATION">Straight Line Depreciation Method</option>
              <option value="MARKET_COMPARATIVE_METHOD">Market Comparative Replacement Method</option>
              <option value="DISTRESS_LIQUIDATION_METHOD">Distress Liquidation Realization Method</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Vehicle Class & Category
            </label>
            <input
              type="text"
              readOnly
              value={`${valuationData.vehicle_category} (${valuationData.manufacturing_year})`}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded font-semibold text-slate-700"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Odometer Reading & Utilization
            </label>
            <input
              type="text"
              readOnly
              value={`${valuationData.odometer_km.toLocaleString()} km (Age: ${valuationData.age_in_months} mos)`}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded font-mono font-medium text-slate-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Multi-Pillar Scoring & Deductions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Multi-Pillar Condition Scoring Inputs */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-brand" />
                <span>Multi-Pillar Physical Condition Appraisal</span>
              </CardTitle>
              <CardDescription className="text-[11px]">
                Condition scores (1-10) directly calibrate the algorithmic depreciation deductions.
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs">
              {/* Body & Chassis Pillar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Body & Cabin Condition</span>
                  <span className="font-mono font-bold text-brand">{valuationData.body_score} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={valuationData.body_score}
                  onChange={(e) =>
                    setValuationData({ ...valuationData, body_score: parseInt(e.target.value) })
                  }
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Major structural damage (1)</span>
                  <span>Deduction: -{formatCurrencyINR(bodyDeductionPaise)}</span>
                  <span>Showroom Mint (10)</span>
                </div>
              </div>

              {/* Mechanical & Powertrain Pillar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Mechanical & Powertrain Condition</span>
                  <span className="font-mono font-bold text-brand">{valuationData.mechanical_score} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={valuationData.mechanical_score}
                  onChange={(e) =>
                    setValuationData({ ...valuationData, mechanical_score: parseInt(e.target.value) })
                  }
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Severe blowby / engine overhaul (1)</span>
                  <span>Deduction: -{formatCurrencyINR(mechanicalDeductionPaise)}</span>
                  <span>Optimal Compression (10)</span>
                </div>
              </div>

              {/* Electrical & Safety Systems */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Electrical & Safety Systems</span>
                  <span className="font-mono font-bold text-brand">{valuationData.electrical_score} / 10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={valuationData.electrical_score}
                  onChange={(e) =>
                    setValuationData({ ...valuationData, electrical_score: parseInt(e.target.value) })
                  }
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Harness burnt / ECU failure (1)</span>
                  <span>Deduction: -{formatCurrencyINR(electricalDeductionPaise)}</span>
                  <span>All Sensors Certified (10)</span>
                </div>
              </div>

              {/* Tyre Wear Indicator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Average Tyre Tread Life</span>
                  <span className="font-mono font-bold text-brand">{valuationData.tyre_avg_tread_percent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={valuationData.tyre_avg_tread_percent}
                  onChange={(e) =>
                    setValuationData({ ...valuationData, tyre_avg_tread_percent: parseInt(e.target.value) })
                  }
                  className="w-full accent-brand cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Bald (&lt;1.6mm legal limit)</span>
                  <span>Deduction: -{formatCurrencyINR(tyreDeductionPaise)}</span>
                  <span>100% Brand New Tread</span>
                </div>
              </div>

              {/* Professional Remarks Input */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Professional Certified Valuer Remarks * (Min 10 chars)
                </label>
                <textarea
                  rows={2}
                  value={valuationData.certified_valuer_remarks}
                  onChange={(e) => setValuationData({ ...valuationData, certified_valuer_remarks: e.target.value })}
                  placeholder="Record professional inspection findings, market liquidity observations, and road-test assessment..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand/30 font-medium"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Valuer Override Controls & Deductions Breakdown */}
        <div className="space-y-4">
          {/* Deductions Breakdown Card */}
          <Card>
            <CardHeader className="p-4 pb-2 border-b border-slate-100">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Depreciation & Deductions Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Base FMV Benchmark:</span>
                <span className="font-mono font-semibold">{formatCurrencyINR(valuationData.base_fmv_paise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Body / Cabin Deduction:</span>
                <span className="font-mono">-{formatCurrencyINR(bodyDeductionPaise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Mechanical Powertrain:</span>
                <span className="font-mono">-{formatCurrencyINR(mechanicalDeductionPaise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Electrical & Sensor:</span>
                <span className="font-mono">-{formatCurrencyINR(electricalDeductionPaise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Tyre Tread Wear Deduction:</span>
                <span className="font-mono">-{formatCurrencyINR(tyreDeductionPaise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Tyre Refurbishment (Audit Desk):</span>
                <span className="font-mono">-{formatCurrencyINR(valuationData.tyre_refurbishment_paise)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Physical Damage Repair Proof:</span>
                <span className="font-mono">-{formatCurrencyINR(valuationData.repair_estimates_paise)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Net Algorithmic Fair Value:</span>
                <span className="font-mono text-brand">{formatCurrencyINR(algorithmicFairMarketValuePaise)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Valuer Override & Governance Card */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardHeader className="p-4 pb-2 border-b border-amber-200/60">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center justify-between">
                <span>Valuer Override Governance (AC-VAL-02)</span>
                <input
                  type="checkbox"
                  checked={hasOverride}
                  onChange={(e) => setHasOverride(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                />
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3 text-xs">
              {hasOverride ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Certified Fair Market Value (₹ INR) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="e.g. 3850000"
                        value={overrideInputRupees}
                        onChange={(e) => setOverrideInputRupees(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand/30"
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleApplyOverride}
                        className="h-8 text-xs bg-amber-600 hover:bg-amber-700"
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-slate-700">
                        AC-VAL-02: Mandatory Written Justification *
                      </label>
                      <span className={`text-[10px] font-mono font-semibold ${
                        valuationData.override_reason.trim().length >= 30 ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {valuationData.override_reason.trim().length} / 30 chars min
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. High regional demand for Tata tippers in mining sector; recent engine overhaul with genuine OEM components justifies +₹2,50,000 above algorithmic estimate."
                      value={valuationData.override_reason}
                      onChange={(e) => setValuationData({ ...valuationData, override_reason: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand/30 font-medium"
                    />
                    {valuationData.override_reason.trim().length < 30 && (
                      <p className="text-[10px] text-rose-600 mt-1">
                        Mandatory requirement: Minimum 30 characters required to approve override.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[11px] text-slate-600 italic">
                  Enable valuer override to apply professional discretion above or below standard algorithmic depreciation. Written justification (min 30 chars) is legally required.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog: Version History Snapshots Drawer */}
      <Dialog
        open={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
        title="Valuation Version History & Historical Snapshots"
        description="Preserved immutable revision snapshots for audit traceability."
      >
        <div className="space-y-3">
          {valuationData.version_history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No previous versions. Current appraisal is Version 1.0.
            </div>
          ) : (
            valuationData.version_history.map((vh) => (
              <div
                key={vh.version}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
              >
                <div className="flex items-center justify-between font-bold">
                  <span>Version {vh.version}.0</span>
                  <span className="font-mono text-brand">{formatCurrencyINR(vh.fair_market_value_paise)}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Archived on: {vh.archived_at} • Override: {vh.override_applied ? "Yes" : "No"}
                </div>
                {vh.override_justification && (
                  <div className="text-[11px] text-slate-700 font-mono bg-white p-1.5 rounded border border-slate-100">
                    "{vh.override_justification}"
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Dialog>

      {/* Dialog: Methodology Assumptions Information */}
      <Dialog
        open={isMethodologyInfoOpen}
        onOpenChange={setIsMethodologyInfoOpen}
        title="Valuation Actuarial Assumptions & Standards"
        description="Regulatory basis: General Insurance Council Motor Tariff & IBBI Asset Class Standards"
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="p-3 bg-blue-50 rounded-lg space-y-1">
            <div className="font-bold text-blue-900">1. Age Depreciation Standard</div>
            <div>Central Motor Vehicles tariff: 5% (&lt;6m), 15% (1y), 20% (2y), 30% (3y), 40% (4y), 50% (5y). Maximum age depreciation is capped at 80%.</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">2. Benchmark Annual Utilization</div>
            <div>Commercial Heavy: 60,000 km/year. Passenger Vehicle: 15,000 km/year. Excess mileage triggers automatic linear usage penalty.</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">3. Distress Liquidation Realization</div>
            <div>Distress value incorporates a standard 15% haircut reflecting urgent 30-day liquidation in secondary dealer channels.</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg space-y-1">
            <div className="font-bold text-slate-900">4. Scrap Value Floor</div>
            <div>A permanent residual floor of 15% of original OEM ex-showroom price is guaranteed regardless of age or physical wear.</div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
