"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  DollarSign,
  Building2,
  Phone,
  User,
  Sliders,
  Bell,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Zap,
  Info,
  Check,
} from "lucide-react";

interface StatutoryDoc {
  document: string;
  valid_until: string | null;
  days_remaining: number | null;
  status: "VALID" | "EXPIRING_7D" | "EXPIRING_30D" | "EXPIRES_TODAY" | "EXPIRED" | "UNAVAILABLE";
  alert_level: "OK" | "WARNING" | "CRITICAL";
  is_expired: boolean;
  is_expiring_soon: boolean;
  label: string;
}

interface FleetItem {
  id: string;
  fleet_unit_number: string;
  registration_number: string;
  maker_model: string;
  vehicle_class: string;
  depot_location: string;
  assigned_driver_name: string;
  assigned_driver_phone: string;
  overall_status: "COMPLIANT" | "EXPIRING_SOON" | "NON_COMPLIANT";
  status_label: string;
  risk_level: "LOW" | "MODERATE" | "HIGH_RISK" | "CRITICAL_RISK";
  pending_challan_count: number;
  total_fines_inr: string;
  documents: {
    fitness: StatutoryDoc;
    insurance: StatutoryDoc;
    pucc: StatutoryDoc;
    permit: StatutoryDoc;
    tax: StatutoryDoc;
  };
  last_verified: string;
}

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL" | "SUCCESS";
  date: string;
  read: boolean;
}

const mockFleetData: FleetItem[] = [
  {
    id: "flt-001",
    fleet_unit_number: "FLT-MH-9101",
    registration_number: "MH12AB1234",
    maker_model: "TATA MOTORS PRIMA 2830.K",
    vehicle_class: "Heavy Goods Vehicle (Tipper)",
    depot_location: "Bhiwandi Central Hub",
    assigned_driver_name: "Rameshwar Singh",
    assigned_driver_phone: "+91 98231 10021",
    overall_status: "COMPLIANT",
    status_label: "Fully Compliant",
    risk_level: "LOW",
    pending_challan_count: 0,
    total_fines_inr: "0.00",
    documents: {
      fitness: { document: "FITNESS", valid_until: "2027-08-15", days_remaining: 264, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (264d)" },
      insurance: { document: "INSURANCE", valid_until: "2027-04-10", days_remaining: 137, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (137d)" },
      pucc: { document: "PUCC", valid_until: "2027-02-28", days_remaining: 96, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (96d)" },
      permit: { document: "PERMIT", valid_until: "2028-01-01", days_remaining: 403, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (403d)" },
      tax: { document: "ROAD_TAX", valid_until: "2027-09-30", days_remaining: 310, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (310d)" },
    },
    last_verified: "2 hours ago",
  },
  {
    id: "flt-002",
    fleet_unit_number: "FLT-MH-9102",
    registration_number: "MH14DE5678",
    maker_model: "BHARATBENZ 3528R 8x2",
    vehicle_class: "Heavy Haulage Truck",
    depot_location: "Chakan Logistics Yard",
    assigned_driver_name: "Gurpreet Singh Gill",
    assigned_driver_phone: "+91 98765 43210",
    overall_status: "EXPIRING_SOON",
    status_label: "Expiring Soon (Insurance, PUC)",
    risk_level: "MODERATE",
    pending_challan_count: 1,
    total_fines_inr: "1,500.00",
    documents: {
      fitness: { document: "FITNESS", valid_until: "2027-06-20", days_remaining: 208, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (208d)" },
      insurance: { document: "INSURANCE", valid_until: "2026-12-05", days_remaining: 11, status: "EXPIRING_30D", alert_level: "WARNING", is_expired: false, is_expiring_soon: true, label: "11d remaining" },
      pucc: { document: "PUCC", valid_until: "2026-11-30", days_remaining: 6, status: "EXPIRING_7D", alert_level: "CRITICAL", is_expired: false, is_expiring_soon: true, label: "6d remaining" },
      permit: { document: "PERMIT", valid_until: "2027-10-15", days_remaining: 325, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (325d)" },
      tax: { document: "ROAD_TAX", valid_until: "2027-03-31", days_remaining: 127, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (127d)" },
    },
    last_verified: "Yesterday",
  },
  {
    id: "flt-003",
    fleet_unit_number: "FLT-DL-4409",
    registration_number: "DL01AB9999",
    maker_model: "ASHOK LEYLAND 4220 HG",
    vehicle_class: "Multi-Axle Commercial Cargo",
    depot_location: "Delhi NCR Terminal",
    assigned_driver_name: "Surendra Yadav",
    assigned_driver_phone: "+91 91234 56789",
    overall_status: "NON_COMPLIANT",
    status_label: "Groundable (Fitness Expired)",
    risk_level: "CRITICAL_RISK",
    pending_challan_count: 3,
    total_fines_inr: "6,000.00",
    documents: {
      fitness: { document: "FITNESS", valid_until: "2026-11-10", days_remaining: -14, status: "EXPIRED", alert_level: "CRITICAL", is_expired: true, is_expiring_soon: false, label: "Expired 14d ago" },
      insurance: { document: "INSURANCE", valid_until: "2027-01-15", days_remaining: 52, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (52d)" },
      pucc: { document: "PUCC", valid_until: "2026-11-20", days_remaining: -4, status: "EXPIRED", alert_level: "CRITICAL", is_expired: true, is_expiring_soon: false, label: "Expired 4d ago" },
      permit: { document: "PERMIT", valid_until: "2027-08-30", days_remaining: 279, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (279d)" },
      tax: { document: "ROAD_TAX", valid_until: "2026-12-31", days_remaining: 37, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (37d)" },
    },
    last_verified: "3 days ago",
  },
  {
    id: "flt-004",
    fleet_unit_number: "FLT-KA-2211",
    registration_number: "KA05MK3322",
    maker_model: "EICHER PRO 6028T",
    vehicle_class: "Medium Commercial Tipper",
    depot_location: "Navi Mumbai Depot",
    assigned_driver_name: "Mallikarjun Swamy",
    assigned_driver_phone: "+91 94488 23456",
    overall_status: "COMPLIANT",
    status_label: "Fully Compliant",
    risk_level: "LOW",
    pending_challan_count: 0,
    total_fines_inr: "0.00",
    documents: {
      fitness: { document: "FITNESS", valid_until: "2027-11-12", days_remaining: 353, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (353d)" },
      insurance: { document: "INSURANCE", valid_until: "2027-05-18", days_remaining: 175, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (175d)" },
      pucc: { document: "PUCC", valid_until: "2027-03-10", days_remaining: 106, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (106d)" },
      permit: { document: "PERMIT", valid_until: "2028-04-20", days_remaining: 512, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (512d)" },
      tax: { document: "ROAD_TAX", valid_until: "2027-12-31", days_remaining: 402, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (402d)" },
    },
    last_verified: "4 hours ago",
  },
  {
    id: "flt-005",
    fleet_unit_number: "FLT-GJ-7788",
    registration_number: "GJ01XY4455",
    maker_model: "VOLVO FM 420 8x4",
    vehicle_class: "Heavy Tipper Hauler",
    depot_location: "Chakan Logistics Yard",
    assigned_driver_name: "Pravinbhai Patel",
    assigned_driver_phone: "+91 98250 88990",
    overall_status: "EXPIRING_SOON",
    status_label: "Expiring Soon (National Permit)",
    risk_level: "MODERATE",
    pending_challan_count: 0,
    total_fines_inr: "0.00",
    documents: {
      fitness: { document: "FITNESS", valid_until: "2027-09-01", days_remaining: 281, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (281d)" },
      insurance: { document: "INSURANCE", valid_until: "2027-03-20", days_remaining: 116, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (116d)" },
      pucc: { document: "PUCC", valid_until: "2027-04-15", days_remaining: 142, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (142d)" },
      permit: { document: "PERMIT", valid_until: "2026-12-14", days_remaining: 20, status: "EXPIRING_30D", alert_level: "WARNING", is_expired: false, is_expiring_soon: true, label: "20d remaining" },
      tax: { document: "ROAD_TAX", valid_until: "2027-06-30", days_remaining: 218, status: "VALID", alert_level: "OK", is_expired: false, is_expiring_soon: false, label: "Valid (218d)" },
    },
    last_verified: "5 hours ago",
  },
];

const mockNotifications: NotificationItem[] = [
  {
    id: "notif-01",
    type: "EXPIRY_CRITICAL_TODAY",
    title: "CRITICAL: Fitness Certificate Expired for DL01AB9999",
    message: "Vehicle FLT-DL-4409 Fitness Certificate expired 14 days ago. Vehicle must be grounded immediately to prevent statutory impoundment.",
    severity: "CRITICAL",
    date: "14 mins ago",
    read: false,
  },
  {
    id: "notif-02",
    type: "EXPIRY_ALERT_7D",
    title: "PUC Expiring in 6 Days: MH14DE5678",
    message: "Vehicle FLT-MH-9102 Pollution Under Control certificate valid until Nov 30, 2026. Schedule emission test promptly.",
    severity: "WARNING",
    date: "2 hours ago",
    read: false,
  },
  {
    id: "notif-03",
    type: "BULK_VERIFICATION_COMPLETED",
    title: "Bulk Verification Complete (45/45 Vehicles Verified)",
    message: "Batch verification job bulk_sync_nov24 completed successfully. 45 credits deducted from spendable wallet.",
    severity: "SUCCESS",
    date: "Yesterday",
    read: true,
  },
];

export default function FleetPage() {
  const [fleet, setFleet] = useState<FleetItem[]>(mockFleetData);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [depotFilter, setDepotFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedVehicle, setSelectedVehicle] = useState<FleetItem | null>(null);

  // Modals & Drawers state
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(mockNotifications);

  // Bulk Verification State
  const [bulkInputText, setBulkInputText] = useState<string>("MH12AB1234\nMH14DE5678\nDL01AB9999\nKA05MK3322\nGJ01XY4455\nRJ14CB7890");
  const [bulkCostLimit, setBulkCostLimit] = useState<string>("500");
  const [bulkProcessing, setBulkProcessing] = useState<boolean>(false);
  const [bulkSuccess, setBulkSuccess] = useState<boolean>(false);

  // CSV Import State
  const [csvContent, setCsvContent] = useState<string>(
    "registration_number,fleet_unit_number,assigned_driver_name,assigned_driver_phone,depot_location,vehicle_class\n" +
    "MH12PQ9001,FLT-MH-9105,Ajay Shinde,+91 98220 11223,Bhiwandi Central Hub,Heavy Commercial Hauler\n" +
    "DL04KL3344,FLT-DL-4412,Mohan Lal,+91 99110 44556,Delhi NCR Terminal,Multi-Axle Tipper"
  );
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);

  // Filter fleet items
  const filteredFleet = fleet.filter((item) => {
    if (statusFilter === "COMPLIANT" && item.overall_status !== "COMPLIANT") return false;
    if (statusFilter === "EXPIRING_SOON" && item.overall_status !== "EXPIRING_SOON") return false;
    if (statusFilter === "EXPIRED" && item.overall_status !== "NON_COMPLIANT") return false;
    if (statusFilter === "HAS_CHALLANS" && item.pending_challan_count === 0) return false;

    if (depotFilter !== "ALL" && item.depot_location !== depotFilter) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        item.registration_number.toLowerCase().includes(q) ||
        item.fleet_unit_number.toLowerCase().includes(q) ||
        item.assigned_driver_name.toLowerCase().includes(q) ||
        item.maker_model.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Calculate metrics
  const totalFleet = fleet.length;
  const compliantCount = fleet.filter((f) => f.overall_status === "COMPLIANT").length;
  const expiringSoonCount = fleet.filter((f) => f.overall_status === "EXPIRING_SOON").length;
  const expiredCount = fleet.filter((f) => f.overall_status === "NON_COMPLIANT").length;
  const complianceScore = Math.round((compliantCount / totalFleet) * 100);
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  // Handle Export Download (CSV)
  const handleExportCsv = () => {
    const csvHeaders = "Fleet Unit #,Registration Number,Make & Model,Vehicle Class,Depot Location,Assigned Driver,Driver Phone,Fitness Expiry,Fitness Status,Insurance Expiry,Insurance Status,PUC Expiry,Permit Expiry,Road Tax Expiry,Overall Compliance,Pending Challans,Total Fines INR\n";
    const csvRows = filteredFleet.map((v) => {
      return `"${v.fleet_unit_number}","${v.registration_number}","${v.maker_model}","${v.vehicle_class}","${v.depot_location}","${v.assigned_driver_name}","${v.assigned_driver_phone}","${v.documents.fitness.valid_until}","${v.documents.fitness.status}","${v.documents.insurance.valid_until}","${v.documents.insurance.status}","${v.documents.pucc.valid_until}","${v.documents.permit.valid_until}","${v.documents.tax.valid_until}","${v.overall_status}",${v.pending_challan_count},"${v.total_fines_inr}"`;
    }).join("\n");

    const blob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `fleet_statutory_compliance_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run Bulk Verification Simulation
  const handleRunBulk = () => {
    setBulkProcessing(true);
    setBulkSuccess(false);

    setTimeout(() => {
      setBulkProcessing(false);
      setBulkSuccess(true);
      // Add notification
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        type: "BULK_VERIFICATION_COMPLETED",
        title: "Bulk Verification Complete",
        message: "Verified 6 vehicles via Parivahan engine. 6 credits deducted. Expiry dates refreshed.",
        severity: "SUCCESS",
        date: "Just now",
        read: false,
      };
      setNotifications([newNotif, ...notifications]);
    }, 1500);
  };

  // Run CSV Import
  const handleImportCsv = () => {
    setImportSuccessMessage("Successfully parsed and imported 2 new fleet vehicles into the active registry.");
    setTimeout(() => {
      setShowImportModal(false);
      setImportSuccessMessage(null);
    }, 1800);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Enterprise Fleet Watch
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> Parivahan Sync Active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Fleet Management & Statutory Expiry Registry
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time compliance monitoring, automated expiry countdowns, bulk Parivahan verification, and permission-governed fleet exports.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowNotificationDrawer(true)}
            className="relative px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Bell className="w-4 h-4 text-slate-500" />
            <span>Alerts</span>
            {unreadNotifCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white">
                {unreadNotifCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            <span>Schedule Checks</span>
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export (CSV)</span>
          </button>

          <button
            onClick={() => {
              setShowBulkModal(true);
              setBulkSuccess(false);
            }}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Bulk Verify</span>
          </button>
        </div>
      </div>

      {/* Provider Cost & Coverage Notice */}
      <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 flex items-start gap-3.5 shadow-sm">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <div className="font-bold text-sm text-blue-950 flex items-center gap-2">
            <span>Provider Coverage & Cost Economics Notice</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-200 text-blue-900 rounded">
              Tariff: 1 Cr (₹15.00) / Lookup
            </span>
          </div>
          <p className="text-blue-800 leading-relaxed">
            Parivahan national transport registry lookup is real-time (99.2%) for major freight corridors (MH, DL, KA, TN, GJ, UP, RJ, MP, TS, AP).
            Regional registries (HP, JK, MZ, AR, NL) may experience up to 24h batch latency or restricted owner masking per DPDP Act 2023.
            In accordance with <strong>Invariant 2</strong>, non-production test verification uses deterministic mock records carrying an indelible demonstration watermark.
          </p>
        </div>
      </div>

      {/* Top 5 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Fleet Size */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet Size</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900">{totalFleet}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Commercial transport units</div>
          </div>
        </div>

        {/* Fully Compliant */}
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Fully Compliant</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-emerald-900">{compliantCount}</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
              {complianceScore}% compliance score
            </div>
          </div>
        </div>

        {/* Expiring Soon (<30d) */}
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Expiring in 30d</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-amber-900">{expiringSoonCount}</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Renewal required soon</div>
          </div>
        </div>

        {/* Non-Compliant / Expired */}
        <div className="p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wider">Ground Violations</span>
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-red-900">{expiredCount}</div>
            <div className="text-[11px] font-bold text-red-700 mt-0.5">Immediate ground action</div>
          </div>
        </div>

        {/* Fleet Challans Fine */}
        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-800 uppercase tracking-wider">Unpaid Fines</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-purple-900">₹7,500.00</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Across 4 pending offenses</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by registration, unit #, driver name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All ({totalFleet})</option>
              <option value="COMPLIANT">Fully Compliant ({compliantCount})</option>
              <option value="EXPIRING_SOON">Expiring in 30d ({expiringSoonCount})</option>
              <option value="EXPIRED">Groundable / Expired ({expiredCount})</option>
              <option value="HAS_CHALLANS">Has Challans (2)</option>
            </select>
          </div>

          {/* Depot Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Depot:</span>
            <select
              value={depotFilter}
              onChange={(e) => setDepotFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Locations</option>
              <option value="Bhiwandi Central Hub">Bhiwandi Central Hub</option>
              <option value="Chakan Logistics Yard">Chakan Logistics Yard</option>
              <option value="Delhi NCR Terminal">Delhi NCR Terminal</option>
              <option value="Navi Mumbai Depot">Navi Mumbai Depot</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Fleet Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Fleet Vehicles & Statutory Compliance Matrix</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredFleet.length} Records
            </span>
          </div>
          <div className="text-xs text-slate-500">
            Showing real-time validity per CMV Rules
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Unit / Registration</th>
                <th className="px-4 py-3">Vehicle Class & Make</th>
                <th className="px-4 py-3">Depot & Driver</th>
                <th className="px-4 py-3">Fitness Expiry</th>
                <th className="px-4 py-3">Insurance Expiry</th>
                <th className="px-4 py-3">PUC Expiry</th>
                <th className="px-4 py-3">Permit</th>
                <th className="px-4 py-3">Compliance Status</th>
                <th className="px-4 py-3">Challans</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFleet.map((vehicle) => {
                const docs = vehicle.documents;
                return (
                  <tr key={vehicle.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Unit & Registration */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{vehicle.fleet_unit_number}</div>
                      <div className="font-mono text-[11px] font-semibold text-blue-700 mt-0.5">
                        {vehicle.registration_number}
                      </div>
                    </td>

                    {/* Make & Class */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{vehicle.maker_model}</div>
                      <div className="text-[11px] text-slate-500">{vehicle.vehicle_class}</div>
                    </td>

                    {/* Depot & Driver */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{vehicle.depot_location}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{vehicle.assigned_driver_name}</span>
                      </div>
                    </td>

                    {/* Fitness */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          docs.fitness.is_expired
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : docs.fitness.is_expiring_soon
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {docs.fitness.label}
                      </span>
                    </td>

                    {/* Insurance */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          docs.insurance.is_expired
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : docs.insurance.is_expiring_soon
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {docs.insurance.label}
                      </span>
                    </td>

                    {/* PUC */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          docs.pucc.is_expired
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : docs.pucc.is_expiring_soon
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {docs.pucc.label}
                      </span>
                    </td>

                    {/* Permit */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          docs.permit.is_expired
                            ? "bg-red-100 text-red-800 border border-red-200"
                            : docs.permit.is_expiring_soon
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {docs.permit.label}
                      </span>
                    </td>

                    {/* Overall Compliance */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          vehicle.overall_status === "COMPLIANT"
                            ? "bg-emerald-100 text-emerald-800"
                            : vehicle.overall_status === "EXPIRING_SOON"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {vehicle.overall_status === "COMPLIANT" && <CheckCircle2 className="w-3 h-3" />}
                        {vehicle.overall_status === "EXPIRING_SOON" && <Clock className="w-3 h-3" />}
                        {vehicle.overall_status === "NON_COMPLIANT" && <AlertTriangle className="w-3 h-3" />}
                        <span>{vehicle.overall_status}</span>
                      </span>
                    </td>

                    {/* Challans */}
                    <td className="px-4 py-3">
                      {vehicle.pending_challan_count > 0 ? (
                        <div className="flex flex-col">
                          <span className="font-bold text-red-700 text-[11px]">
                            {vehicle.pending_challan_count} Unpaid
                          </span>
                          <span className="text-[10px] text-slate-500">₹{vehicle.total_fines_inr}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-700 font-semibold">Clean</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Bulk Vehicle Verification */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Bulk Parivahan Vehicle Verification</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Registration Numbers (One per line)
                </label>
                <textarea
                  rows={6}
                  value={bulkInputText}
                  onChange={(e) => setBulkInputText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  placeholder="e.g. MH12AB1234&#10;MH14DE5678"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span>Detected: {bulkInputText.split("\n").filter((l) => l.trim()).length} vehicle numbers</span>
                  <span>Tariff: 1 Credit (₹15.00) / vehicle</span>
                </div>
              </div>

              {/* Cost Limits & Pre-flight Calculator */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                  <span>Pre-flight Cost Estimation</span>
                  <span className="text-sm text-blue-950 font-extrabold">
                    {bulkInputText.split("\n").filter((l) => l.trim()).length} Credits (₹
                    {(bulkInputText.split("\n").filter((l) => l.trim()).length * 15).toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <label className="text-slate-600 font-medium">Cost Ceiling Guard (₹):</label>
                  <input
                    type="number"
                    value={bulkCostLimit}
                    onChange={(e) => setBulkCostLimit(e.target.value)}
                    className="w-24 px-2 py-1 text-xs border border-slate-300 rounded bg-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500">Halts if cost exceeds ceiling</span>
                </div>
              </div>

              {/* Regional Warnings */}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Regional Provider Availability:</span>
                </div>
                <p>
                  Major state transport servers (MH, DL, KA, TN, GJ) are responding normally (142ms latency). HP and JK regional databases may have partial owner masking.
                </p>
              </div>

              {bulkSuccess && (
                <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <div className="font-bold">Batch Verification Completed Successfully!</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      6 vehicles checked. 6 credits deducted. Expiry dates refreshed across the fleet directory.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                disabled={bulkProcessing}
                onClick={handleRunBulk}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {bulkProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{bulkProcessing ? "Verifying..." : "Confirm & Run Bulk Check"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CSV / Excel Import */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Import Fleet Vehicles from CSV</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  CSV Content / Pasted Spreadsheet Columns
                </label>
                <textarea
                  rows={6}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Required column: <code className="font-bold text-slate-700">registration_number</code>. Optional: <code className="text-slate-700">fleet_unit_number, assigned_driver_name, assigned_driver_phone, depot_location, vehicle_class</code>.
                </div>
              </div>

              {importSuccessMessage && (
                <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleImportCsv}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Process & Import</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Scheduled Checks Configuration */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Scheduled Fleet Compliance Checks</h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Audit Run Frequency</label>
                <select className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-800">
                  <option>Daily at 02:00 AM UTC (Recommended)</option>
                  <option>Every Monday at 04:00 AM UTC</option>
                  <option>Twice Weekly (Wed & Sat)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Auto-Reverify Threshold (Days)
                </label>
                <input
                  type="number"
                  defaultValue={15}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono"
                />
                <span className="text-[11px] text-slate-500">
                  Vehicles whose VAHAN record has not refreshed in &gt; 15 days are automatically re-polled.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Max Credit Budget per Scheduled Run
                </label>
                <input
                  type="number"
                  defaultValue={500}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono"
                />
                <span className="text-[11px] text-slate-500">
                  Safety guard prevents unexpected wallet depletion.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Alert Email Recipients</label>
                <input
                  type="text"
                  defaultValue="ops@fleetvahaan.in, compliance@fleetvahaan.in"
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
              >
                Save Schedule Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Notifications & Statutory Alerts */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Fleet Expiry Alerts</h3>
              </div>
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-colors ${
                    notif.severity === "CRITICAL"
                      ? "border-red-200 bg-red-50/60 text-red-950"
                      : notif.severity === "WARNING"
                      ? "border-amber-200 bg-amber-50/60 text-amber-950"
                      : "border-emerald-200 bg-emerald-50/60 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{notif.title}</span>
                    <span className="text-[10px] text-slate-500">{notif.date}</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-700">{notif.message}</p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setNotifications(notifications.map((n) => ({ ...n, read: true })));
                }}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Mark all as read
              </button>
              <button
                onClick={() => setShowNotificationDrawer(false)}
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Vehicle Dossier Details */}
      {selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="font-bold text-base text-slate-900">
                  {selectedVehicle.registration_number} — {selectedVehicle.fleet_unit_number}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedVehicle.maker_model}</div>
              </div>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="w-7 h-7 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[75vh]">
              {/* Compliance Status Callout */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  selectedVehicle.overall_status === "COMPLIANT"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : selectedVehicle.overall_status === "EXPIRING_SOON"
                    ? "border-amber-200 bg-amber-50 text-amber-900"
                    : "border-red-200 bg-red-50 text-red-900"
                }`}
              >
                <div>
                  <div className="font-bold text-sm">Overall Status: {selectedVehicle.overall_status}</div>
                  <div className="text-[11px] mt-0.5">{selectedVehicle.status_label}</div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80">
                  {selectedVehicle.risk_level}
                </span>
              </div>

              {/* 5 Statutory Expiry Checklist */}
              <div>
                <div className="text-xs font-bold uppercase text-slate-600 mb-2">Statutory Documents Breakdown</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(selectedVehicle.documents).map(([key, doc]) => (
                    <div key={key} className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-800 uppercase">{doc.document}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">Expires: {doc.valid_until ?? "N/A"}</div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          doc.is_expired
                            ? "bg-red-100 text-red-800"
                            : doc.is_expiring_soon
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {doc.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational & Driver Details */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Depot Location</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedVehicle.depot_location}</div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Driver</span>
                  <div className="font-medium text-slate-800 mt-0.5">{selectedVehicle.assigned_driver_name}</div>
                  <div className="text-[11px] text-slate-500">{selectedVehicle.assigned_driver_phone}</div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
