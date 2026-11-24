"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Save,
  Image,
  Stamp,
  ShieldCheck,
} from "lucide-react";

export default function AdminReportSettingsPage() {
  const [headerTitle, setHeaderTitle] = useState(
    "COMPREHENSIVE MOTOR VEHICLE INSPECTION & VALUATION DOSSIER"
  );
  const [footerText, setFooterText] = useState(
    "CONFIDENTIAL & PRIVILEGED VALUATION REPORT — PREPARED FOR BANKING & FINANCING INSTITUTIONS"
  );
  const [logoUrl, setLogoUrl] = useState("https://vahancheck.io/branding/logo-dark.png");
  const [disclaimer, setDisclaimer] = useState(
    "This inspection dossier and certified valuation report are issued based on visual inspection, mechanical condition appraisal, Central Motor Vehicles Rules 1989/1995 compliance checks, and algorithmic depreciation curves. No dismantling or destructive testing was conducted."
  );

  const [signInspector, setSignInspector] = useState(true);
  const [signQc, setSignQc] = useState(true);
  const [signValuer, setSignValuer] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Report Dossier Settings & Branding</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure A4 portrait print templates, institutional branding, legal disclaimers, and indelible watermark rules.
          </p>
        </div>
      </div>

      {/* Invariant 2 & AC-REP-03 Indelible Watermark Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-950 space-y-1">
          <div className="font-bold text-sm text-amber-900">
            INVARIANT 2 & AC-REP-03 INDELIBLE WATERMARK LOCKED
          </div>
          <p>
            Any inspection or valuation dossier compiled using mock provider or synthetic demonstration data{" "}
            <strong>MUST</strong> carry an indelible semi-transparent watermark:
          </p>
          <div className="inline-block bg-white px-2.5 py-1 rounded border border-amber-300 font-mono font-bold text-amber-900 text-xs">
            DEMONSTRATION DATA — NOT FOR OFFICIAL USE
          </div>
          <p className="text-[11px] text-amber-800">
            This requirement is hard-coded in the rendering engine and cannot be disabled in non-production environments.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Report settings and branding templates updated successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-4 h-4 text-brand" /> Document Header & Typography
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dossier Header Title</label>
              <input
                type="text"
                required
                value={headerTitle}
                onChange={(e) => setHeaderTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Dossier Footer Confidentiality Text</label>
              <input
                type="text"
                required
                value={footerText}
                onChange={(e) => setFooterText(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Organization Logo Asset URL</label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  required
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono"
                />
                <div className="h-9 px-3 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                  <Image className="w-4 h-4 text-slate-400" /> Preview
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> Legal Disclaimer & Compliance Statement
          </h2>

          <div>
            <label className="block text-slate-700 font-semibold mb-1 text-xs">
              Section 11 Mandatory Actuarial Disclaimer Text
            </label>
            <textarea
              rows={4}
              required
              value={disclaimer}
              onChange={(e) => setDisclaimer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Digital Signature Blocks */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Stamp className="w-4 h-4 text-purple-600" /> Three-Tier Digital Sign-off Requirements
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={signInspector}
                onChange={(e) => setSignInspector(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
              <div>
                <div className="font-bold text-slate-800">Field Surveyor Block</div>
                <div className="text-[11px] text-slate-500">Requires physical surveyor sign-off</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={signQc}
                onChange={(e) => setSignQc(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
              <div>
                <div className="font-bold text-slate-800">QC Reviewer Block</div>
                <div className="text-[11px] text-slate-500">Requires QC manager validation</div>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={signValuer}
                onChange={(e) => setSignValuer(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand"
              />
              <div>
                <div className="font-bold text-slate-800">Certified Valuer Block</div>
                <div className="text-[11px] text-slate-500">Requires Government approved valuer seal</div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Report Dossier Settings
          </button>
        </div>
      </form>
    </div>
  );
}
