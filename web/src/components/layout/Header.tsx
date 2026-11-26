"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/lib/auth";
import {
  Search,
  Bell,
  Wallet,
  ChevronDown,
  UserCircle2,
  ShieldCheck,
  LogOut,
  Building2,
  Settings,
  ShieldAlert,
} from "lucide-react";

export function Header() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useCurrentUser();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isProfileOpen]);

  return (
    <header className="h-16 bg-white border-b border-canvas-border flex items-center justify-between px-6 z-10 sticky top-0">
      {/* Search Bar / Quick Lookup */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search registration (e.g. MH12AB1234) or Case ID..."
            className="w-full pl-9 pr-16 py-1.5 text-xs bg-canvas-subtle border border-canvas-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all text-slate-800"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-4">
        {/* Environment Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Mock Provider Mode</span>
        </div>

        {/* Real-Time Wallet Balance */}
        <div className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg cursor-pointer transition-colors">
          <Wallet className="w-4 h-4 text-brand" />
          <div className="text-xs">
            <span className="text-slate-500">Balance: </span>
            <span className="font-bold text-slate-800 font-mono">
              ₹{((user.walletCredits || 950) * 15).toLocaleString("en-IN")}
            </span>
            <span className="text-slate-400 text-[10px] ml-1">({user.walletCredits || 950} Cr)</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-semantic-red ring-2 ring-white"></span>
        </button>

        {/* User Profile with Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            id="profile-menu-button"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
            onClick={() => setIsProfileOpen((prev) => !prev)}
            className={`flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg border transition-all cursor-pointer ${
              isProfileOpen
                ? "bg-slate-100 border-slate-300 ring-2 ring-brand/10"
                : "border-transparent hover:bg-slate-50 hover:border-slate-200"
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-brand-subtle/30 text-brand border border-brand/20 flex items-center justify-center font-bold text-xs shadow-xs">
              {user.initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[10px] text-slate-500 font-medium">{user.roleTitle}</div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                isProfileOpen ? "rotate-180 text-slate-700" : ""
              }`}
            />
          </button>

          {/* Profile Dropdown Window */}
          {isProfileOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="profile-menu-button"
              className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100"
            >
              {/* User Bio Header */}
              <div className="px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs border border-brand/20">
                    {user.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[10px] bg-slate-50 px-2 py-1 rounded border border-slate-100">
                  <span className="text-slate-600 font-medium truncate">{user.organization}</span>
                  <span className="font-semibold text-brand ml-1 flex-shrink-0">{user.role}</span>
                </div>
              </div>

              {/* Navigation Options */}
              <div className="p-1 space-y-0.5">
                <Link
                  href="/settings/branches"
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Branch & Settings</span>
                </Link>

                <Link
                  href="/audit"
                  onClick={() => setIsProfileOpen(false)}
                  role="menuitem"
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Audit Trail</span>
                </Link>
              </div>

              {/* Divider */}
              <div className="my-1 border-t border-slate-100"></div>

              {/* Dropdown Logout Button */}
              <div className="p-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-left group cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-red-500 group-hover:text-red-700 transition-colors" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
