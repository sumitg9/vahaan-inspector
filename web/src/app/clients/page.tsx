"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowLeft,
  FileCheck2,
  Landmark,
  BadgePercent,
  Phone,
  Mail,
  User,
} from "lucide-react";

interface ClientItem {
  id: string;
  name: string;
  code: string;
  category: "BANK" | "NBFC" | "INSURER" | "FLEET_OPERATOR";
  contact_person: string;
  email: string;
  phone: string;
  sla_hours: number;
  rate_tier: "STANDARD" | "GOLD" | "PLATINUM";
  active_cases: number;
  status: "ACTIVE" | "INACTIVE";
}

const INITIAL_CLIENTS: ClientItem[] = [
  {
    id: "cl_01",
    name: "HDFC Bank Limited — Auto Loan Division",
    code: "HDFC-AUTO",
    category: "BANK",
    contact_person: "Rohan Vashist (AVP Retail Risk)",
    email: "rohan.v@hdfcbank.com",
    phone: "+91 98200 44112",
    sla_hours: 24,
    rate_tier: "PLATINUM",
    active_cases: 18,
    status: "ACTIVE",
  },
  {
    id: "cl_02",
    name: "Tata Capital Financial Services",
    code: "TATA-FIN",
    category: "NBFC",
    contact_person: "Sanjay Singhal (Head CV Credit)",
    email: "sanjay.s@tatacapital.com",
    phone: "+91 98330 99881",
    sla_hours: 36,
    rate_tier: "GOLD",
    active_cases: 11,
    status: "ACTIVE",
  },
  {
    id: "cl_03",
    name: "ICICI Lombard General Insurance",
    code: "ICICI-LOMB",
    category: "INSURER",
    contact_person: "Meenakshi Rao (Claims Valuer Head)",
    email: "meenakshi.claims@icicilombard.com",
    phone: "+91 98110 55443",
    sla_hours: 24,
    rate_tier: "PLATINUM",
    active_cases: 7,
    status: "ACTIVE",
  },
  {
    id: "cl_04",
    name: "Shriram Transport Finance Corporation",
    code: "SHRIRAM-CV",
    category: "NBFC",
    contact_person: "K. Venkatesh (Regional Credit Manager)",
    email: "k.venkatesh@shriramfinance.in",
    phone: "+91 98400 12349",
    sla_hours: 48,
    rate_tier: "STANDARD",
    active_cases: 14,
    status: "ACTIVE",
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New Client Form
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newCategory, setNewCategory] = useState<ClientItem["category"]>("BANK");
  const [newContact, setNewContact] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newSla, setNewSla] = useState("24");
  const [newTier, setNewTier] = useState<ClientItem["rate_tier"]>("GOLD");

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === "ALL" || c.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    const newClient: ClientItem = {
      id: "cl_" + Date.now(),
      name: newName,
      code: newCode.toUpperCase(),
      category: newCategory,
      contact_person: newContact || "Branch Manager",
      email: newEmail || "contact@client.com",
      phone: newPhone || "+91 99000 11000",
      sla_hours: parseInt(newSla, 10) || 24,
      rate_tier: newTier,
      active_cases: 0,
      status: "ACTIVE",
    };

    setClients([newClient, ...clients]);
    setShowAddModal(false);
    setNewName("");
    setNewCode("");
    setNewContact("");
    setNewEmail("");
    setNewPhone("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Clients & Banks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer banking partners, NBFC financiers, and insurance syndicates with contractual SLAs and rate cards.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Institutional Client
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client name, reference code, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Category:</span>
          {["ALL", "BANK", "NBFC", "INSURER"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Client Entity</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Key Contact Person</th>
                <th className="px-4 py-3">SLA Turnaround</th>
                <th className="px-4 py-3">Rate Card Tier</th>
                <th className="px-4 py-3">Active Pipeline</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Client Entity */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Landmark className="w-4 h-4 text-brand flex-shrink-0" />
                      {client.name}
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">Code: {client.code}</div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                      {client.category}
                    </span>
                  </td>

                  {/* Key Contact */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {client.contact_person}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {client.email}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {client.phone}
                    </div>
                  </td>

                  {/* SLA */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 font-bold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      {client.sla_hours} Hours
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Guaranteed QC dispatch</div>
                  </td>

                  {/* Rate Card */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded uppercase border ${
                        client.rate_tier === "PLATINUM"
                          ? "bg-purple-50 text-purple-700 border-purple-200"
                          : client.rate_tier === "GOLD"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {client.rate_tier}
                    </span>
                  </td>

                  {/* Active Pipeline */}
                  <td className="px-4 py-3.5">
                    <Link
                      href="/inspections"
                      className="font-bold text-brand hover:underline flex items-center gap-1"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      {client.active_cases} Active Cases
                    </Link>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {client.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold">Add Institutional Client / Bank</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Institutional Entity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. State Bank of India — Commercial Vehicle Hub"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Client Reference Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SBI-CV-01"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Client Category</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-semibold"
                  >
                    <option value="BANK">Commercial Bank</option>
                    <option value="NBFC">NBFC / Financier</option>
                    <option value="INSURER">General Insurance Co</option>
                    <option value="FLEET_OPERATOR">Fleet Logistics Syndicate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Officer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alok Mathur (Chief Risk Officer)"
                  value={newContact}
                  onChange={(e) => setNewContact(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Official Email</label>
                  <input
                    type="email"
                    placeholder="alok.mathur@sbi.co.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Direct Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98200 11223"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contractual SLA (Hours)</label>
                  <select
                    value={newSla}
                    onChange={(e) => setNewSla(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-semibold"
                  >
                    <option value="12">12 Hours (Express)</option>
                    <option value="24">24 Hours (Standard)</option>
                    <option value="36">36 Hours (Commercial Heavy)</option>
                    <option value="48">48 Hours (Outstation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rate Card Tier</label>
                  <select
                    value={newTier}
                    onChange={(e: any) => setNewTier(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-semibold"
                  >
                    <option value="STANDARD">Standard Rate Card</option>
                    <option value="GOLD">Gold Tier (High Volume)</option>
                    <option value="PLATINUM">Platinum Tier (Key Account)</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition-colors shadow-sm"
                >
                  Save Institutional Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
