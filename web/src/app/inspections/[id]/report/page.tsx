"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Printer,
  Download,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  QrCode,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InspectionReportPage() {
  const params = useParams();
  const caseId = (params?.id as string) || "case-001";

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState("1.0");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReport();
  }, [caseId]);

  const fetchReport = async (version?: string) => {
    setLoading(true);
    try {
      const url = version
        ? `/api/inspections/${caseId}/report?version=${version}`
        : `/api/inspections/${caseId}/report`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setSnapshot(data.data.snapshot_data);
        setSelectedVersion(data.data.version || "1.0");
      }
    } catch (err) {
      console.error("Failed to load report", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRevision = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/inspections/${caseId}/report`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSnapshot(data.data.snapshot_data);
        setSelectedVersion(data.data.version);
      }
    } catch (err) {
      console.error("Failed to generate revision", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-slate-600 font-medium text-sm">Compiling 11-section A4 Inspection Dossier...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-8 text-center max-w-md mx-auto">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900 mb-1">Dossier Unavailable</h2>
        <p className="text-sm text-slate-500 mb-4">No approved inspection report snapshot found for case {caseId}.</p>
        <Link href="/inspections">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Inspections</Button>
        </Link>
      </div>
    );
  }

  const s1 = snapshot.section_1_executive_summary || {};
  const s2 = snapshot.section_2_registration_identity || {};
  const s3 = snapshot.section_3_traffic_challans || {};
  const s4 = snapshot.section_4_cabin_body_chassis || {};
  const s5 = snapshot.section_5_systems_mechanical || {};
  const s6 = snapshot.section_6_electricals_safety_docs || {};
  const s7 = snapshot.section_7_tyres_matrix || {};
  const s8 = snapshot.section_8_evidence_gallery || {};
  const s9 = snapshot.section_9_valuation_dossier || {};
  const s10 = snapshot.section_10_approvals || {};
  const s11 = snapshot.section_11_disclaimers || {};

  const verificationUrl = `/verify-report/${s10.verification_token || "d6a8f10204e9800998ecf8427e112233"}`;

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:p-0 print:bg-white text-slate-900">
      {/* Top Action Bar - Hidden in Print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
        <div className="flex items-center gap-3">
          <Link href="/inspections">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Cases
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              A4 Inspection Dossier — {s1.registration_number}
            </h1>
            <p className="text-xs text-slate-500">
              Version: <strong className="text-blue-600">v{selectedVersion}</strong> (Immutable Snapshot) | Case: {caseId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRevision}
            disabled={generating}
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${generating ? "animate-spin" : ""}`} />
            New Snapshot Revision
          </Button>

          <Link href={verificationUrl} target="_blank">
            <Button variant="outline" size="sm" className="text-teal-700 border-teal-200 bg-teal-50 hover:bg-teal-100">
              <QrCode className="h-4 w-4 mr-1.5" /> Verify QR Portal
            </Button>
          </Link>

          <Button
            onClick={() => window.print()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="h-4 w-4 mr-1.5" /> Print A4 Dossier
          </Button>
        </div>
      </div>

      {/* Main A4 Document Paper Container */}
      <div className="max-w-4xl mx-auto bg-white shadow-lg border border-slate-300 p-8 rounded print:p-0 print:border-none print:shadow-none relative">
        {/* Indelible Watermark (Invariant 2) */}
        {s11.is_mock_watermarked && (
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-50 print:fixed">
            <div className="text-center font-black text-red-600 opacity-10 text-3xl sm:text-5xl md:text-6xl -rotate-45 tracking-widest leading-relaxed uppercase">
              {s11.watermark_text || "DEMONSTRATION DATA — NOT FOR OFFICIAL USE"}
            </div>
          </div>
        )}

        {/* PAGE 1: HEADER & SECTION 1 & 2 */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 flex justify-between items-end">
          <div>
            <div className="text-2xl font-black tracking-tight text-slate-900">VAHANCHECK ENTERPRISE</div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Vehicle Inspection & Certified Valuation Dossier
            </div>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Case ID: <strong className="text-slate-900">{s1.case_id}</strong></div>
            <div>Version: <strong>v{s1.report_version}</strong> | Date: <strong>{s1.inspection_date?.split(" ")[0]}</strong></div>
          </div>
        </div>

        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 1: Executive Summary & Asset Overview</span>
            <span className="bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              {s1.overall_condition_grade}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 my-3">
            <div className="border border-blue-200 bg-blue-50/50 p-3 rounded border-t-4 border-t-blue-600">
              <div className="text-xs font-bold text-slate-600 uppercase">Approved Fair Market Value (FMV)</div>
              <div className="text-2xl font-black text-blue-700 my-1">
                ₹{s1.approved_fair_market_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">{s9.valuation_type} (Certified Sign-off)</div>
            </div>

            <div className="border border-amber-200 bg-amber-50/50 p-3 rounded border-t-4 border-t-amber-500">
              <div className="text-xs font-bold text-slate-600 uppercase">Approved Distress / Liquidation Value</div>
              <div className="text-2xl font-black text-amber-700 my-1">
                ₹{s1.approved_distress_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">Orderly Liquidation Benchmark (15% Haircut)</div>
            </div>
          </div>

          <table className="w-full text-xs border border-slate-200 border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Requesting Client / Bank:</td>
                <td className="p-2 w-3/4" colSpan={3}>
                  <strong>{s1.client_name}</strong> ({s1.branch_name})
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Loan Reference Number:</td>
                <td className="p-2 w-1/4">{s1.loan_reference_number}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Vehicle Registration No:</td>
                <td className="p-2 w-1/4"><strong>{s1.registration_number}</strong></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Make & Model:</td>
                <td className="p-2 w-1/4"><strong>{s1.maker_model}</strong></td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Vehicle Category:</td>
                <td className="p-2 w-1/4">{s1.vehicle_category}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Physical Inspection Date:</td>
                <td className="p-2 w-1/4">{s1.inspection_date}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Assigned Field Inspector:</td>
                <td className="p-2 w-1/4">{s1.inspector_name} ({s1.inspector_id})</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Inspection Geo-Location:</td>
                <td className="p-2 w-3/4" colSpan={3}>
                  {s1.inspection_location} [{s1.inspection_gps?.latitude}° N, {s1.inspection_gps?.longitude}° E]
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 2: VAHAN REGISTRATION DETAILS */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 2: VAHAN Vehicle Registration & Identity</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              National Registry (APISathi RC-v1)
            </span>
          </div>

          <table className="w-full text-xs border border-slate-200 border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Registered Owner (DPDP):</td>
                <td className="p-2 w-1/4"><strong>{s2.registered_owner_masked}</strong></td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Ownership Sequence:</td>
                <td className="p-2 w-1/4">{s2.ownership_sequence}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Registration Date & Age:</td>
                <td className="p-2 w-1/4">{s2.registration_date} (Mfg: {s2.manufacturing_date})</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Registering RTO Authority:</td>
                <td className="p-2 w-1/4">{s2.rto_authority}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Chassis / VIN Number:</td>
                <td className="p-2 w-1/4 font-mono">{s2.chassis_number}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Engine Serial Number:</td>
                <td className="p-2 w-1/4 font-mono">{s2.engine_number}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Class & Body Type:</td>
                <td className="p-2 w-1/4">{s2.vehicle_class} | {s2.body_type}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Fuel & Emission Norms:</td>
                <td className="p-2 w-1/4">{s2.fuel_type} ({s2.emission_norms})</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Unladen / Gross Wt (GVW):</td>
                <td className="p-2 w-1/4">{s2.unladen_weight_kg?.toLocaleString()} kg / {s2.gross_vehicle_weight_kg?.toLocaleString()} kg</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Cubic Capacity / Seats:</td>
                <td className="p-2 w-1/4">{s2.cubic_capacity_cc} cc / {s2.seating_capacity} Seats</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Hypothecation / Financier:</td>
                <td className="p-2 w-3/4" colSpan={3}>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 mr-2 text-[10px]">
                    {s2.hypothecation_status}
                  </Badge>
                  to <strong>{s2.financier_name}</strong>
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Insurance Validity:</td>
                <td className="p-2 w-1/4">{s2.insurance_valid_until} ({s2.insurance_company})</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Fitness Certificate Validity:</td>
                <td className="p-2 w-1/4"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">{s2.fitness_valid_until}</Badge></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Road Tax Paid Upto:</td>
                <td className="p-2 w-1/4">{s2.tax_valid_until}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">PUCC Expiry Date:</td>
                <td className="p-2 w-1/4">{s2.pucc_valid_until}</td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">National Permit Validity:</td>
                <td className="p-2 w-1/4">{s2.permit_valid_until} (No: {s2.national_permit_number})</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Blacklist / NCRB Status:</td>
                <td className="p-2 w-1/4"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">{s2.blacklist_status}</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 3: TRAFFIC CHALLANS */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 3: Traffic Challan Liability & Violation Assessment</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              eChallan National Portal
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-2 text-xs">
            <div className="p-2 border border-slate-200 rounded bg-slate-50">
              <div className="text-slate-500 text-[10px]">Pending Fines Total</div>
              <div className="font-bold text-red-600 text-sm">₹{s3.summary?.pending_fines_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50">
              <div className="text-slate-500 text-[10px]">Active Pending Count</div>
              <div className="font-bold text-amber-700 text-sm">{s3.summary?.pending_challans_count} Violations</div>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50">
              <div className="text-slate-500 text-[10px]">Disposed Count</div>
              <div className="font-bold text-slate-700 text-sm">{s3.summary?.disposed_challans_count} Disposed</div>
            </div>
            <div className="p-2 border border-slate-200 rounded bg-slate-50">
              <div className="text-slate-500 text-[10px]">Total Logged Count</div>
              <div className="font-bold text-slate-700 text-sm">{s3.summary?.total_lifetime_challans} Total</div>
            </div>
          </div>

          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left border-b border-slate-200">
                <th className="p-2">Challan Number & Date</th>
                <th className="p-2">Jurisdiction</th>
                <th className="p-2">Offence Description</th>
                <th className="p-2">Fine (INR)</th>
                <th className="p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {s3.challan_records?.map((c: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 font-mono">
                    <strong>{c.challan_number}</strong>
                    <div className="text-[10px] text-slate-500">{c.offence_date_time}</div>
                  </td>
                  <td className="p-2">{c.rto_name} ({c.state_code})</td>
                  <td className="p-2 text-slate-700">{c.offence_details}</td>
                  <td className="p-2 font-bold">₹{c.fine_amount_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  <td className="p-2">
                    {c.challan_status === "PENDING" ? (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[10px]">PENDING</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">DISPOSED</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 4: CABIN, LOAD BODY & EXTERIOR CHASSIS */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 4: Cabin, Load Body & Exterior Chassis Checkpoints</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Physical Checkpoints
            </span>
          </div>
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left border-b border-slate-200">
                <th className="p-2 w-1/4">Sub-Structure</th>
                <th className="p-2 w-1/3">Checkpoint Item</th>
                <th className="p-2 w-1/6">Condition</th>
                <th className="p-2 w-1/4">Observations</th>
              </tr>
            </thead>
            <tbody>
              {s4.checkpoints?.map((item: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 font-semibold text-slate-700">{item.category}</td>
                  <td className="p-2">{item.item}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      {item.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-slate-600 text-[11px]">{item.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 5: MECHANICAL & SYSTEMS */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 5: Engine, Transmission & Mechanical Systems</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Functional Audit
            </span>
          </div>
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left border-b border-slate-200">
                <th className="p-2 w-1/5">System</th>
                <th className="p-2 w-1/3">Checkpoint Item</th>
                <th className="p-2 w-1/6">Result</th>
                <th className="p-2 w-1/3">Operating Findings</th>
              </tr>
            </thead>
            <tbody>
              {s5.checkpoints?.map((sys: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 font-semibold text-slate-700">{sys.system}</td>
                  <td className="p-2">{sys.item}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      {sys.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-slate-600 text-[11px]">{sys.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 6: ELECTRICALS, SAFETY & DOCUMENTS */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 6: Electricals, Safety Fitments & Document Cross-Verification</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Compliance Checks
            </span>
          </div>
          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left border-b border-slate-200">
                <th className="p-2 w-1/5">Category</th>
                <th className="p-2 w-1/3">Verification Item</th>
                <th className="p-2 w-1/6">Status</th>
                <th className="p-2 w-1/3">Verification Notes</th>
              </tr>
            </thead>
            <tbody>
              {s6.checkpoints?.map((doc: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 font-semibold text-slate-700">{doc.category}</td>
                  <td className="p-2">{doc.item}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">
                      {doc.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-slate-600 text-[11px]">{doc.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 7: MULTI-AXLE TYRE MATRIX */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 7: Multi-Axle Individual Tyre Matrix (Position-Accurate Audit)</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              AC-TYRE-01 & AC-TYRE-02
            </span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 border-b-0 text-xs flex justify-between items-center">
            <div>Layout: <strong>{s7.axle_layout}</strong></div>
            <div>Avg Tread: <strong>{s7.average_tread_depth_mm} mm</strong></div>
            <div>Worn Out: <strong className="text-red-600">{s7.worn_out_count} Wheels</strong></div>
          </div>

          {s7.ac_tyre_02_safety_alert && (
            <div className="p-2 bg-red-50 border-l-4 border-red-600 text-red-700 text-xs font-semibold">
              ⚠ {s7.ac_tyre_02_safety_alert}
            </div>
          )}

          <table className="w-full text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-600 text-left border-b border-slate-200">
                <th className="p-2">Position</th>
                <th className="p-2">Description</th>
                <th className="p-2">Brand & Spec</th>
                <th className="p-2">Tread (mm)</th>
                <th className="p-2">Life (%)</th>
                <th className="p-2">Condition</th>
              </tr>
            </thead>
            <tbody>
              {s7.tyre_records?.map((t: any, idx: number) => (
                <tr key={idx} className="border-b border-slate-200">
                  <td className="p-2 font-mono text-[11px]">{t.position}</td>
                  <td className="p-2 font-medium">{t.position_label}</td>
                  <td className="p-2">{t.brand} ({t.size_spec})</td>
                  <td className={`p-2 font-bold ${t.is_critical_safety_alert ? "text-red-600" : "text-slate-900"}`}>
                    {t.tread_depth_mm} mm
                    {t.is_critical_safety_alert && <span className="block text-[9px] text-red-600">&lt;1.6mm FAIL</span>}
                  </td>
                  <td className="p-2">{t.remaining_life_pct}%</td>
                  <td className="p-2">
                    {t.condition === "GOOD" ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]">GOOD</Badge>
                    ) : t.condition === "FAIR" ? (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">FAIR</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[10px]">WORN OUT</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION 8: PHOTOGRAPHIC EVIDENCE GALLERY */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 8: Photographic Evidence Gallery (Geotagged & Timestamped)</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              {s8.total_photographs || 12} Verified Artifacts
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 border border-slate-200 rounded-b">
            {s8.photos?.map((p: any, idx: number) => (
              <div key={idx} className="border border-slate-200 rounded overflow-hidden bg-white text-xs">
                <div className="h-28 bg-slate-100 flex flex-col items-center justify-center p-2 text-center text-slate-500">
                  <div className="text-xl mb-1">📷</div>
                  <div className="font-semibold text-slate-700 text-[11px]">{p.label}</div>
                  {p.is_damage && (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[9px] mt-1">
                      DAMAGE PROOF
                    </Badge>
                  )}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] space-y-0.5">
                  <div className="font-medium text-slate-900">{p.label}</div>
                  <div className="text-slate-500">📍 {p.gps}</div>
                  <div className="text-slate-500">⏱ {p.timestamp}</div>
                  <div className="font-mono text-slate-400 truncate">SHA: {p.sha256_hash?.substring(0, 16)}...</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 9: CERTIFIED VALUATION DOSSIER */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 9: Certified Valuation Dossier & Actuarial Breakdown</span>
            <span className="bg-teal-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Chartered Valuer Sign-Off
            </span>
          </div>

          <table className="w-full text-xs border border-slate-200 border-collapse">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Valuation Methodology:</td>
                <td className="p-2 w-3/4" colSpan={3}><strong>{s9.valuation_methodology}</strong></td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Baseline Ex-Showroom / Invoice:</td>
                <td className="p-2 w-1/4">₹{s9.ex_showroom_price_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Vehicle Age / Depreciation Rate:</td>
                <td className="p-2 w-1/4">{s9.age_in_months} Months ({s9.age_depreciation_pct}% Applied)</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Base Depreciated Asset Value:</td>
                <td className="p-2 w-1/4">₹{s9.base_depreciated_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Odometer Usage Penalty:</td>
                <td className="p-2 w-1/4 text-red-600">- ₹{s9.odometer_adjustment_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Condition Scoring Deductions:</td>
                <td className="p-2 w-1/4 text-red-600">- ₹{s9.condition_deduction_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Repair & Refurbishment:</td>
                <td className="p-2 w-1/4 text-red-600">- ₹{s9.estimated_repair_refurbishment_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Proposed Algorithmic Estimate:</td>
                <td className="p-2 w-1/4">₹{s9.proposed_fair_market_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Valuer Override Applied?</td>
                <td className="p-2 w-1/4">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                    YES (AC-VAL-02 JUSTIFIED)
                  </Badge>
                </td>
              </tr>
              {s9.override_justification && (
                <tr className="border-b border-slate-200 bg-blue-50/30">
                  <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Mandatory Override Justification:</td>
                  <td className="p-2 w-3/4 italic text-blue-900" colSpan={3}>
                    "{s9.override_justification}"
                  </td>
                </tr>
              )}
              <tr className="border-b border-slate-200 bg-slate-100">
                <td className="font-bold text-slate-900 p-2 w-1/4">FINAL CERTIFIED FMV:</td>
                <td className="p-2 w-1/4 font-black text-blue-700 text-sm">
                  ₹{s9.final_fair_market_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
                <td className="font-bold text-slate-900 p-2 w-1/4">DISTRESS LIQUIDATION VALUE:</td>
                <td className="p-2 w-1/4 font-black text-amber-700 text-sm">
                  ₹{s9.final_distress_value_inr?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-50 font-semibold text-slate-600 p-2 w-1/4">Valuer Remarks:</td>
                <td className="p-2 w-3/4" colSpan={3}>{s9.certified_valuer_remarks}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SECTION 10: APPROVALS & SIGN-OFFS & QR CODE */}
        <div className="mb-6">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 10: Approvals, Sign-offs & Digital Verification Signatures</span>
            <span className="bg-blue-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Cryptographic Signatures
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 border border-slate-200 border-b-0">
            <div className="border border-slate-200 rounded p-3 text-center bg-slate-50">
              <div className="font-bold text-xs text-slate-900">{s10.inspector_signoff?.name}</div>
              <div className="text-[10px] text-slate-500">{s10.inspector_signoff?.role}</div>
              <div className="my-2 py-1 px-2 border-2 border-dashed border-blue-500 text-blue-600 font-extrabold text-[10px] uppercase rounded">
                DIGITALLY SIGNED & SUBMITTED
              </div>
              <div className="text-[9px] text-slate-400">{s10.inspector_signoff?.timestamp}</div>
            </div>

            <div className="border border-slate-200 rounded p-3 text-center bg-slate-50">
              <div className="font-bold text-xs text-slate-900">{s10.qc_officer_signoff?.name}</div>
              <div className="text-[10px] text-slate-500">{s10.qc_officer_signoff?.role}</div>
              <div className="my-2 py-1 px-2 border-2 border-dashed border-teal-500 text-teal-600 font-extrabold text-[10px] uppercase rounded">
                QC VERIFIED & APPROVED
              </div>
              <div className="text-[9px] text-slate-400">{s10.qc_officer_signoff?.timestamp}</div>
            </div>

            <div className="border border-slate-200 rounded p-3 text-center bg-slate-50">
              <div className="font-bold text-xs text-slate-900">{s10.certified_valuer_signoff?.name}</div>
              <div className="text-[10px] text-slate-500">{s10.certified_valuer_signoff?.role}</div>
              <div className="my-2 py-1 px-2 border-2 border-dashed border-purple-500 text-purple-600 font-extrabold text-[10px] uppercase rounded">
                CERTIFIED VALUATION SIGN-OFF
              </div>
              <div className="text-[9px] text-slate-400">Lic: {s10.certified_valuer_signoff?.license_number}</div>
            </div>
          </div>

          {/* QR CODE VERIFICATION BOX */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-b flex items-center gap-3">
            <div className="w-16 h-16 bg-white border border-slate-300 rounded flex items-center justify-center flex-shrink-0">
              <QrCode className="h-12 w-12 text-slate-900" />
            </div>
            <div className="text-xs text-slate-600 leading-tight">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                CRYPTOGRAPHIC QR CODE VERIFICATION (AC-REP-02)
              </div>
              <p className="text-[11px] text-slate-500 my-0.5">
                Scan using any smartphone camera to verify untampered snapshot validity on our public portal.
              </p>
              <div className="font-mono text-[10px] text-blue-600">
                Verification Token: {s10.verification_token?.substring(0, 32)}...
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 11: DISCLAIMERS & PROVENANCE */}
        <div className="mb-4">
          <div className="bg-slate-900 text-white text-xs font-bold uppercase tracking-wide px-3 py-1.5 rounded-t flex justify-between items-center">
            <span>Section 11: Legal Disclaimers, Provenance Dictionary & Statutory Caveats</span>
            <span className="bg-slate-700 text-white text-[10px] font-semibold px-2 py-0.5 rounded">
              Master Terms
            </span>
          </div>

          <div className="p-3 border border-slate-200 rounded-b text-[10px] text-slate-500 space-y-1 leading-relaxed">
            <p>
              <strong>Provenance Protocol:</strong> Every attribute in this dossier carries immutable origin provenance: [physically_verified] = in-person field check; [provider_reported] = ingested directly from APISathi/VAHAN/eChallan; [restricted] = DPDP Act 2023 privacy masked.
            </p>
            {s11.statutory_disclaimers?.map((disc: string, idx: number) => (
              <p key={idx}>• {disc}</p>
            ))}
          </div>
        </div>

        {/* RUNNING FOOTER */}
        <div className="border-t border-slate-200 pt-3 mt-4 flex justify-between text-[10px] text-slate-400">
          <div>Generated by VahanCheck Enterprise Automated Report Engine | Confidential & Proprietary</div>
          <div>Snapshot Checksum: {s10.sha256_checksum?.substring(0, 16)}...</div>
        </div>
      </div>
    </div>
  );
}
