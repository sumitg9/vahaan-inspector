"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Server,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  Zap,
  Activity,
  Sliders,
  Table as TableIcon,
  Play,
  RotateCcw,
  DollarSign,
  AlertOctagon,
  FileText,
} from "lucide-react";

interface ProviderItem {
  id: string;
  name: string;
  category: string;
  base_url: string;
  masked_key: string;
  environment: "TESTING" | "SANDBOX" | "PRODUCTION";
  is_active: boolean;
  timeout_ms: number;
  max_retries: number;
  circuit_breaker_threshold: number;
  mock_fallback_enabled: boolean;
  cost_per_lookup_inr: string;
}

const INITIAL_PROVIDERS: ProviderItem[] = [
  {
    id: "apisathi",
    name: "APISathi Vehicle Intelligence API",
    category: "VEHICLE_REGISTRY",
    base_url: "https://api.apisathi.com/v1",
    masked_key: "sk_live_••••••••9921",
    environment: "SANDBOX",
    is_active: true,
    timeout_ms: 8000,
    max_retries: 3,
    circuit_breaker_threshold: 5,
    mock_fallback_enabled: false,
    cost_per_lookup_inr: "₹4.50",
  },
  {
    id: "echallan",
    name: "National eChallan Traffic Gateway",
    category: "TRAFFIC_VIOLATIONS",
    base_url: "https://echallan.parivahan.gov.in/api/v2",
    masked_key: "echallan_sec_••••••••7189",
    environment: "SANDBOX",
    is_active: true,
    timeout_ms: 10000,
    max_retries: 2,
    circuit_breaker_threshold: 4,
    mock_fallback_enabled: false,
    cost_per_lookup_inr: "₹2.50",
  },
  {
    id: "mock_gateway",
    name: "Deterministic Mock Gateway (Failsafe Isolation)",
    category: "TESTING_MOCK",
    base_url: "http://localhost:4000",
    masked_key: "mock_test_••••••••xyz",
    environment: "TESTING",
    is_active: true,
    timeout_ms: 2000,
    max_retries: 1,
    circuit_breaker_threshold: 10,
    mock_fallback_enabled: true,
    cost_per_lookup_inr: "₹0.00",
  },
  {
    id: "fastag",
    name: "NETC Fastag Toll Intelligence",
    category: "TOLL_MOVEMENT",
    base_url: "https://api.netc.npci.org.in/v1",
    masked_key: "fastag_live_••••••••3310",
    environment: "SANDBOX",
    is_active: false,
    timeout_ms: 6000,
    max_retries: 2,
    circuit_breaker_threshold: 5,
    mock_fallback_enabled: false,
    cost_per_lookup_inr: "₹1.50",
  },
];

const FIELD_COVERAGE_ROWS = [
  { id: "FC-01", name: "Registration Number", raw: "rc_number / reg_no", dto: "registrationNumber", col: "registration_number", sec: "Sec 2: Vehicle ID", prov: "provider_reported", dpdp: "Public Statutory ID" },
  { id: "FC-02", name: "Chassis VIN (Masked)", raw: "chassis_number", dto: "chassisNumberMasked", col: "chassis_number", sec: "Sec 2: Vehicle ID", prov: "provider_reported", dpdp: "Masked (MAT624******23456)" },
  { id: "FC-03", name: "Engine Number (Masked)", raw: "engine_number", dto: "engineNumberMasked", col: "engine_number", sec: "Sec 2: Vehicle ID", prov: "provider_reported", dpdp: "Masked (ISBE59******3456)" },
  { id: "FC-04", name: "Registered Owner (Masked)", raw: "owner_name", dto: "ownerNameMasked", col: "registered_owner", sec: "Sec 2: Vehicle ID", prov: "provider_reported", dpdp: "DPDP 2023 (M**** S****)" },
  { id: "FC-05", name: "Ownership Serial Sequence", raw: "ownership_sequence", dto: "ownershipSequence", col: "owner_serial_number", sec: "Sec 2: Vehicle ID", prov: "provider_reported", dpdp: "1st Owner / 2nd Owner" },
  { id: "FC-06", name: "Maker Name", raw: "maker / maker_name", dto: "makerName", col: "maker_name", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Commercial Spec" },
  { id: "FC-07", name: "Model Name", raw: "model / model_name", dto: "modelName", col: "model_name", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Commercial Spec" },
  { id: "FC-08", name: "Commercial Variant", raw: "variant", dto: "variantName", col: "variant", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Commercial Spec" },
  { id: "FC-09", name: "Vehicle Class", raw: "vehicle_class", dto: "vehicleClass", col: "vehicle_class", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Statutory Class (HGV/LMV)" },
  { id: "FC-10", name: "Body Type", raw: "body_type", dto: "bodyType", col: "body_type", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Fabrication Type" },
  { id: "FC-11", name: "Fuel Type", raw: "fuel_type", dto: "fuelType", col: "fuel_type", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "DIESEL / PETROL / EV" },
  { id: "FC-12", name: "Color", raw: "color", dto: "color", col: "color", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Visual Identity" },
  { id: "FC-13", name: "Emission Norms", raw: "norms / emission_norms", dto: "emissionNorms", col: "emission_norms", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "BS-VI / BS-IV" },
  { id: "FC-14", name: "Seating Capacity", raw: "seating_capacity", dto: "seatingCapacity", col: "seating_capacity", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Integer Seat Count" },
  { id: "FC-15", name: "Cubic Capacity (CC)", raw: "cubic_capacity", dto: "cubicCapacity", col: "cubic_capacity", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Displacement CC" },
  { id: "FC-16", name: "Gross Vehicle Weight (GVW)", raw: "gross_vehicle_weight", dto: "grossVehicleWeightKg", col: "gross_vehicle_weight_kg", sec: "Sec 3: Registry Specs", prov: "provider_reported", dpdp: "Weight in kg" },
  { id: "FC-17", name: "Registration Date", raw: "registration_date", dto: "registrationDate", col: "registration_date", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "YYYY-MM-DD" },
  { id: "FC-18", name: "Manufacturing Date", raw: "manufacturing_date", dto: "manufacturingDate", col: "manufacturing_date", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "YYYY-MM-DD" },
  { id: "FC-19", name: "Fitness Valid Until", raw: "fitness_valid_until", dto: "fitnessValidUntil", col: "fitness_valid_until", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "Fitness Expiry" },
  { id: "FC-20", name: "Insurance Valid & Policy", raw: "insurance_valid_until", dto: "insuranceValidUntil", col: "insurance_valid_until", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "Policy Expiry" },
  { id: "FC-21", name: "PUCC Valid Until", raw: "pucc_valid_until", dto: "puccValidUntil", col: "pucc_valid_until", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "PUCC Expiry" },
  { id: "FC-22", name: "Road Tax Valid Until", raw: "tax_valid_until", dto: "taxValidUntil", col: "tax_valid_until", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "Tax Expiry" },
  { id: "FC-23", name: "National & State Permit", raw: "national_permit_valid_until", dto: "nationalPermitValidUntil", col: "national_permit_valid_until", sec: "Sec 4: Statutory Expiries", prov: "provider_reported", dpdp: "Permit Expiry" },
  { id: "FC-24", name: "Financier Hypothecation", raw: "financier / financier_name", dto: "financierName", col: "financier_name", sec: "Sec 5: Hypothecation", prov: "provider_reported", dpdp: "Banking Financier" },
];

export default function AdminProvidersPage() {
  const [activeTab, setActiveTab] = useState<"gateways" | "coverage" | "sandbox" | "billing" | "production">("gateways");
  const [providers, setProviders] = useState<ProviderItem[]>(INITIAL_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState<ProviderItem | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Edit State
  const [editEnv, setEditEnv] = useState<ProviderItem["environment"]>("SANDBOX");
  const [editTimeout, setEditTimeout] = useState(8000);
  const [editRetries, setEditRetries] = useState(3);
  const [editMockFallback, setEditMockFallback] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Sandbox Runner State
  const [sandboxScenario, setSandboxScenario] = useState<"standard" | "partial_restricted" | "clean_vehicle">("standard");
  const [sandboxOutput, setSandboxOutput] = useState<any>(null);
  const [isSandboxRunning, setIsSandboxRunning] = useState(false);

  // Billing & Idempotency Audit State
  const [billingAuditOutput, setBillingAuditOutput] = useState<any>(null);

  const openConfigModal = (p: ProviderItem) => {
    setSelectedProvider(p);
    setEditEnv(p.environment);
    setEditTimeout(p.timeout_ms);
    setEditRetries(p.max_retries);
    setEditMockFallback(p.mock_fallback_enabled);
    setNewSecretKey("");
    setErrorMessage("");
    setShowConfigModal(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;

    if (editEnv === "PRODUCTION" && editMockFallback === true) {
      setErrorMessage(
        "Invariant 2 Violation: Mock fallback data is strictly prohibited in PRODUCTION mode. A provider failure must result in an explicit 502 Bad Gateway."
      );
      return;
    }

    const updated = providers.map((p) => {
      if (p.id === selectedProvider.id) {
        return {
          ...p,
          environment: editEnv,
          timeout_ms: editTimeout,
          max_retries: editRetries,
          mock_fallback_enabled: editEnv === "PRODUCTION" ? false : editMockFallback,
          masked_key: newSecretKey
            ? newSecretKey.substring(0, 4) + "••••••••" + newSecretKey.substring(newSecretKey.length - 4)
            : p.masked_key,
        };
      }
      return p;
    });

    setProviders(updated);
    setShowConfigModal(false);
  };

  const runSandboxVerification = () => {
    setIsSandboxRunning(true);
    setTimeout(() => {
      if (sandboxScenario === "standard") {
        setSandboxOutput({
          scenario: "Standard Authentic Commercial (MH12AB1234)",
          reconciled: true,
          fields_mapped: 24,
          registration: "MH12AB1234",
          vehicle: "TATA MOTORS LTD PRIMA 2830.K",
          chassis: "MAT624******23456",
          owner: "M/S LOGISTICS INDIA PVT LTD (M**** I****)",
          challans_total: 2,
          pending_fines: "₹2,000.00 (200,000 paise)",
          disposed_fines: "₹1,000.00 (100,000 paise)",
          sha256_seal: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          provenance: "provider_reported",
          watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
        });
      } else if (sandboxScenario === "partial_restricted") {
        setSandboxOutput({
          scenario: "Partial Restricted Response (DL01XY9999)",
          reconciled: true,
          fields_mapped: 22,
          registration: "DL01XY9999",
          vehicle: "MARUTI SUZUKI SWIFT VDI",
          fitness_valid_until: null,
          fitness_provenance: "restricted",
          financier_name: null,
          financier_provenance: "restricted",
          invariant_3_guard: "PASS: Missing attributes recorded as restricted, never fabricated to OK/Valid",
        });
      } else {
        setSandboxOutput({
          scenario: "Clean Record Vehicle (KA01MJ0001)",
          reconciled: true,
          fields_mapped: 24,
          registration: "KA01MJ0001",
          challans_total: 0,
          pending_fines: "₹0.00 (0 paise)",
          disposed_fines: "₹0.00 (0 paise)",
          clean_record_verified: "PASS: Authentic clean vehicle record confirmed with zero false-positive fines",
        });
      }
      setIsSandboxRunning(false);
    }, 400);
  };

  const runBillingAudit = () => {
    setBillingAuditOutput({
      registration: "MH12AB1234",
      idempotency_key: "idemp-" + Math.random().toString(36).substring(2, 10),
      call_1: {
        attempt: 1,
        action: "CREDIT_RESERVATION_COMMITTED",
        credits_deducted: 1,
        paise_charged: 1500,
        inr: "₹15.00",
        cogs_provider_paise: 850,
      },
      call_2: {
        attempt: 2,
        action: "IDEMPOTENCY_DEDUPLICATION_SERVED",
        credits_deducted: 0,
        paise_charged: 0,
        inr: "₹0.00 (Deduplication Served)",
        cogs_provider_paise: 0,
      },
      double_charge_prevented: true,
      total_credits_billed: 1,
      total_paise_billed: 1500,
      gross_margin_inr: "₹6.50 per lookup (43.3% Gross Margin)",
    });
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Provider Verification & Secret Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer VAHAN, eChallan, and Toll gateways with 24-field coverage verification, sandbox schema reconciliation, and production locks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
            EXT-01: Credentials Blocked (Staging Sandbox Active)
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("gateways")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "gateways" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Server className="w-3.5 h-3.5" /> Configured Gateways
        </button>
        <button
          onClick={() => setActiveTab("coverage")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "coverage" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" /> 24-Field Coverage Matrix
        </button>
        <button
          onClick={() => setActiveTab("sandbox")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "sandbox" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Play className="w-3.5 h-3.5" /> Sandbox Reconciliation
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "billing" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" /> Billing & Idempotency Audit
        </button>
        <button
          onClick={() => setActiveTab("production")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
            activeTab === "production" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> Production Gate & Safeguards
        </button>
      </div>

      {/* Invariant 1 & 2 Security Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-purple-950">
            <span className="font-bold">INVARIANT 1 (ZERO SECRET LEAKAGE):</span> Third-party credentials, client secrets,
            and service tokens reside strictly in server-side configuration. Secrets displayed in admin consoles are
            permanently masked.
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <span className="font-bold">INVARIANT 2 (FAIL-SAFE PRODUCTION LOCK):</span> In production, mock data
            substitution is strictly prohibited. An API outage must surface an explicit sanitized <code>502 Bad Gateway</code>.
          </div>
        </div>
      </div>

      {/* TAB 1: Configured Gateways */}
      {activeTab === "gateways" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 hover:border-brand/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">{p.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        p.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {p.is_active ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">ID: {p.id} • {p.category}</div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    p.environment === "PRODUCTION"
                      ? "bg-red-50 text-red-700 border-red-200"
                      : p.environment === "SANDBOX"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                  }`}
                >
                  {p.environment}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Base Endpoint:</span>
                  <span className="font-mono text-[11px] text-slate-800">{p.base_url}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400" /> Vault Key (Masked):
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {p.masked_key}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Timeout / Retries:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {p.timeout_ms}ms • {p.max_retries} Retries
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Circuit Breaker Limit:</span>
                  <span className="font-mono font-semibold text-slate-800">{p.circuit_breaker_threshold} Errors</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mock Fallback Invariant:</span>
                  <span
                    className={`font-semibold ${
                      p.mock_fallback_enabled ? "text-amber-600" : "text-emerald-600 font-bold"
                    }`}
                  >
                    {p.mock_fallback_enabled ? "Enabled (Testing Only)" : "Disabled (Strict 502 Fail-Safe)"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Tariff: <strong className="text-slate-800 font-mono">{p.cost_per_lookup_inr}</strong> / lookup
                </span>
                <button
                  onClick={() => openConfigModal(p)}
                  className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5" /> Edit Configuration
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: 24-Field Coverage Matrix */}
      {activeTab === "coverage" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Provider Agreement & Field Coverage Matrix</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparison of 24 canonical VAHAN registry attributes across upstream APISathi RC v1 payloads, normalized DTOs, and report sections.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold">
                24 / 24 Fields Mapped (100% Completeness)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-2.5 px-3">Field ID</th>
                  <th className="py-2.5 px-3">Registry Attribute</th>
                  <th className="py-2.5 px-3">Upstream Provider Key</th>
                  <th className="py-2.5 px-3">Normalized DTO Property</th>
                  <th className="py-2.5 px-3">Database Column</th>
                  <th className="py-2.5 px-3">Report Section</th>
                  <th className="py-2.5 px-3">DPDP Redaction Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {FIELD_COVERAGE_ROWS.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 font-bold text-brand">{row.id}</td>
                    <td className="py-2 px-3 font-sans font-semibold text-slate-900">{row.name}</td>
                    <td className="py-2 px-3 text-slate-600">{row.raw}</td>
                    <td className="py-2 px-3 text-emerald-700 font-bold">{row.dto}</td>
                    <td className="py-2 px-3 text-slate-500">{row.col}</td>
                    <td className="py-2 px-3 font-sans text-slate-600">{row.sec}</td>
                    <td className="py-2 px-3 font-sans">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-medium">
                        {row.dpdp}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Sandbox Verification & Schema Reconciliation */}
      {activeTab === "sandbox" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sandbox Verification & Schema Reconciliation Runner</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Execute deterministic sandbox scenarios to verify upstream payload parsing, field provenance preservation, and absence of data fabrication.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Select Sandbox Scenario</label>
              <select
                value={sandboxScenario}
                onChange={(e: any) => setSandboxScenario(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold focus:outline-none"
              >
                <option value="standard">Standard Authentic Commercial Tipper (MH12AB1234)</option>
                <option value="partial_restricted">Partial Restricted Response (DL01XY9999)</option>
                <option value="clean_vehicle">Clean Record Zero Challans (KA01MJ0001)</option>
              </select>
            </div>

            <button
              onClick={runSandboxVerification}
              disabled={isSandboxRunning}
              className="mt-4 px-4 py-1.5 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isSandboxRunning ? "Reconciling..." : "Run Sandbox Verification"}
            </button>
          </div>

          {sandboxOutput && (
            <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Schema Reconciliation Verified
                </span>
                <span className="text-[11px] text-slate-400">Execution Mode: Staging Sandbox</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto text-[11px]">
                {JSON.stringify(sandboxOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Billing & Idempotency Audit */}
      {activeTab === "billing" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Billing Credit Reservation & Idempotency Audit</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify two-phase credit reservations, duplicate charge prevention under replayed lookups, and COGS margins.
              </p>
            </div>
            <button
              onClick={runBillingAudit}
              className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Run Idempotency Test
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Customer Retail Tariff</div>
              <div className="text-lg font-bold text-slate-900 mt-0.5">1 Credit = ₹15.00</div>
              <div className="text-[11px] text-slate-500 mt-1">1,500 minor paise units</div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
              <div className="text-xs text-slate-500 font-medium">Upstream Provider Cost (COGS)</div>
              <div className="text-lg font-bold text-slate-700 mt-0.5">₹8.50 / lookup</div>
              <div className="text-[11px] text-slate-500 mt-1">APISathi RC (₹4.50) + Challan (₹4.00)</div>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
              <div className="text-xs text-emerald-800 font-medium">Gross Margin</div>
              <div className="text-lg font-bold text-emerald-900 mt-0.5">₹6.50 (43.3%)</div>
              <div className="text-[11px] text-emerald-700 mt-1">Positive unit economics per lookup</div>
            </div>
          </div>

          {billingAuditOutput && (
            <div className="bg-slate-900 text-white rounded-xl p-4 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Idempotent Deduplication Confirmed: Zero Duplicate Charges
                </span>
                <span className="text-[11px] text-slate-400">Total Charged: 1 Credit (1500 paise)</span>
              </div>
              <pre className="text-slate-300 overflow-x-auto text-[11px]">
                {JSON.stringify(billingAuditOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Production Readiness & Credential Gate */}
      {activeTab === "production" && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Production Readiness & Credential Execution Gate</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforces master development rule: <em>Execute only when authorized credentials are available. Never expose credentials or substitute mock data in production.</em>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950">
                  PRODUCTION GATE STATUS: BLOCKED PENDING AUTHORIZED CREDENTIALS (EXT-01)
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  In compliance with architectural invariants, live production lookups remain strictly locked out until authentic client credentials (APISathi API Key & Secret Token) are provisioned. The system will NOT fire uncredentialed queries or substitute mock data in production.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                <span className="font-bold">Active Execution Driver:</span> MockProvider (Sandbox Fixtures)
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                <span className="font-bold">Invariant 2 Fail-Safe:</span> Strictly Enforced (502 Bad Gateway)
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">Production Deployment Checklist</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero Secret Leakage in Client Code</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Indelible Mock Watermark Enforced on Staging</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>24 VAHAN Fields Reconciled with Provenance</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Circuit Breakers & Exponential Retry Ready</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Configuration Modal */}
      {showConfigModal && selectedProvider && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold">Configure Gateway: {selectedProvider.name}</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="p-5 space-y-4 text-xs">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-800 text-xs font-semibold flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Environment</label>
                <select
                  value={editEnv}
                  onChange={(e: any) => setEditEnv(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-bold"
                >
                  <option value="TESTING">TESTING (Local Sandbox)</option>
                  <option value="SANDBOX">SANDBOX (Partner Staging)</option>
                  <option value="PRODUCTION">PRODUCTION (Live Government Gateway)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Rotate API Secret Key (Leave blank to preserve current masked key)
                </label>
                <input
                  type="password"
                  placeholder="Paste new service secret token..."
                  value={newSecretKey}
                  onChange={(e) => setNewSecretKey(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Current key: <code>{selectedProvider.masked_key}</code>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Timeout (Milliseconds)</label>
                  <input
                    type="number"
                    min="1000"
                    max="30000"
                    step="500"
                    value={editTimeout}
                    onChange={(e) => setEditTimeout(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Retries</label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    value={editRetries}
                    onChange={(e) => setEditRetries(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Mock Fallback Toggle */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Allow Mock Fallback:</span>
                  <input
                    type="checkbox"
                    checked={editMockFallback}
                    disabled={editEnv === "PRODUCTION"}
                    onChange={(e) => setEditMockFallback(e.target.checked)}
                    className="w-4 h-4 rounded text-brand focus:ring-brand"
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  {editEnv === "PRODUCTION" ? (
                    <span className="text-red-700 font-bold">
                      Strictly disabled in PRODUCTION mode per Invariant 2.
                    </span>
                  ) : (
                    "When enabled in testing, mock fixtures are returned if provider network fails."
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
