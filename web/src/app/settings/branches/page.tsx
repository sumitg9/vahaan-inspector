"use client";

import React, { useState } from "react";
import { Building2, Plus, MapPin, CheckCircle2, ShieldAlert, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

interface BranchItem {
  id: string;
  name: string;
  code: string;
  city: string;
  state: string;
  pincode: string;
  address: string;
  is_headquarters: boolean;
  user_count: number;
}

const INITIAL_BRANCHES: BranchItem[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Pune Headquarters & Commercial Hub",
    code: "PUN-HQ",
    city: "Pune",
    state: "Maharashtra",
    pincode: "411001",
    address: "Plot 42, Senapati Bapat Road, Shivaji Nagar, Pune",
    is_headquarters: true,
    user_count: 8,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Chakan Auto Logistics Yard",
    code: "CHK-02",
    city: "Pune",
    state: "Maharashtra",
    pincode: "410501",
    address: "MIDC Phase II, Chakan Auto Hub, Pune",
    is_headquarters: false,
    user_count: 5,
  },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Maharashtra");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [isHq, setIsHq] = useState(false);

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code) return;

    const newBranch: BranchItem = {
      id: "branch_" + Date.now(),
      name,
      code: code.toUpperCase(),
      city,
      state,
      pincode,
      address,
      is_headquarters: isHq,
      user_count: 1,
    };

    setBranches([...branches, newBranch]);
    setShowModal(false);
    setName("");
    setCode("");
    setCity("");
    setPincode("");
    setAddress("");
    setIsHq(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/" className="text-xs text-slate-500 hover:text-brand flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Organization Branches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage regional offices, surveyor yards, and multi-branch tenant hierarchy.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Branch</span>
        </button>
      </div>

      {/* Branch Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {branches.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {b.code}
                </span>
                <h3 className="font-bold text-slate-900 text-sm mt-1.5">{b.name}</h3>
              </div>
              {b.is_headquarters && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-semantic-teal border border-teal-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Headquarters
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                <span className="truncate">{b.city}, {b.state} - {b.pincode}</span>
              </div>
              <div className="text-slate-500 text-[11px] line-clamp-2 pl-5">
                {b.address}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{b.user_count} Inspectors Assigned</span>
              <button className="text-brand font-semibold hover:underline text-xs">
                Manage Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Branch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="font-bold text-base text-slate-900">Add Operating Branch</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nagpur Regional Office"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="NAG-01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase font-mono focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Nagpur"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street and Area address"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="hq"
                  checked={isHq}
                  onChange={(e) => setIsHq(e.target.checked)}
                  className="rounded border-slate-300 text-brand focus:ring-brand"
                />
                <label htmlFor="hq" className="text-slate-700 cursor-pointer font-medium">
                  Set as Headquarters branch
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white font-bold rounded-lg hover:bg-brand-hover shadow-sm"
                >
                  Save Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
