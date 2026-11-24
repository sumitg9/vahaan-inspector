"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wallet,
  ArrowLeft,
  Edit2,
  Lock,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

interface OrgItem {
  id: string;
  name: string;
  legal_name: string;
  slug: string;
  email: string;
  phone: string;
  gst_number: string;
  status: "ACTIVE" | "SUSPENDED" | "TRIAL";
  tier: "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
  branches_count: number;
  users_count: number;
  inspections_count: number;
  wallet_balance_credits: number;
  wallet_balance_formatted: string;
}

const INITIAL_ORGS: OrgItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "SpeedCheck Valuers Pvt Ltd",
    legal_name: "SpeedCheck Inspection & Valuers India Private Limited",
    slug: "speedcheck-valuers",
    email: "contact@speedcheck.in",
    phone: "+91 98201 12345",
    gst_number: "27AABCS1429B1Z8",
    status: "ACTIVE",
    tier: "ENTERPRISE",
    branches_count: 4,
    users_count: 28,
    inspections_count: 840,
    wallet_balance_credits: 950,
    wallet_balance_formatted: "₹14,250.00",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Apex Auto Surveyors LLP",
    legal_name: "Apex Auto Assessment & Valuation Services LLP",
    slug: "apex-surveyors",
    email: "admin@apexsurveyors.com",
    phone: "+91 98400 54321",
    gst_number: "33AAFFA9910C1Z4",
    status: "ACTIVE",
    tier: "PROFESSIONAL",
    branches_count: 2,
    users_count: 14,
    inspections_count: 310,
    wallet_balance_credits: 420,
    wallet_balance_formatted: "₹6,300.00",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "TransNational Fleet Inspections",
    legal_name: "TransNational Transport Logistics & Auditing Co",
    slug: "transnational-fleet",
    email: "ops@transnational.co.in",
    phone: "+91 91234 98765",
    gst_number: "07AAACT8821D1Z1",
    status: "TRIAL",
    tier: "STARTER",
    branches_count: 1,
    users_count: 5,
    inspections_count: 60,
    wallet_balance_credits: 80,
    wallet_balance_formatted: "₹1,200.00",
  },
];

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState<OrgItem[]>(INITIAL_ORGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<OrgItem | null>(null);

  // Create Form State
  const [newName, setNewName] = useState("");
  const [newLegalName, setNewLegalName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newGst, setNewGst] = useState("");
  const [newTier, setNewTier] = useState<"STARTER" | "PROFESSIONAL" | "ENTERPRISE">("ENTERPRISE");
  const [newCredits, setNewCredits] = useState("500");

  // Credit Adjustment State
  const [creditDelta, setCreditDelta] = useState("100");
  const [creditReason, setCreditReason] = useState("");

  const filteredOrgs = orgs.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.legal_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const creditsNum = parseInt(newCredits, 10) || 500;
    const newOrg: OrgItem = {
      id: "org_" + Date.now(),
      name: newName,
      legal_name: newLegalName || newName,
      slug: newName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      email: newEmail,
      phone: newPhone || "+91 99000 00000",
      gst_number: newGst || "27AABCS0000A1Z0",
      status: "ACTIVE",
      tier: newTier,
      branches_count: 1,
      users_count: 1,
      inspections_count: 0,
      wallet_balance_credits: creditsNum,
      wallet_balance_formatted: "₹" + (creditsNum * 15).toFixed(2),
    };

    setOrgs([newOrg, ...orgs]);
    setShowCreateModal(false);
    setNewName("");
    setNewLegalName("");
    setNewEmail("");
    setNewPhone("");
    setNewGst("");
  };

  const handleAdjustCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg || !creditDelta || !creditReason) return;

    const deltaNum = parseInt(creditDelta, 10);
    const updated = orgs.map((o) => {
      if (o.id === selectedOrg.id) {
        const newBal = Math.max(0, o.wallet_balance_credits + deltaNum);
        return {
          ...o,
          wallet_balance_credits: newBal,
          wallet_balance_formatted: "₹" + (newBal * 15).toFixed(2),
        };
      }
      return o;
    });

    setOrgs(updated);
    setShowWalletModal(false);
    setSelectedOrg(null);
    setCreditDelta("100");
    setCreditReason("");
  };

  const toggleOrgStatus = (id: string) => {
    setOrgs(
      orgs.map((o) => {
        if (o.id === id) {
          const nextStatus = o.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
          return { ...o, status: nextStatus };
        }
        return o;
      })
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Super Admin Console
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization & Tenant Governance</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer multi-tenant agencies, regional branches, and credit wallet ledgers with strict tenant isolation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Provision New Tenant
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by organization name, legal name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {["ALL", "ACTIVE", "TRIAL", "SUSPENDED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                statusFilter === s
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Branches</th>
                <th className="px-4 py-3">Users</th>
                <th className="px-4 py-3">Wallet Credits</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map((org) => (
                <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name and Details */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-brand flex-shrink-0" />
                      {org.name}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{org.legal_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      GST: {org.gst_number} • {org.email}
                    </div>
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                      {org.tier}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit ${
                        org.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : org.status === "TRIAL"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {org.status === "ACTIVE" ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : org.status === "TRIAL" ? (
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      {org.status}
                    </span>
                  </td>

                  {/* Branches */}
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    <Link
                      href="/settings/branches"
                      className="hover:text-brand underline decoration-dotted"
                      title="Manage branches"
                    >
                      {org.branches_count} Yards
                    </Link>
                  </td>

                  {/* Users */}
                  <td className="px-4 py-3.5 font-semibold text-slate-700">
                    <Link
                      href="/admin/users"
                      className="hover:text-purple-700 underline decoration-dotted"
                      title="View tenant users"
                    >
                      {org.users_count} Users
                    </Link>
                  </td>

                  {/* Wallet Credits (Paise / minor units precision) */}
                  <td className="px-4 py-3.5">
                    <div className="font-mono font-bold text-slate-900">{org.wallet_balance_credits} Cr</div>
                    <div className="text-[11px] font-mono text-emerald-600 font-semibold">
                      {org.wallet_balance_formatted}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedOrg(org);
                        setShowWalletModal(true);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md hover:bg-emerald-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Wallet className="w-3 h-3" /> Add Credits
                    </button>

                    <button
                      onClick={() => toggleOrgStatus(org.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors border ${
                        org.status === "ACTIVE"
                          ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {org.status === "ACTIVE" ? "Suspend" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold">Provision New Tenant Organization</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrg} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Organization Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SpeedCheck Valuers LLP"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  placeholder="e.g. SpeedCheck Inspection Services India Private Limited"
                  value={newLegalName}
                  onChange={(e) => setNewLegalName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Admin Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="admin@tenant.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98200 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GST Number</label>
                  <input
                    type="text"
                    placeholder="27AABCS1429B1Z8"
                    value={newGst}
                    onChange={(e) => setNewGst(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subscription Tier</label>
                  <select
                    value={newTier}
                    onChange={(e: any) => setNewTier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                  >
                    <option value="STARTER">Starter Tier</option>
                    <option value="PROFESSIONAL">Professional Tier</option>
                    <option value="ENTERPRISE">Enterprise Tier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Initial Credit Allocation (Credits)</label>
                <input
                  type="number"
                  min="0"
                  value={newCredits}
                  onChange={(e) => setNewCredits(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  1 credit = ₹15.00 INR. Minor currency units recorded in minor paise.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Confirm Provisioning
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Credit Wallet Adjustment Modal */}
      {showWalletModal && selectedOrg && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-bold">Privileged Credit Wallet Allocation</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-emerald-300 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustCredits} className="p-5 space-y-4 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-900">
                <div className="font-bold text-xs">{selectedOrg.name}</div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Current Balance: <strong className="font-mono">{selectedOrg.wallet_balance_credits} Credits</strong>{" "}
                  ({selectedOrg.wallet_balance_formatted})
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Credit Adjustment Delta (+ / -)</label>
                <input
                  type="number"
                  required
                  value={creditDelta}
                  onChange={(e) => setCreditDelta(e.target.value)}
                  placeholder="e.g. 500 or -50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Enter positive number to allocate credits, negative number to deduct.
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Auditable Justification / Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g. Enterprise pilot top-up approved via PO #99102"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Apply Wallet Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
