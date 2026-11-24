"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Lock,
  Building2,
  MapPin,
  KeyRound,
  AlertTriangle,
} from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "SUPER_ADMIN" | "ORG_ADMIN" | "MANAGER" | "VALUER" | "INSPECTOR" | "CLIENT_VIEWER";
  is_active: boolean;
  organization_id: string;
  organization_name: string;
  branch_name: string;
  mfa_enabled: boolean;
  last_login_at: string;
}

const INITIAL_USERS: UserItem[] = [
  {
    id: "usr_01",
    name: "Vikram Malhotra",
    email: "superadmin@vahancheck.io",
    phone: "+91 98200 11001",
    role: "SUPER_ADMIN",
    is_active: true,
    organization_id: "system",
    organization_name: "Platform Central",
    branch_name: "Headquarters",
    mfa_enabled: true,
    last_login_at: "Today, 06:45 PM",
  },
  {
    id: "usr_02",
    name: "Amitabh Sen",
    email: "admin@speedcheck.in",
    phone: "+91 98201 12345",
    role: "ORG_ADMIN",
    is_active: true,
    organization_id: "11111111-1111-1111-1111-111111111111",
    organization_name: "SpeedCheck Valuers",
    branch_name: "Pune Main HQ",
    mfa_enabled: true,
    last_login_at: "Today, 05:30 PM",
  },
  {
    id: "usr_03",
    name: "Rajesh Kumar",
    email: "rajesh.kumar@speedcheck.in",
    phone: "+91 98765 43210",
    role: "INSPECTOR",
    is_active: true,
    organization_id: "11111111-1111-1111-1111-111111111111",
    organization_name: "SpeedCheck Valuers",
    branch_name: "Chakan Yard",
    mfa_enabled: false,
    last_login_at: "Today, 04:12 PM",
  },
  {
    id: "usr_04",
    name: "Er. Dilip Deshmukh",
    email: "dilip.valuer@speedcheck.in",
    phone: "+91 99220 88776",
    role: "VALUER",
    is_active: true,
    organization_id: "11111111-1111-1111-1111-111111111111",
    organization_name: "SpeedCheck Valuers",
    branch_name: "Pune Main HQ",
    mfa_enabled: true,
    last_login_at: "Today, 03:20 PM",
  },
  {
    id: "usr_05",
    name: "Sunil Joshi",
    email: "sunil.manager@speedcheck.in",
    phone: "+91 98111 22334",
    role: "MANAGER",
    is_active: true,
    organization_id: "11111111-1111-1111-1111-111111111111",
    organization_name: "SpeedCheck Valuers",
    branch_name: "Pune Main HQ",
    mfa_enabled: false,
    last_login_at: "Yesterday, 06:10 PM",
  },
  {
    id: "usr_06",
    name: "Pooja Mehta",
    email: "hdfc.viewer@hdfcbank.com",
    phone: "+91 98333 44556",
    role: "CLIENT_VIEWER",
    is_active: true,
    organization_id: "11111111-1111-1111-1111-111111111111",
    organization_name: "SpeedCheck Valuers",
    branch_name: "Client Portal",
    mfa_enabled: true,
    last_login_at: "22 Nov, 11:30 AM",
  },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<UserItem["role"]>("INSPECTOR");
  const [newBranch, setNewBranch] = useState("Pune Main HQ");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.organization_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) return;

    const newUser: UserItem = {
      id: "usr_" + Date.now(),
      name: newName,
      email: newEmail,
      phone: newPhone || "+91 98000 00000",
      role: newRole,
      is_active: true,
      organization_id: "11111111-1111-1111-1111-111111111111",
      organization_name: "SpeedCheck Valuers",
      branch_name: newBranch,
      mfa_enabled: false,
      last_login_at: "Never",
    };

    setUsers([newUser, ...users]);
    setShowAddModal(false);
    setNewName("");
    setNewEmail("");
    setNewPhone("");
    setNewRole("INSPECTOR");
  };

  const toggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) => {
        if (u.id === id) {
          return { ...u, is_active: !u.is_active };
        }
        return u;
      })
    );
  };

  const getRoleBadgeClass = (role: UserItem["role"]) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-300 font-black";
      case "ORG_ADMIN":
        return "bg-blue-100 text-blue-800 border-blue-300 font-bold";
      case "VALUER":
        return "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold";
      case "MANAGER":
        return "bg-amber-100 text-amber-800 border-amber-300 font-bold";
      case "INSPECTOR":
        return "bg-slate-100 text-slate-800 border-slate-300 font-bold";
      case "CLIENT_VIEWER":
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Enterprise User Directory & RBAC</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Administer field inspectors, certified valuers, and tenant managers with strict privilege escalation guards.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Provision New User
        </button>
      </div>

      {/* Privilege Escalation Defense Notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3.5 flex items-start gap-3">
        <Lock className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-purple-950">
          <span className="font-bold">PRIVILEGE ESCALATION SAFEGUARD ACTIVE:</span> Non-Super Admins are strictly
          prohibited from assigning or creating <code>SUPER_ADMIN</code> accounts. Cross-tenant user modification is
          blocked at the database level and audited under high-severity security events.
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user name, email, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-semibold">Role:</span>
          {["ALL", "SUPER_ADMIN", "ORG_ADMIN", "VALUER", "INSPECTOR", "MANAGER"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                roleFilter === r
                  ? "bg-purple-900 text-white font-bold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">User & Contact</th>
                <th className="px-4 py-3">Role & Scope</th>
                <th className="px-4 py-3">Organization & Branch</th>
                <th className="px-4 py-3">MFA Status</th>
                <th className="px-4 py-3">Last Active</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* Name and Contact */}
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">{user.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{user.email}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{user.phone}</div>
                  </td>

                  {/* Role */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] uppercase px-2 py-0.5 rounded border inline-block ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>

                  {/* Organization & Branch */}
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {user.organization_name}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {user.branch_name}
                    </div>
                  </td>

                  {/* MFA Status */}
                  <td className="px-4 py-3.5">
                    {user.mfa_enabled ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
                        <KeyRound className="w-3 h-3 text-emerald-600" /> Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 w-fit block">
                        Disabled
                      </span>
                    )}
                  </td>

                  {/* Last Active */}
                  <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">{user.last_login_at}</td>

                  {/* Status */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1 w-fit ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {user.is_active ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3 h-3 text-red-600" />
                      )}
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors border ${
                        user.is_active
                          ? "bg-slate-50 text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {user.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold">Provision Enterprise User</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra Verma"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="user@speedcheck.in"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98220 00000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">System Role *</label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white font-semibold"
                  >
                    <option value="INSPECTOR">Field Inspector (Surveyor)</option>
                    <option value="VALUER">Certified Valuer</option>
                    <option value="MANAGER">Branch Operations Manager</option>
                    <option value="ORG_ADMIN">Organization Administrator</option>
                    <option value="CLIENT_VIEWER">Client Bank Viewer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Assigned Branch Yard</label>
                  <select
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-brand focus:outline-none bg-white"
                  >
                    <option value="Pune Main HQ">Pune Main HQ</option>
                    <option value="Chakan Yard">Chakan Auto Yard</option>
                    <option value="Mumbai Central">Mumbai Central Yard</option>
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-slate-600 text-[11px]">
                <span className="font-semibold text-slate-800">Initial Credential:</span> An invitation email with
                temporary password and mandatory password rotation on first login will be dispatched.
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
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg font-bold hover:bg-purple-800 transition-colors shadow-sm"
                >
                  Provision User Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
