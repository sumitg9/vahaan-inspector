"use client";

import React from "react";
import { Search, Bell, Wallet, ChevronDown, UserCircle2, ShieldCheck } from "lucide-react";

export function Header() {
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
            <span className="font-bold text-slate-800 font-mono">₹14,250</span>
            <span className="text-slate-400 text-[10px] ml-1">(950 Cr)</span>
          </div>
        </div>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-semantic-red ring-2 ring-white"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs">
            RK
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 leading-tight">Rajesh Kumar</div>
            <div className="text-[10px] text-slate-500 font-medium">Senior Valuer (HDFC Desk)</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
