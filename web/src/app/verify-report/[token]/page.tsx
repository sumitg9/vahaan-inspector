"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileText,
  Building2,
  Calendar,
  UserCheck,
  Stamp,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function VerifyReportPage() {
  const params = useParams();
  const token = (params?.token as string) || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/verify-report/${token}`);
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || "Failed to verify report token.");
        }
      } catch (err: any) {
        setError(err.message || "Network error verifying report token.");
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 py-10 px-4 flex flex-col items-center">
      {/* Header Branding */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-2">
          <ShieldCheck className="h-8 w-8 text-teal-400" />
          <span className="text-2xl font-black tracking-tight text-white">VAHANCHECK ENTERPRISE</span>
        </div>
        <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          Public Cryptographic QR Verification & Authenticity Portal (AC-REP-02)
        </p>
      </div>

      {loading ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-lg w-full text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-1">Verifying Digital Seal...</h2>
          <p className="text-sm text-slate-400">Validating cryptographic SHA-256 snapshot checksum against immutable ledger.</p>
        </div>
      ) : error ? (
        <div className="bg-slate-800 border border-red-900/50 rounded-xl p-8 max-w-lg w-full text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
          <p className="text-sm text-slate-400 mb-6">{error}</p>
          <div className="font-mono text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-900/60 truncate">
            Scanned Token: {token}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/90 backdrop-blur border border-slate-700 rounded-xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 relative overflow-hidden">
          {/* Mock Watermark Notice (Invariant 2) */}
          {data.is_mock_watermarked && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-6 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-300">
                <strong className="block text-amber-200 uppercase tracking-wide">Demonstration Artifact</strong>
                {data.watermark_text || "DEMONSTRATION DATA — NOT FOR OFFICIAL USE"}. This dossier was compiled using deterministic simulated fixtures.
              </div>
            </div>
          )}

          {/* Verification Badge */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-700 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Authentic Report Verified</h2>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs">
                    TAMPER-FREE
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">Cryptographic hash matches server-sealed immutable snapshot.</p>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs font-mono">
                v{data.report_version}
              </Badge>
            </div>
          </div>

          {/* Vehicle Core Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Registration Number</div>
              <div className="text-xl font-black text-white">{data.registration_number}</div>
              <div className="text-xs text-slate-400 mt-1">{data.maker_model}</div>
            </div>

            <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/60">
              <div className="text-xs text-slate-400 uppercase font-semibold mb-1">Requesting Bank / Client</div>
              <div className="text-sm font-bold text-white truncate">{data.client_name}</div>
              <div className="text-xs text-slate-400 mt-1">Case: {data.case_id}</div>
            </div>
          </div>

          {/* Valuation Verified Numbers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-950/30 border border-blue-500/30 p-4 rounded-lg">
              <div className="text-xs font-bold text-blue-400 uppercase">Certified Fair Market Value</div>
              <div className="text-2xl font-black text-white my-1">
                ₹{data.approved_fair_market_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-blue-300">Signed off by Chartered Valuer</div>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-lg">
              <div className="text-xs font-bold text-amber-400 uppercase">Distress Liquidation Value</div>
              <div className="text-2xl font-black text-white my-1">
                ₹{data.approved_distress_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-amber-300">Orderly Liquidation Benchmark</div>
            </div>
          </div>

          {/* Valuer and QC Sign-off Record */}
          <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4 mb-6 space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Certified Valuer:</span>
              <strong className="text-white">{data.certified_valuer_name} ({data.certified_valuer_license})</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Quality Control Officer:</span>
              <strong className="text-white">{data.qc_officer_name}</strong>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Field Inspector:</span>
              <strong className="text-white">{data.inspector_name}</strong>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Inspection Date:</span>
              <strong className="text-white">{data.inspection_date}</strong>
            </div>
          </div>

          {/* Cryptographic SHA-256 Footprint */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 mb-6 text-xs font-mono space-y-1">
            <div className="text-slate-500 uppercase text-[10px] tracking-wider font-bold">Cryptographic Snapshot Fingerprint</div>
            <div className="text-teal-400 break-all select-all">{data.sha256_checksum}</div>
            <div className="text-slate-500 text-[10px] pt-1">
              Token: {data.verification_token}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href={`/inspections/${data.case_id}/report`} className="flex-1">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <FileText className="h-4 w-4 mr-2" /> View Printable A4 Report
              </Button>
            </Link>
            <Link href="/inspections" className="flex-1">
              <Button variant="outline" className="w-full border-slate-700 text-slate-300 hover:bg-slate-700">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-slate-500 mt-8">
        &copy; 2026 VahanCheck Enterprise. DPDP Act 2023 Compliant. Immutable Ledger Powered.
      </div>
    </div>
  );
}
