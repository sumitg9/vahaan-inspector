"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  ArrowLeft,
  AlertTriangle,
  Lock,
  User,
  Clock,
  Eye,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  organization_name: string;
  user_name: string;
  user_role: string;
  ip_address: string;
  created_at: string;
  old_values?: any;
  new_values?: any;
}

interface SecurityAlertItem {
  id: string;
  alert_type: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  target_resource: string;
  resource_id: string;
  details: any;
  actor_user: string;
  actor_role: string;
  actor_ip: string;
  timestamp: string;
}

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: "aud_01",
    action: "ORGANIZATION_PROVISIONED",
    entity_type: "organizations",
    entity_id: "org_9910",
    organization_name: "SpeedCheck Valuers",
    user_name: "Vikram Malhotra",
    user_role: "SUPER_ADMIN",
    ip_address: "192.168.1.10",
    created_at: "Today, 06:15 PM",
    old_values: null,
    new_values: { name: "Apex Auto Surveyors LLP", tier: "PROFESSIONAL", credits: 500 },
  },
  {
    id: "aud_02",
    action: "VALUATION_OVERRIDE_APPROVED",
    entity_type: "valuations",
    entity_id: "val_4412",
    organization_name: "SpeedCheck Valuers",
    user_name: "Er. Dilip Deshmukh",
    user_role: "VALUER",
    ip_address: "192.168.1.42",
    created_at: "Today, 05:40 PM",
    old_values: { fair_market_value_inr: "₹18,50,000", is_certified: false },
    new_values: {
      fair_market_value_inr: "₹19,20,000",
      override_reason: "High market demand for 28-tonne tippers in Pune-Solapur infrastructure corridor.",
      is_certified: true,
      owner_name_masked: "M**** S**** LOGISTICS",
    },
  },
  {
    id: "aud_03",
    action: "WALLET_CREDITS_ADJUSTED",
    entity_type: "credit_wallets",
    entity_id: "wal_1109",
    organization_name: "SpeedCheck Valuers",
    user_name: "Vikram Malhotra",
    user_role: "SUPER_ADMIN",
    ip_address: "192.168.1.10",
    created_at: "Today, 04:30 PM",
    old_values: { balance_credits: 450 },
    new_values: { balance_credits: 950, delta: 500, reason: "Enterprise Pilot Top-up approved" },
  },
  {
    id: "aud_04",
    action: "PROVIDER_CONFIGURATION_UPDATED",
    entity_type: "providers",
    entity_id: "apisathi",
    organization_name: "System Central",
    user_name: "Vikram Malhotra",
    user_role: "SUPER_ADMIN",
    ip_address: "192.168.1.10",
    created_at: "Today, 03:15 PM",
    old_values: { environment: "TESTING", timeout_ms: 5000 },
    new_values: { environment: "SANDBOX", timeout_ms: 8000, api_key: "sk_live_••••••••9921" },
  },
  {
    id: "aud_05",
    action: "VEHICLE_REGISTRY_LOOKUP",
    entity_type: "vehicles",
    entity_id: "MH12AB1234",
    organization_name: "SpeedCheck Valuers",
    user_name: "Rajesh Kumar",
    user_role: "INSPECTOR",
    ip_address: "192.168.2.88",
    created_at: "Today, 02:22 PM",
    old_values: null,
    new_values: {
      registration: "MH12AB1234",
      dpdp_owner_masked: "M**** S**** LOGISTICS LLP",
      chassis_vin_masked: "MAT628••••••••129",
      engine_masked: "497TC••••••••098",
      consent_obtained: true,
    },
  },
];

const INITIAL_SECURITY_ALERTS: SecurityAlertItem[] = [
  {
    id: "sec_01",
    alert_type: "PRIVILEGE_ESCALATION_ATTEMPT",
    severity: "CRITICAL",
    target_resource: "users",
    resource_id: "usr_attempt_01",
    details: {
      attempted_role: "SUPER_ADMIN",
      actor_role: "ORG_ADMIN",
      description: "Organization Admin attempted to create a SUPER_ADMIN account.",
    },
    actor_user: "Amitabh Sen",
    actor_role: "ORG_ADMIN",
    actor_ip: "103.21.12.9",
    timestamp: "24 Nov 2026, 04:15 PM",
  },
  {
    id: "sec_02",
    alert_type: "CROSS_TENANT_ACCESS_ATTEMPT",
    severity: "HIGH",
    target_resource: "inspection_cases",
    resource_id: "case_9981-transnational",
    details: {
      requested_org_id: "33333333-3333-3333-3333-333333333333",
      actor_org_id: "11111111-1111-1111-1111-111111111111",
      description: "User attempted to fetch un-scoped inspection report belonging to another tenant.",
    },
    actor_user: "Rajesh Kumar",
    actor_role: "INSPECTOR",
    actor_ip: "103.21.12.88",
    timestamp: "24 Nov 2026, 01:10 PM",
  },
  {
    id: "sec_03",
    alert_type: "INVARIANT_2_VIOLATION_ATTEMPT",
    severity: "HIGH",
    target_resource: "providers",
    resource_id: "apisathi",
    details: {
      error: "Attempted to enable mock_fallback_enabled in PRODUCTION environment.",
      blocked_by: "ProviderConfigController::update",
    },
    actor_user: "Vikram Malhotra",
    actor_role: "SUPER_ADMIN",
    actor_ip: "192.168.1.10",
    timestamp: "23 Nov 2026, 11:45 AM",
  },
];

export default function AdminAuditPage() {
  const [activeTab, setActiveTab] = useState<"LOGS" | "ALERTS">("LOGS");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = INITIAL_AUDIT_LOGS.filter((l) => {
    return (
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.user_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail & Security Telemetry</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system audit logs with DPDP Act 2023 citizen redaction and critical security alert triggers.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
          <button
            onClick={() => setActiveTab("LOGS")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "LOGS" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand" /> System Audit Logs
          </button>
          <button
            onClick={() => setActiveTab("ALERTS")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "ALERTS" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:text-red-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Security Alerts ({INITIAL_SECURITY_ALERTS.length})
          </button>
        </div>
      </div>

      {/* Prohibit Unrestricted Sensitive Data Access Notice (DPDP Act 2023) */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-blue-950">
          <span className="font-bold">PROHIBITION OF UNRESTRICTED SENSITIVE-DATA ACCESS (DPDP ACT 2023):</span> Even
          privileged Super Admin users cannot view unmasked citizen PII. All registered owner names, phone numbers,
          and sensitive vehicle stamps in audit payload values are automatically masked (e.g.{" "}
          <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">M**** S****</code>,{" "}
          <code className="font-mono bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-bold">••••••••1234</code>).
        </div>
      </div>

      {activeTab === "LOGS" ? (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by action, entity, or actor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
            />
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action Event</th>
                    <th className="px-4 py-3">Entity Type</th>
                    <th className="px-4 py-3">Actor / User</th>
                    <th className="px-4 py-3">Tenant Organization</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3 text-right">Payload Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{log.created_at}</td>
                          <td className="px-4 py-3">
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700 capitalize">{log.entity_type}</td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{log.user_name}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-mono">{log.user_role}</div>
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-700">{log.organization_name}</td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{log.ip_address}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="px-2.5 py-1 text-[11px] font-bold text-brand hover:text-brand-hover inline-flex items-center gap-1"
                            >
                              {isExpanded ? "Hide" : "Inspect"}{" "}
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-50/90">
                            <td colSpan={7} className="px-5 py-4 border-b border-slate-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                  <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">
                                    Previous State (Old Values):
                                  </div>
                                  <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 overflow-x-auto text-[11px]">
                                    {log.old_values ? JSON.stringify(log.old_values, null, 2) : "null (Record Creation)"}
                                  </pre>
                                </div>
                                <div>
                                  <div className="font-bold text-slate-500 uppercase text-[10px] mb-1">
                                    Committed State (New Values with DPDP Masking):
                                  </div>
                                  <pre className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 overflow-x-auto text-[11px]">
                                    {log.new_values ? JSON.stringify(log.new_values, null, 2) : "null (Record Deletion)"}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Security Alerts Tab */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {INITIAL_SECURITY_ALERTS.map((alert) => (
              <div
                key={alert.id}
                className="bg-white border-l-4 border-l-red-600 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {alert.alert_type}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-red-600 text-white">
                      {alert.severity} SEVERITY
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" /> {alert.timestamp}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-700 space-y-1">
                  <div>
                    <strong>Target Resource:</strong>{" "}
                    <code className="font-mono text-slate-900">
                      {alert.target_resource} ({alert.resource_id})
                    </code>
                  </div>
                  <div>
                    <strong>Actor:</strong> {alert.actor_user} ({alert.actor_role}) • IP:{" "}
                    <code className="font-mono">{alert.actor_ip}</code>
                  </div>
                </div>

                <div className="text-xs font-mono bg-white p-3 rounded-lg border border-slate-200 text-slate-800 overflow-x-auto">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Forensic Details:</div>
                  <pre>{JSON.stringify(alert.details, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
