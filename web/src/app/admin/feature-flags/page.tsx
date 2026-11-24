"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sliders,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

interface FeatureFlagItem {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "GLOBAL" | "TENANT_OVERRIDE";
}

const INITIAL_FLAGS: FeatureFlagItem[] = [
  {
    key: "enable_live_parivahan_lookup",
    name: "Live Parivahan API Direct Ingestion",
    description: "Route VAHAN queries directly through authorized live government/provider endpoints.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enable_ocr_comparison",
    name: "Automated Document OCR & Registry Comparison",
    description: "Perform OCR text extraction on uploaded RC, Insurance, and Fitness smart cards and compare against VAHAN records.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enforce_cmv_rule_95_tyres",
    name: "Enforce CMV Rule 95 Tyre Safety Threshold",
    description: "Strictly force tyre condition to WORN_OUT and remaining life <= 15% when measured tread depth < 1.6 mm.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enable_distress_valuation_override",
    name: "Certified Valuer Distress Valuation Override",
    description: "Allow authorized Valuers to override algorithmic valuation with mandatory >= 30 chars written justification.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enable_public_qr_verification",
    name: "Public Cryptographic QR Verification Portal",
    description: "Enable instant public verification of approved report dossier SHA-256 seal via QR code scan.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enable_instant_pdf_download",
    name: "Instant A4 PDF Dossier Rendering",
    description: "Generate pixel-perfect A4 print dossier with dynamic pagination and digital signature seals.",
    enabled: true,
    scope: "GLOBAL",
  },
  {
    key: "enforce_dpdp_strict_masking",
    name: "DPDP Act 2023 Strict PII Name Masking",
    description: "Mandatory masking of registered owner names in all non-consented views and PDF report sections.",
    enabled: true,
    scope: "GLOBAL",
  },
];

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlagItem[]>(INITIAL_FLAGS);
  const [targetOrg, setTargetOrg] = useState("GLOBAL");
  const [lastToggled, setLastToggled] = useState<string | null>(null);

  const toggleFlag = (key: string) => {
    setFlags(
      flags.map((f) => {
        if (f.key === key) {
          const nextState = !f.enabled;
          setLastToggled(`Toggled '${f.name}' to ${nextState ? "ENABLED" : "DISABLED"}`);
          return { ...f, enabled: nextState };
        }
        return f;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Super Admin Console
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Feature Flags & System Toggles</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dynamically activate or deactivate platform capabilities globally or per tenant organization with audit trails.
          </p>
        </div>

        {/* Scope Selector */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs shadow-sm">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-600">Scope:</span>
          <select
            value={targetOrg}
            onChange={(e) => setTargetOrg(e.target.value)}
            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
          >
            <option value="GLOBAL">Global Platform Defaults</option>
            <option value="speedcheck">SpeedCheck Valuers (Tenant Override)</option>
            <option value="apex">Apex Auto Surveyors (Tenant Override)</option>
          </select>
        </div>
      </div>

      {lastToggled && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{lastToggled}</span>
        </div>
      )}

      {/* Feature Flags Grid */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm divide-y divide-slate-100 overflow-hidden">
        {flags.map((flag) => (
          <div
            key={flag.key}
            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
          >
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{flag.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    flag.scope === "GLOBAL"
                      ? "bg-slate-100 text-slate-600 border border-slate-200"
                      : "bg-purple-50 text-purple-700 border border-purple-200"
                  }`}
                >
                  {flag.scope}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{flag.description}</p>
              <div className="text-[11px] font-mono text-slate-400">key: {flag.key}</div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  flag.enabled ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {flag.enabled ? "Active" : "Disabled"}
              </span>

              <button
                type="button"
                onClick={() => toggleFlag(flag.key)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  flag.enabled ? "bg-brand" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    flag.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
