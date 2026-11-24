"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  CreditCard,
  FileText,
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Building2,
  Lock,
  Layers,
  Sparkles,
  Receipt,
  RotateCcw,
} from "lucide-react";

interface LedgerTx {
  id: string;
  type: "CREDIT_TOPUP" | "RC_LOOKUP_DEDUCTION" | "CHALLAN_LOOKUP_DEDUCTION" | "INSPECTION_DEDUCTION" | "REFUND";
  credits_amount: number;
  balance_after: number;
  idempotency_key: string;
  reference: string;
  description: string;
  provider_cost_inr: string;
  gross_margin_pct: number;
  created_at: string;
}

interface InvoiceItem {
  id: string;
  invoice_number: string;
  credits: number;
  subtotal_inr: string;
  gst_inr: string;
  total_inr: string;
  payment_method: string;
  payment_id: string;
  date: string;
  status: "PAID" | "REFUNDED";
}

const INITIAL_TRANSACTIONS: LedgerTx[] = [
  {
    id: "tx_01",
    type: "CREDIT_TOPUP",
    credits_amount: 500,
    balance_after: 950,
    idempotency_key: "topup_pay_rzp_991823",
    reference: "INV-2026-88192",
    description: "Enterprise Pack Top-up (500 Credits) via Razorpay",
    provider_cost_inr: "₹0.00",
    gross_margin_pct: 100,
    created_at: "Today, 05:40 PM",
  },
  {
    id: "tx_02",
    type: "INSPECTION_DEDUCTION",
    credits_amount: -15,
    balance_after: 450,
    idempotency_key: "insp_deduct_mh12ab1234_case9981",
    reference: "MH12AB1234",
    description: "Commercial Tipper Complete 11-Section Inspection Dossier",
    provider_cost_inr: "₹7.00",
    gross_margin_pct: 96.8,
    created_at: "Today, 04:15 PM",
  },
  {
    id: "tx_03",
    type: "RC_LOOKUP_DEDUCTION",
    credits_amount: -1,
    balance_after: 465,
    idempotency_key: "rc_lookup_dl01xy9999",
    reference: "DL01XY9999",
    description: "APISathi Live Vehicle Registry Ingestion",
    provider_cost_inr: "₹4.50",
    gross_margin_pct: 70.0,
    created_at: "Today, 02:30 PM",
  },
  {
    id: "tx_04",
    type: "CHALLAN_LOOKUP_DEDUCTION",
    credits_amount: -1,
    balance_after: 466,
    idempotency_key: "challan_lookup_mh14cd5678",
    reference: "MH14CD5678",
    description: "Parivahan eChallan Traffic Violation Verification",
    provider_cost_inr: "₹2.50",
    gross_margin_pct: 83.3,
    created_at: "Today, 01:20 PM",
  },
  {
    id: "tx_05",
    type: "REFUND",
    credits_amount: 1,
    balance_after: 467,
    idempotency_key: "refund_tx_failed_gateway_0921",
    reference: "MH02EF9999",
    description: "Automatic Reversal: Gateway 502 Timeout on Challan Server",
    provider_cost_inr: "₹0.00",
    gross_margin_pct: 100,
    created_at: "Yesterday, 06:12 PM",
  },
];

const INITIAL_INVOICES: InvoiceItem[] = [
  {
    id: "inv_01",
    invoice_number: "INV-2026-88192",
    credits: 500,
    subtotal_inr: "₹7,500.00",
    gst_inr: "₹1,350.00",
    total_inr: "₹8,850.00",
    payment_method: "Razorpay (Corporate NetBanking)",
    payment_id: "pay_rzp_991823",
    date: "24 Nov 2026",
    status: "PAID",
  },
  {
    id: "inv_02",
    invoice_number: "INV-2026-77401",
    credits: 1000,
    subtotal_inr: "₹15,000.00",
    gst_inr: "₹2,700.00",
    total_inr: "₹17,700.00",
    payment_method: "Razorpay (UPI Instant)",
    payment_id: "pay_rzp_774012",
    date: "01 Nov 2026",
    status: "PAID",
  },
];

export default function BillingPage() {
  const [balanceCredits, setBalanceCredits] = useState(950);
  const [transactions, setTransactions] = useState<LedgerTx[]>(INITIAL_TRANSACTIONS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [activeTab, setActiveTab] = useState<"LEDGER" | "INVOICES">("LEDGER");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Topup Modal State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedPack, setSelectedPack] = useState<"STARTER" | "PRO" | "ENTERPRISE">("PRO");
  const [isProcessing, setIsProcessing] = useState(false);
  const [topupSuccessMessage, setTopupSuccessMessage] = useState<string | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.idempotency_key.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "ALL" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getPackDetails = () => {
    switch (selectedPack) {
      case "STARTER":
        return { credits: 200, rate: 18, subtotal: 3600, gst: 648, total: 4248 };
      case "PRO":
        return { credits: 1000, rate: 15, subtotal: 15000, gst: 2700, total: 17700 };
      case "ENTERPRISE":
        return { credits: 5000, rate: 12, subtotal: 60000, gst: 10800, total: 70800 };
    }
  };

  const handleSimulatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      const pack = getPackDetails();
      const newBal = balanceCredits + pack.credits;
      const paymentId = "pay_rzp_" + Math.random().toString(36).substring(2, 9);
      const invoiceNum = "INV-2026-" + Math.floor(10000 + Math.random() * 90000);

      const newTx: LedgerTx = {
        id: "tx_" + Date.now(),
        type: "CREDIT_TOPUP",
        credits_amount: pack.credits,
        balance_after: newBal,
        idempotency_key: "topup_" + paymentId,
        reference: invoiceNum,
        description: `Top-up of ${pack.credits} Credits (${selectedPack} Pack) via Razorpay`,
        provider_cost_inr: "₹0.00",
        gross_margin_pct: 100,
        created_at: "Just now",
      };

      const newInv: InvoiceItem = {
        id: "inv_" + Date.now(),
        invoice_number: invoiceNum,
        credits: pack.credits,
        subtotal_inr: "₹" + pack.subtotal.toFixed(2),
        gst_inr: "₹" + pack.gst.toFixed(2),
        total_inr: "₹" + pack.total.toFixed(2),
        payment_method: "Razorpay (Simulated Instant)",
        payment_id: paymentId,
        date: "Today",
        status: "PAID",
      };

      setBalanceCredits(newBal);
      setTransactions([newTx, ...transactions]);
      setInvoices([newInv, ...invoices]);
      setIsProcessing(false);
      setShowTopupModal(false);
      setTopupSuccessMessage(`Successfully recharged ${pack.credits} Credits! New balance: ${newBal} Cr.`);
      setTimeout(() => setTopupSuccessMessage(null), 5000);
    }, 900);
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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Credit Wallet & Billing Ledgers</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable double-entry transaction ledgers, two-phase credit reservations, GST invoices, and COGS margins.
          </p>
        </div>

        <button
          onClick={() => setShowTopupModal(true)}
          className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-lg hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <CreditCard className="w-4 h-4" /> Top-Up Credit Wallet
        </button>
      </div>

      {topupSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{topupSuccessMessage}</span>
        </div>
      )}

      {/* Wallet Balance & Subscription KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Wallet Balance */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-brand/20 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider">Available Spendable Credits</span>
              <Wallet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{balanceCredits}</span>
              <span className="text-sm font-bold text-slate-400">Credits</span>
            </div>
            <div className="text-xs font-mono font-semibold text-emerald-400 mt-1">
              ≈ ₹{(balanceCredits * 15).toFixed(2)} INR
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Low Balance Alert: 50 Cr</span>
            <span className="text-slate-300 font-mono">1 Cr = ₹15.00</span>
          </div>
        </div>

        {/* Active Subscription Tier */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider">Active Subscription</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded uppercase bg-purple-50 text-purple-700 border border-purple-200">
                ENTERPRISE
              </span>
            </div>
            <div className="text-lg font-bold text-slate-900">Enterprise Syndicated Suite</div>
            <div className="text-xs text-slate-500 mt-0.5">
              ₹12 / credit discounted tariff • Dedicated Banking 12h SLA
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Monthly Quota Utilized:</span>
              <span className="font-bold text-slate-900">1,420 / 2,500</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-600 h-2 rounded-full w-[56.8%]" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Next cycle resets in 6 days</span>
              <span>56.8% used</span>
            </div>
          </div>
        </div>

        {/* Provider Cost (COGS) & Margins */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span className="uppercase tracking-wider">Unit Economics (COGS)</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-lg font-bold text-slate-900">74.5% Gross Margin</div>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time third-party provider tariff deductions vs customer tariff.
            </p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1.5 mt-3">
            <div className="flex justify-between">
              <span className="text-slate-600">APISathi RC Ingestion:</span>
              <span className="font-mono font-bold text-slate-900">₹4.50 cost (70% margin)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Parivahan eChallan:</span>
              <span className="font-mono font-bold text-slate-900">₹2.50 cost (83% margin)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Fastag Toll Movement:</span>
              <span className="font-mono font-bold text-slate-900">₹1.50 cost (90% margin)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "LEDGER"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Immutable Double-Entry Ledger
          </button>
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "INVOICES"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 bg-slate-100"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" /> GST Tax Invoices ({invoices.length})
          </button>
        </div>
      </div>

      {activeTab === "LEDGER" ? (
        /* Double-Entry Ledger Tab */
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ledger by reference, description, or idempotency key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-semibold">Type:</span>
              {["ALL", "CREDIT_TOPUP", "INSPECTION_DEDUCTION", "RC_LOOKUP_DEDUCTION", "REFUND"].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    typeFilter === type
                      ? "bg-slate-900 text-white font-bold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {type === "CREDIT_TOPUP"
                    ? "Top-ups"
                    : type === "INSPECTION_DEDUCTION"
                    ? "Inspections"
                    : type === "RC_LOOKUP_DEDUCTION"
                    ? "RC Lookups"
                    : type === "REFUND"
                    ? "Refunds"
                    : "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Transaction Type & Description</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Idempotency Key</th>
                    <th className="px-4 py-3">Credits Change</th>
                    <th className="px-4 py-3">Balance After</th>
                    <th className="px-4 py-3 text-right">Provider Cost & Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">{tx.created_at}</td>

                      {/* Type and Description */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {tx.credits_amount > 0 ? (
                            <ArrowUpRight className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 text-red-600 flex-shrink-0" />
                          )}
                          {tx.description}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{tx.type}</div>
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">{tx.reference}</td>

                      {/* Idempotency Key */}
                      <td className="px-4 py-3.5">
                        <span
                          className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[140px] inline-block"
                          title={tx.idempotency_key}
                        >
                          {tx.idempotency_key}
                        </span>
                      </td>

                      {/* Credits Amount */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`font-mono font-black text-xs ${
                            tx.credits_amount > 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {tx.credits_amount > 0 ? `+${tx.credits_amount}` : tx.credits_amount} Cr
                        </span>
                      </td>

                      {/* Balance After */}
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{tx.balance_after} Cr</td>

                      {/* Provider Cost & Margin */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="font-mono text-[11px] text-slate-600">COGS: {tx.provider_cost_inr}</div>
                        <div className="text-[10px] font-bold text-emerald-600 font-mono">
                          {tx.gross_margin_pct}% Margin
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* GST Invoices Tab */
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Invoice Number</th>
                  <th className="px-4 py-3">Billing Date</th>
                  <th className="px-4 py-3">Credits Top-up</th>
                  <th className="px-4 py-3">Taxable Value</th>
                  <th className="px-4 py-3">18% GST (CGST+SGST)</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Payment Reference</th>
                  <th className="px-4 py-3 text-right">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900">{inv.invoice_number}</td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono">{inv.date}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-purple-700">{inv.credits} Credits</td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{inv.subtotal_inr}</td>
                    <td className="px-4 py-3.5 font-mono text-slate-700">{inv.gst_inr}</td>
                    <td className="px-4 py-3.5 font-mono font-black text-slate-900">{inv.total_inr}</td>
                    <td className="px-4 py-3.5">
                      <div className="text-[11px] text-slate-700">{inv.payment_method}</div>
                      <div className="text-[10px] font-mono text-slate-400">{inv.payment_id}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase inline-block">
                        {inv.status}
                      </span>
                      <button
                        onClick={() => alert(`Downloading GST Invoice ${inv.invoice_number}`)}
                        className="p-1 text-slate-500 hover:text-brand transition-colors inline-block"
                        title="Download Invoice PDF"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold">Top-Up Credit Wallet</h3>
              </div>
              <button
                onClick={() => setShowTopupModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulatePayment} className="p-5 space-y-4 text-xs">
              <div className="text-slate-600">
                Select a credit bundle for high-volume inspection cases and vehicle lookups:
              </div>

              {/* Pack Selector Cards */}
              <div className="space-y-2.5">
                {[
                  {
                    code: "STARTER",
                    name: "Starter Bundle",
                    credits: 200,
                    rate: 18,
                    subtotal: 3600,
                    gst: 648,
                    total: 4248,
                  },
                  {
                    code: "PRO",
                    name: "Professional Surveyor Pack",
                    credits: 1000,
                    rate: 15,
                    subtotal: 15000,
                    gst: 2700,
                    total: 17700,
                    popular: true,
                  },
                  {
                    code: "ENTERPRISE",
                    name: "Enterprise Bulk Allocation",
                    credits: 5000,
                    rate: 12,
                    subtotal: 60000,
                    gst: 10800,
                    total: 70800,
                  },
                ].map((pack) => (
                  <label
                    key={pack.code}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedPack === pack.code
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="topup_pack"
                          value={pack.code}
                          checked={selectedPack === pack.code}
                          onChange={() => setSelectedPack(pack.code as any)}
                          className="w-4 h-4 text-brand focus:ring-brand"
                        />
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{pack.name}</span>
                            {pack.popular && (
                              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                                Most Popular
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {pack.credits} Credits • <strong className="text-slate-800">₹{pack.rate} / Cr</strong>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-black text-sm text-slate-900 font-mono">
                          ₹{pack.total.toLocaleString("en-IN")}.00
                        </div>
                        <div className="text-[10px] text-slate-400">incl. 18% GST</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* GST Breakdown Notice */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-600 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Selected Credits:</span>
                  <strong className="font-mono text-slate-900">{getPackDetails().credits} Credits</strong>
                </div>
                <div className="flex justify-between">
                  <span>Taxable Value:</span>
                  <span className="font-mono">₹{getPackDetails().subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST (9%) + SGST (9%):</span>
                  <span className="font-mono">₹{getPackDetails().gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Payable:</span>
                  <span className="font-mono text-xs">₹{getPackDetails().total.toFixed(2)} INR</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTopupModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition-colors shadow-sm flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Clock className="w-4 h-4 animate-spin" /> Verifying Signature...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Pay & Recharge Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
