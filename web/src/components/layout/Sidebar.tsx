"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Car,
  FileCheck2,
  AlertTriangle,
  Calculator,
  Truck,
  Building2,
  Wallet,
  ShieldCheck,
  Settings,
  LayoutDashboard,
  Search,
  CheckCircle2,
  Lock,
  Users,
  Server,
  Sliders,
  FileText,
  ShieldAlert,
} from "lucide-react";

const navigationItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Vehicle Intelligence", href: "/vehicles", icon: Search, badge: "VAHAN" },
  { name: "Traffic Challans", href: "/challans", icon: AlertTriangle, badge: "Live" },
  { name: "Inspection Cases", href: "/inspections", icon: FileCheck2 },
  { name: "Valuation Desk", href: "/valuation", icon: Calculator },
  { name: "Fleet Compliance", href: "/fleet", icon: Truck, badge: "Watch" },
  { name: "Clients & Banks", href: "/clients", icon: Building2 },
  { name: "Wallet & Credits", href: "/billing", icon: Wallet, highlight: true },
  { name: "Audit Trail", href: "/audit", icon: ShieldCheck },
  { name: "Branch Settings", href: "/settings/branches", icon: Settings },
];

const adminItems = [
  { name: "Super Admin Console", href: "/admin", icon: Lock, badge: "Root" },
  { name: "Tenant Organizations", href: "/admin/organizations", icon: Building2 },
  { name: "Users & RBAC", href: "/admin/users", icon: Users },
  { name: "Provider Vault", href: "/admin/providers", icon: Server },
  { name: "Feature Flags", href: "/admin/feature-flags", icon: Sliders },
  { name: "Report Settings", href: "/admin/report-settings", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar flex flex-col flex-shrink-0 text-white select-none border-r border-sidebar-border min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center font-bold text-white shadow-md">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <div className="font-bold text-base tracking-tight leading-none text-white">
            Vahan<span className="text-brand-subtle">Check</span>
          </div>
          <div className="text-[10px] text-sidebar-muted tracking-wider uppercase font-semibold mt-0.5">
            Enterprise v1.0
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {/* Core Operations */}
        <div className="space-y-1">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-sidebar-muted mb-1">
            Operations
          </div>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href) && !pathname?.startsWith("/admin"));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-sidebar-hover text-white font-semibold shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-xs">{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Administration & Governance Section */}
        <div className="space-y-1 pt-2 border-t border-sidebar-border/40">
          <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-purple-400/80 mb-1 flex items-center justify-between">
            <span>Governance</span>
            <span className="text-[9px] bg-purple-900/60 text-purple-300 px-1 py-0.2 rounded font-mono">Privileged</span>
          </div>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isCurrent =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? "bg-purple-950/80 text-purple-200 border border-purple-800/60 font-semibold shadow-sm"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-purple-400" />
                <span className="flex-1 text-xs">{item.name}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Tenant / Organization Footer Card */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="bg-sidebar-hover p-3 rounded-lg border border-sidebar-border/60">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-semantic-teal" />
            <span className="text-xs font-semibold text-white truncate">SpeedCheck Valuers</span>
          </div>
          <div className="text-[11px] text-sidebar-muted mt-1 flex justify-between">
            <span>Pune Main Branch</span>
            <span className="text-emerald-400 font-mono font-semibold">950 Cr</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
