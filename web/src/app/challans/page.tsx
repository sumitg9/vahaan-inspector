"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  Filter,
  DollarSign,
  AlertCircle,
  Car,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrencyINR } from "@/lib/utils";

interface ChallanRecord {
  challan_number: string;
  offence_date_time: string;
  offence_details: string;
  fine_amount_paise: number;
  fine_amount_formatted: string;
  state_code: string;
  rto_name?: string;
  challan_status: "PENDING" | "DISPOSED" | "SENT_TO_COURT";
  parivahan_url?: string;
}

export default function TrafficChallansPage() {
  const [searchReg, setSearchReg] = useState("MH12AB1234");
  const [currentReg, setCurrentReg] = useState("MH12AB1234");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "DISPOSED">("ALL");
  const [loading, setLoading] = useState(false);
  const [errorData, setErrorData] = useState<{ code: string; message: string } | null>(null);
  const [isRefreshConfirmOpen, setIsRefreshConfirmOpen] = useState(false);

  // Response Data
  const [challans, setChallans] = useState<ChallanRecord[]>([]);
  const [totalPendingFormatted, setTotalPendingFormatted] = useState("₹0.00");
  const [totalDisposedFormatted, setTotalDisposedFormatted] = useState("₹0.00");
  const [isCached, setIsCached] = useState(true);

  const fetchChallans = async (regToFetch?: string, forceFresh = false) => {
    const reg = (regToFetch || searchReg).trim().toUpperCase();
    if (!reg) return;

    setLoading(true);
    setErrorData(null);
    setCurrentReg(reg);

    try {
      const res = await fetch(`/api/vehicles/lookup?reg=${encodeURIComponent(reg)}&mode=challan_only&force_fresh=${forceFresh}`);
      const json = await res.json();

      if (!res.ok || json.status === "error") {
        setErrorData({
          code: json.error_code || "CHALLAN_QUERY_ERROR",
          message: json.message || "Failed to query traffic enforcement records.",
        });
        setChallans([]);
      } else {
        const payload = json.data?.challans || json.data || {};
        const items = payload.challans || [];
        setChallans(items);
        setTotalPendingFormatted(payload.total_pending_formatted || "₹0.00");
        setTotalDisposedFormatted(payload.total_disposed_formatted || "₹0.00");
        setIsCached(Boolean(json.data?.cached?.challans && !forceFresh));
      }
    } catch (err: any) {
      setErrorData({
        code: "NETWORK_ERROR",
        message: err.message || "Could not connect to traffic violation database.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans("MH12AB1234", false);
  }, []);

  const filteredChallans = challans.filter((c) => {
    if (statusFilter === "ALL") return true;
    return c.challan_status === statusFilter;
  });

  const handlePreset = (reg: string) => {
    setSearchReg(reg);
    fetchChallans(reg, false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Traffic Challans & Enforcement History</span>
            <Badge variant="destructive" className="text-[10px]">eChallan Central</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time automated traffic violation intelligence, outstanding fines, and disposed history.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRefreshConfirmOpen(true)}
            className="gap-1.5 text-xs shadow-sm bg-white"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Refresh Violations</span>
          </Button>
          <a
            href="https://echallan.parivahan.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <span>Parivahan Portal</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Search Input Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Car className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Registration No. (e.g. MH12AB1234, DL01XY9999, KA01MJ0001)..."
                value={searchReg}
                onChange={(e) => setSearchReg(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && fetchChallans()}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono font-bold tracking-wider text-slate-900 uppercase"
              />
            </div>
            <Button
              variant="default"
              onClick={() => fetchChallans()}
              disabled={loading}
              className="gap-2 px-6 shadow-sm"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "Checking Violations..." : "Fetch Challans"}</span>
            </Button>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-semibold">Presets:</span>
              <button
                type="button"
                onClick={() => handlePreset("MH12AB1234")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border text-[10px] font-mono font-semibold text-slate-700"
              >
                MH12AB1234 (Active Fines)
              </button>
              <button
                type="button"
                onClick={() => handlePreset("DL01XY9999")}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border text-[10px] font-mono font-semibold text-slate-700"
              >
                DL01XY9999 (Speeding)
              </button>
              <button
                type="button"
                onClick={() => handlePreset("KA01MJ0001")}
                className="px-2 py-0.5 rounded bg-teal-50 hover:bg-teal-100 border border-teal-200 text-[10px] font-mono font-semibold text-teal-800"
              >
                KA01MJ0001 (Zero Challans)
              </button>
            </div>

            <div className="text-slate-500 text-[11px]">
              Query cost: <strong className="text-slate-800">10 Credits</strong> (0 Credits on cached replay)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Provider Error Banner */}
      {errorData && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-semantic-red space-y-1 shadow-sm">
          <div className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Enforcement Query Failure: [{errorData.code}]</span>
          </div>
          <p className="text-red-800">{errorData.message}</p>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Recorded Challans</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{challans.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Vehicle: {currentReg}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Pending Payable Fines</div>
            <div className="text-2xl font-bold text-semantic-red mt-1">
              {totalPendingFormatted}
            </div>
            <div className="text-[11px] text-semantic-red font-semibold mt-1">
              {challans.filter((c) => c.challan_status === "PENDING").length} active notice(s)
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-red-50 text-semantic-red flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Settled / Disposed Fines</div>
            <div className="text-2xl font-bold text-semantic-teal mt-1">
              {totalDisposedFormatted}
            </div>
            <div className="text-[11px] text-semantic-teal font-semibold mt-1">Receipts verified</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-semantic-teal flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Sent to Virtual Court</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">0</div>
            <div className="text-[11px] text-slate-500 mt-1">No court summons active</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-3 border-b border-slate-100">
          <div>
            <CardTitle className="text-sm font-bold text-slate-900">
              Violations Log for {currentReg}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-0.5">
              Verified against central enforcement records (Paise Minor-Unit Precision)
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({challans.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === "PENDING"
                  ? "bg-semantic-red text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Pending ({challans.filter((c) => c.challan_status === "PENDING").length})
            </button>
            <button
              onClick={() => setStatusFilter("DISPOSED")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                statusFilter === "DISPOSED"
                  ? "bg-semantic-teal text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Disposed ({challans.filter((c) => c.challan_status === "DISPOSED").length})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filteredChallans.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="Clean Vehicle Record"
              description={`No traffic violations recorded for registration ${currentReg}. Vehicle carries a clean compliance standing.`}
              className="py-12"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Challan Number</TableHead>
                  <TableHead className="w-[150px]">Date & Time</TableHead>
                  <TableHead>Offense Description & Section</TableHead>
                  <TableHead className="w-[140px] text-right">Fine Amount</TableHead>
                  <TableHead className="w-[120px] text-center">Status</TableHead>
                  <TableHead className="w-[110px] text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChallans.map((challan) => (
                  <TableRow key={challan.challan_number}>
                    <TableCell className="font-mono font-bold text-xs text-slate-900">
                      {challan.challan_number}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {challan.offence_date_time}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-800">{challan.offence_details}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{challan.rto_name || "Enforcement Branch"}</div>
                    </TableCell>
                    <TableCell className="font-mono font-bold text-xs text-right text-slate-900">
                      {challan.fine_amount_paise ? formatCurrencyINR(challan.fine_amount_paise) : challan.fine_amount_formatted}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={challan.challan_status === "PENDING" ? "destructive" : "success"}
                        className="text-[10px]"
                      >
                        {challan.challan_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={challan.parivahan_url || "https://echallan.parivahan.gov.in/"}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="h-7 text-[11px] px-2.5">
                          Portal
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Refresh Live Violations Confirmation */}
      <Dialog
        open={isRefreshConfirmOpen}
        onOpenChange={setIsRefreshConfirmOpen}
        title="Refresh Live Enforcement Violations"
        description="Query Parivahan eChallan central database"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
            <div className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Credit Deduction Notice</span>
            </div>
            <p>
              Re-querying central eChallan records will bypass the cache and deduct <strong>10 Credits</strong> from your organization balance.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsRefreshConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setIsRefreshConfirmOpen(false);
                fetchChallans(currentReg, true);
              }}
            >
              Confirm & Refresh (10 Cr)
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
