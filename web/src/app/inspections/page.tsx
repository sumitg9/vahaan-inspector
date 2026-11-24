"use client";

import React, { useState } from "react";
import {
  FileCheck2,
  Plus,
  Search,
  Filter,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Car,
  Building,
  MoreVertical,
  Calendar,
  ExternalLink,
  ClipboardList,
  Save,
  RotateCcw,
  Check,
  XCircle,
  ShieldAlert,
  AlertTriangle,
  Camera,
  Upload,
  Image as ImageIcon,
  FileText,
  Layers,
  ShieldCheck,
  CircleDot,
  Gauge,
  MapPin,
  Hash,
  FileSearch,
  Percent,
  Truck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";

export type InspectionStatus =
  | "DRAFT"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "QC_REVIEW"
  | "CORRECTION_REQUESTED"
  | "APPROVED"
  | "CANCELLED";

export interface CheckpointItem {
  id: string;
  section: string;
  label: string;
  rating: "not_checked" | "pass" | "fail" | "repair_required";
  verified_physically: boolean;
  remarks: string;
}

export interface EvidenceItem {
  id: string;
  category: string;
  s3_key: string;
  file_size_bytes: number;
  mime_type: string;
  sha256_hash: string;
  latitude: number | null;
  longitude: number | null;
  captured_at: string;
  inspector_name: string;
  caption: string;
  is_damage_proof: boolean;
}

export interface TyreItem {
  axle_number: number;
  position: string;
  brand: string;
  size_spec: string;
  tread_depth_mm: number;
  remaining_life_pct: number;
  condition: string;
  remarks: string;
}

export interface InspectionCase {
  id: string;
  case_number: string;
  loan_reference_number?: string;
  vehicle_registration: string;
  vehicle_model: string;
  vehicle_category: "commercial_goods" | "passenger_car" | "two_wheeler";
  client_name: string;
  branch_name: string;
  assigned_inspector: string;
  priority: "URGENT" | "HIGH" | "NORMAL";
  status: InspectionStatus;
  created_at: string;
  appointment_date: string;
  qc_remarks?: string;
  checkpoints: CheckpointItem[];
  axle_layout?: string;
}

const DEFAULT_CHECKPOINTS: CheckpointItem[] = [
  {
    id: "cp-01",
    section: "Exterior & Body",
    label: "Cabin Structure & Long Member Mounting",
    rating: "not_checked", // Invariant 3: Untested items default to not_checked
    verified_physically: false,
    remarks: "",
  },
  {
    id: "cp-02",
    section: "Exterior & Body",
    label: "Windshield Glass, Wipers & Washer Jet",
    rating: "not_checked",
    verified_physically: false,
    remarks: "",
  },
  {
    id: "cp-03",
    section: "Engine & Powertrain",
    label: "Self-Starter, Cranking & Idling RPM",
    rating: "not_checked",
    verified_physically: false,
    remarks: "",
  },
  {
    id: "cp-04",
    section: "Engine & Powertrain",
    label: "Engine Oil Level & Blowby Gas Emission",
    rating: "not_checked",
    verified_physically: false,
    remarks: "",
  },
  {
    id: "cp-05",
    section: "Chassis & Suspension",
    label: "Leaf Spring Assembly, Pins & U-Bolts",
    rating: "not_checked",
    verified_physically: false,
    remarks: "",
  },
  {
    id: "cp-06",
    section: "Tyres & Brakes",
    label: "Dual Air Brake Chamber & Foot Valve Response",
    rating: "not_checked",
    verified_physically: false,
    remarks: "",
  },
];

// Initial 10-Wheeler Commercial Tipper Tyres (AC-TYRE-01)
const INITIAL_10_TYRES: TyreItem[] = [
  { axle_number: 1, position: "FRONT_LEFT", brand: "MRF STEEL MUSCLE", size_spec: "295/90 R20", tread_depth_mm: 12.0, remaining_life_pct: 85, condition: "GOOD", remarks: "Even tread wear" },
  { axle_number: 1, position: "FRONT_RIGHT", brand: "MRF STEEL MUSCLE", size_spec: "295/90 R20", tread_depth_mm: 11.5, remaining_life_pct: 80, condition: "GOOD", remarks: "Even tread wear" },
  { axle_number: 2, position: "AXLE2_LEFT_OUTER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 9.0, remaining_life_pct: 65, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_LEFT_INNER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 8.5, remaining_life_pct: 60, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_RIGHT_INNER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 9.2, remaining_life_pct: 65, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_RIGHT_OUTER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 8.8, remaining_life_pct: 60, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 3, position: "AXLE3_LEFT_OUTER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 5.0, remaining_life_pct: 35, condition: "AVERAGE", remarks: "Approaching wear indicator" },
  { axle_number: 3, position: "AXLE3_LEFT_INNER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 4.8, remaining_life_pct: 35, condition: "AVERAGE", remarks: "Approaching wear indicator" },
  { axle_number: 3, position: "AXLE3_RIGHT_INNER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 1.2, remaining_life_pct: 10, condition: "WORN_OUT", remarks: "Breaches legal safety minimum (1.6mm)" }, // AC-TYRE-02 Breached!
  { axle_number: 3, position: "AXLE3_RIGHT_OUTER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 4.5, remaining_life_pct: 30, condition: "AVERAGE", remarks: "Moderate wear" },
  { axle_number: 0, position: "SPARE", brand: "MRF SUPER LUG", size_spec: "295/90 R20", tread_depth_mm: 14.0, remaining_life_pct: 95, condition: "EXCELLENT", remarks: "Unused stepney wheel" },
];

const INITIAL_EVIDENCES: EvidenceItem[] = [
  {
    id: "evi-001",
    category: "FRONT_45",
    s3_key: "org-1111/inspections/case-001/FRONT_45_20261124_a1b2c3d4.webp",
    file_size_bytes: 1450280,
    mime_type: "image/webp",
    sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    latitude: 18.5204,
    longitude: 73.8567,
    captured_at: "2026-11-24 10:15:30",
    inspector_name: "Suresh Patil",
    caption: "Front 3/4 perspective showing cab, bumper, and registration plate",
    is_damage_proof: false,
  },
  {
    id: "evi-002",
    category: "ODOMETER",
    s3_key: "org-1111/inspections/case-001/ODOMETER_20261124_f5e6d7c8.webp",
    file_size_bytes: 982100,
    mime_type: "image/webp",
    sha256_hash: "b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8d8e8f8a8b8c8",
    latitude: 18.5205,
    longitude: 73.8568,
    captured_at: "2026-11-24 10:20:12",
    inspector_name: "Suresh Patil",
    caption: "Digital instrument cluster display showing 45,210 km",
    is_damage_proof: false,
  },
  {
    id: "evi-003",
    category: "CHASSIS_STAMP",
    s3_key: "org-1111/inspections/case-001/CHASSIS_STAMP_20261124_33445566.webp",
    file_size_bytes: 1320000,
    mime_type: "image/webp",
    sha256_hash: "778899aabbccddeeff00112233445566778899aabbccddeeff00112233445566",
    latitude: 18.5204,
    longitude: 73.8567,
    captured_at: "2026-11-24 10:22:15",
    inspector_name: "Suresh Patil",
    caption: "Right long-member stamped chassis VIN number punch",
    is_damage_proof: false,
  },
  {
    id: "evi-004",
    category: "DAMAGE",
    s3_key: "org-1111/inspections/case-001/DAMAGE_20261124_11223344.webp",
    file_size_bytes: 1120000,
    mime_type: "image/webp",
    sha256_hash: "c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2",
    latitude: 18.5206,
    longitude: 73.8569,
    captured_at: "2026-11-24 10:25:45",
    inspector_name: "Suresh Patil",
    caption: "Rear tailgate dent with sheet metal deformation and paint scratch",
    is_damage_proof: true,
  },
  {
    id: "evi-005",
    category: "DOCUMENT",
    s3_key: "org-1111/inspections/case-001/DOCUMENT_20261124_99887766.webp",
    file_size_bytes: 2048500,
    mime_type: "image/webp",
    sha256_hash: "d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2f3f4f5f6f7f8f9f0a1a2a3a4a5",
    latitude: 18.5204,
    longitude: 73.8567,
    captured_at: "2026-11-24 10:30:00",
    inspector_name: "Suresh Patil",
    caption: "Original physical RC Smart Card front side",
    is_damage_proof: false,
  },
];

const INITIAL_CASES: InspectionCase[] = [
  {
    id: "case-001",
    case_number: "INS-2026-00891",
    loan_reference_number: "LN-TATA-9921",
    vehicle_registration: "MH12AB1234",
    vehicle_model: "Tata Prima 2830.K Tipper",
    vehicle_category: "commercial_goods",
    client_name: "Tata Capital Commercial",
    branch_name: "Pune HQ",
    assigned_inspector: "Suresh Patil",
    priority: "URGENT",
    status: "UNDER_REVIEW",
    created_at: "2026-03-14",
    appointment_date: "2026-03-15",
    qc_remarks: "Pending valuer physical audit verification.",
    axle_layout: "3_AXLE_10W",
    checkpoints: DEFAULT_CHECKPOINTS.map((cp, idx) =>
      idx < 4
        ? { ...cp, rating: "pass", verified_physically: true, remarks: "Inspected at yard" }
        : cp
    ),
  },
  {
    id: "case-002",
    case_number: "INS-2026-00892",
    loan_reference_number: "LN-HDFC-4410",
    vehicle_registration: "DL01XY9999",
    vehicle_model: "Maruti Suzuki Swift ZXi",
    vehicle_category: "passenger_car",
    client_name: "HDFC Bank Auto Loans",
    branch_name: "Delhi Branch",
    assigned_inspector: "Amit Shinde",
    priority: "HIGH",
    status: "IN_PROGRESS",
    created_at: "2026-03-15",
    appointment_date: "2026-03-16",
    axle_layout: "2_AXLE_4W",
    checkpoints: DEFAULT_CHECKPOINTS.map((cp, idx) =>
      idx < 2
        ? { ...cp, rating: "pass", verified_physically: true, remarks: "OK" }
        : cp
    ),
  },
  {
    id: "case-003",
    case_number: "INS-2026-00893",
    loan_reference_number: "LN-ICICI-8812",
    vehicle_registration: "KA01MJ0001",
    vehicle_model: "BMW 330Li Gran Limousine",
    vehicle_category: "passenger_car",
    client_name: "ICICI Bank Used Cars",
    branch_name: "Bengaluru South",
    assigned_inspector: "Mahesh Deshmukh",
    priority: "NORMAL",
    status: "APPROVED",
    created_at: "2026-03-10",
    appointment_date: "2026-03-11",
    axle_layout: "2_AXLE_4W",
    qc_remarks: "Full audit complete. Certificate frozen with SHA-256 snapshot.",
    checkpoints: DEFAULT_CHECKPOINTS.map((cp) => ({
      ...cp,
      rating: "pass",
      verified_physically: true,
      remarks: "Verified authentic",
    })),
  },
  {
    id: "case-004",
    case_number: "INS-2026-00894",
    loan_reference_number: "LN-CHOLA-7102",
    vehicle_registration: "MH14EF4321",
    vehicle_model: "Ashok Leyland 4220 HG",
    vehicle_category: "commercial_goods",
    client_name: "Cholamandalam Finance",
    branch_name: "Chakan Branch",
    assigned_inspector: "Unassigned",
    priority: "URGENT",
    status: "ASSIGNED",
    created_at: "2026-03-16",
    appointment_date: "2026-03-17",
    axle_layout: "4_AXLE_12W",
    checkpoints: DEFAULT_CHECKPOINTS,
  },
];

export default function InspectionCasesPage() {
  const [cases, setCases] = useState<InspectionCase[]>(INITIAL_CASES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Modals state
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isTyresOpen, setIsTyresOpen] = useState(false);
  const [isUploadPhotoOpen, setIsUploadPhotoOpen] = useState(false);

  // Selected state
  const [selectedCaseForAssign, setSelectedCaseForAssign] = useState<InspectionCase | null>(null);
  const [selectedInspector, setSelectedInspector] = useState("Suresh Patil");

  const [selectedCaseForChecklist, setSelectedCaseForChecklist] = useState<InspectionCase | null>(null);
  const [editingCheckpoints, setEditingCheckpoints] = useState<CheckpointItem[]>([]);
  const [correctionRemarksInput, setCorrectionRemarksInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Evidence & OCR State
  const [selectedCaseForEvidence, setSelectedCaseForEvidence] = useState<InspectionCase | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>(INITIAL_EVIDENCES);
  const [evidenceCategoryFilter, setEvidenceCategoryFilter] = useState("ALL");
  const [evidenceTab, setEvidenceTab] = useState<"photos" | "ocr">("photos");

  // OCR state
  const [ocrDocType, setOcrDocType] = useState<"RC_SMART_CARD" | "INSURANCE_POLICY" | "PUC_CERTIFICATE">("RC_SMART_CARD");
  const [ocrScenario, setOcrScenario] = useState<"standard" | "discrepancy" | "expired">("standard");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);

  // Upload Evidence state
  const [uploadCategory, setUploadCategory] = useState("FRONT_45");
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadIsDamageProof, setUploadIsDamageProof] = useState(false);

  // Tyres State
  const [selectedCaseForTyres, setSelectedCaseForTyres] = useState<InspectionCase | null>(null);
  const [currentAxleLayout, setCurrentAxleLayout] = useState("3_AXLE_10W");
  const [tyresList, setTyresList] = useState<TyreItem[]>(INITIAL_10_TYRES);
  const [selectedWheelPosition, setSelectedWheelPosition] = useState<string>("AXLE3_RIGHT_INNER");

  // New Case Form State
  const [newReg, setNewReg] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCategory, setNewCategory] = useState<"commercial_goods" | "passenger_car" | "two_wheeler">("commercial_goods");
  const [newClient, setNewClient] = useState("HDFC Bank Auto Loans");
  const [newLoanRef, setNewLoanRef] = useState("");
  const [newPriority, setNewPriority] = useState<"URGENT" | "HIGH" | "NORMAL">("NORMAL");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredCases = cases.filter((c) => {
    const matchesSearch =
      c.case_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehicle_registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.vehicle_model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.loan_reference_number && c.loan_reference_number.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      c.status === statusFilter ||
      (statusFilter === "QC_REVIEW" && (c.status === "UNDER_REVIEW" || c.status === "SUBMITTED"));

    return matchesSearch && matchesStatus;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReg || !newModel) return;

    const newCaseNumber = `INS-2026-00${cases.length + 896}`;
    const loanRef = newLoanRef || `LN-REF-${Math.floor(1000 + Math.random() * 9000)}`;

    const created: InspectionCase = {
      id: `case-${Date.now()}`,
      case_number: newCaseNumber,
      loan_reference_number: loanRef,
      vehicle_registration: newReg.toUpperCase().replace(/\s/g, ""),
      vehicle_model: newModel,
      vehicle_category: newCategory,
      client_name: newClient,
      branch_name: "Pune HQ",
      assigned_inspector: "Unassigned",
      priority: newPriority,
      status: "ASSIGNED",
      created_at: new Date().toISOString().split("T")[0],
      appointment_date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      checkpoints: DEFAULT_CHECKPOINTS,
      axle_layout: newCategory === "commercial_goods" ? "3_AXLE_10W" : "2_AXLE_4W",
    };

    setCases([created, ...cases]);
    setIsNewCaseOpen(false);
    setNewReg("");
    setNewModel("");
    setNewLoanRef("");
    showToast(`Inspection Case ${newCaseNumber} created in ASSIGNED state.`);
  };

  const handleAssignInspector = () => {
    if (!selectedCaseForAssign) return;
    setCases(
      cases.map((c) =>
        c.id === selectedCaseForAssign.id
          ? { ...c, assigned_inspector: selectedInspector, status: "IN_PROGRESS" }
          : c
      )
    );
    setIsAssignOpen(false);
    showToast(`Surveyor ${selectedInspector} assigned to ${selectedCaseForAssign.case_number}.`);
    setSelectedCaseForAssign(null);
  };

  const openChecklistModal = (c: InspectionCase) => {
    setSelectedCaseForChecklist(c);
    setEditingCheckpoints([...c.checkpoints]);
    setIsChecklistOpen(true);
  };

  const openEvidenceModal = (c: InspectionCase) => {
    setSelectedCaseForEvidence(c);
    setIsEvidenceOpen(true);
    setOcrResult(null);
  };

  const openTyresModal = (c: InspectionCase) => {
    setSelectedCaseForTyres(c);
    setCurrentAxleLayout(c.axle_layout || "3_AXLE_10W");
    setIsTyresOpen(true);
  };

  const updateCheckpointRating = (
    id: string,
    rating: "not_checked" | "pass" | "fail" | "repair_required",
    verified: boolean
  ) => {
    setEditingCheckpoints((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const finalRating = verified ? rating : "not_checked";
          return { ...item, rating: finalRating, verified_physically: verified };
        }
        return item;
      })
    );
  };

  const updateCheckpointRemarks = (id: string, remarks: string) => {
    setEditingCheckpoints((prev) =>
      prev.map((item) => (item.id === id ? { ...item, remarks } : item))
    );
  };

  const handleSaveDraft = () => {
    if (!selectedCaseForChecklist) return;
    setCases(
      cases.map((c) =>
        c.id === selectedCaseForChecklist.id
          ? { ...c, checkpoints: editingCheckpoints }
          : c
      )
    );
    showToast("Draft checkpoint responses saved. Untested items maintained as 'not_checked'.");
  };

  const handleSubmitForReview = () => {
    if (!selectedCaseForChecklist) return;
    setCases(
      cases.map((c) =>
        c.id === selectedCaseForChecklist.id
          ? { ...c, checkpoints: editingCheckpoints, status: "UNDER_REVIEW" }
          : c
      )
    );
    setIsChecklistOpen(false);
    showToast(`Case ${selectedCaseForChecklist.case_number} submitted for Valuer QC review.`);
  };

  const handleOpenCorrection = () => {
    setCorrectionRemarksInput("");
    setIsCorrectionModalOpen(true);
  };

  const handleConfirmCorrection = () => {
    if (!correctionRemarksInput.trim()) {
      alert("Quality Control Invariant: Correction remarks are strictly mandatory.");
      return;
    }
    if (!selectedCaseForChecklist) return;

    setCases(
      cases.map((c) =>
        c.id === selectedCaseForChecklist.id
          ? {
              ...c,
              status: "CORRECTION_REQUESTED",
              qc_remarks: correctionRemarksInput,
              checkpoints: editingCheckpoints,
            }
          : c
      )
    );
    setIsCorrectionModalOpen(false);
    setIsChecklistOpen(false);
    showToast("Correction requested. Case status set to CORRECTION_REQUESTED.");
  };

  const handleApproveDossier = () => {
    if (!selectedCaseForChecklist) return;
    setCases(
      cases.map((c) =>
        c.id === selectedCaseForChecklist.id
          ? {
              ...c,
              status: "APPROVED",
              checkpoints: editingCheckpoints,
              qc_remarks: "Approved by Certified QC Valuer. Ready for snapshot freezing.",
            }
          : c
      )
    );
    setIsChecklistOpen(false);
    showToast(`Case ${selectedCaseForChecklist.case_number} APPROVED. Dossier snapshot locked.`);
  };

  // Evidence Upload Handler
  const handleAddEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    const hash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const newEvi: EvidenceItem = {
      id: `evi-${Date.now()}`,
      category: uploadCategory,
      s3_key: `org-1111/inspections/${selectedCaseForEvidence?.case_number || "case-001"}/${uploadCategory}_${Date.now()}.webp`,
      file_size_bytes: 1420500,
      mime_type: "image/webp",
      sha256_hash: hash,
      latitude: 18.5204 + (Math.random() - 0.5) * 0.005,
      longitude: 73.8567 + (Math.random() - 0.5) * 0.005,
      captured_at: new Date().toISOString().replace("T", " ").split(".")[0],
      inspector_name: "Suresh Patil",
      caption: uploadCaption || "Field photographic proof",
      is_damage_proof: uploadIsDamageProof,
    };

    setEvidenceList([newEvi, ...evidenceList]);
    setIsUploadPhotoOpen(false);
    setUploadCaption("");
    setUploadIsDamageProof(false);
    showToast(`Photograph logged in slot ${uploadCategory} with SHA-256 hash.`);
  };

  // OCR Processing Simulation
  const handleRunOcrComparison = async () => {
    setOcrLoading(true);
    setOcrResult(null);

    try {
      const res = await fetch(`/api/inspections/${selectedCaseForEvidence?.id || "case-001"}/documents/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_type: ocrDocType,
          scenario: ocrScenario,
        }),
      });

      const data = await res.json();
      setOcrResult(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  };

  // Tyre Assessment Handlers
  const updateTyreTreadDepth = (position: string, depthMm: number) => {
    setTyresList((prev) =>
      prev.map((t) => {
        if (t.position === position) {
          // AC-TYRE-02: Safety Invariant Check: < 1.6 mm strictly forces WORN_OUT
          let cond = t.condition;
          let life = Math.min(100, Math.round((depthMm / 14) * 100));

          if (depthMm < 1.6) {
            cond = "WORN_OUT";
            life = Math.min(life, 15);
          } else if (depthMm >= 10) {
            cond = "GOOD";
          } else if (depthMm >= 5) {
            cond = "AVERAGE";
          }

          return {
            ...t,
            tread_depth_mm: depthMm,
            remaining_life_pct: life,
            condition: cond,
            remarks: depthMm < 1.6 ? "Breaches legal safety minimum (1.6mm)" : t.remarks,
          };
        }
        return t;
      })
    );
  };

  const updateTyreBrand = (position: string, brand: string) => {
    setTyresList((prev) =>
      prev.map((t) => (t.position === position ? { ...t, brand } : t))
    );
  };

  // Calculated Tyre Metrics
  const tyreMetrics = (() => {
    const total = tyresList.length;
    if (!total) return { total: 0, avgDepth: 0, avgLife: 0, wornOutCount: 0, criticalCount: 0, estCost: 0 };

    let sumDepth = 0;
    let sumLife = 0;
    let worn = 0;
    let crit = 0;

    for (const t of tyresList) {
      sumDepth += t.tread_depth_mm;
      sumLife += t.remaining_life_pct;
      if (t.tread_depth_mm < 1.6 || t.condition === "WORN_OUT" || t.condition === "DAMAGED_CUT") {
        worn++;
      }
      if (t.tread_depth_mm < 1.6) {
        crit++;
      }
    }

    return {
      total,
      avgDepth: Number((sumDepth / total).toFixed(1)),
      avgLife: Math.round(sumLife / total),
      wornOutCount: worn,
      criticalCount: crit,
      estCost: worn * 26500,
    };
  })();

  const activeWheel = tyresList.find((t) => t.position === selectedWheelPosition) || tyresList[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Physical Inspection Management</span>
            <Badge variant="default" className="text-[10px]">ISO 17020</Badge>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-axle tyre condition audit, photographic evidence storage, document OCR comparison, and quality control workflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsNewCaseOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Inspection Case</span>
          </Button>
        </div>
      </div>

      {/* KPI Pipeline Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Cases</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{cases.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Multi-tenant portfolio</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">In Field Progress</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {cases.filter((c) => c.status === "IN_PROGRESS" || c.status === "CORRECTION_REQUESTED").length}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">Surveyors on site</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Pending QC Review</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {cases.filter((c) => c.status === "UNDER_REVIEW" || c.status === "SUBMITTED" || (c.status as any) === "QC_REVIEW").length}
            </div>
            <div className="text-[11px] text-purple-600 font-semibold mt-1">Valuer audit needed</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Approved Dossiers</div>
            <div className="text-2xl font-bold text-semantic-teal mt-1">
              {cases.filter((c) => c.status === "APPROVED").length}
            </div>
            <div className="text-[11px] text-semantic-teal font-semibold mt-1">Snapshots frozen</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-semantic-teal flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between p-5 pb-3 border-b border-slate-100 gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Case No, Reg No, or Client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium text-slate-800"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {["ALL", "ASSIGNED", "IN_PROGRESS", "QC_REVIEW", "CORRECTION_REQUESTED", "APPROVED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === st
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredCases.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="No Inspection Cases Found"
              description="No inspection cases match your current filter or search criteria."
              actionLabel="Create Inspection Case"
              onAction={() => setIsNewCaseOpen(true)}
              className="py-12"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Case ID</TableHead>
                  <TableHead className="w-[180px]">Vehicle & Class</TableHead>
                  <TableHead>Client & Loan Ref</TableHead>
                  <TableHead className="w-[150px]">Assigned Surveyor</TableHead>
                  <TableHead className="w-[100px] text-center">Priority</TableHead>
                  <TableHead className="w-[140px] text-center">Status</TableHead>
                  <TableHead className="w-[260px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold text-xs text-brand">
                      {c.case_number}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-mono font-bold text-slate-900">{c.vehicle_registration}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[170px]">{c.vehicle_model}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="font-semibold text-slate-800">{c.client_name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{c.loan_reference_number || c.branch_name}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.assigned_inspector === "Unassigned" ? (
                        <span className="text-slate-400 italic">Unassigned</span>
                      ) : (
                        <span className="font-medium text-slate-800">{c.assigned_inspector}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={c.priority === "URGENT" ? "destructive" : c.priority === "HIGH" ? "warning" : "secondary"}
                        className="text-[10px]"
                      >
                        {c.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          c.status === "APPROVED"
                            ? "success"
                            : c.status === "CORRECTION_REQUESTED"
                            ? "destructive"
                            : c.status === "UNDER_REVIEW" || (c.status as any) === "QC_REVIEW"
                            ? "default"
                            : c.status === "IN_PROGRESS"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {c.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Evidence & OCR Modal Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1 text-slate-700"
                          onClick={() => openEvidenceModal(c)}
                          title="Photographic Evidence & OCR Desk"
                        >
                          <Camera className="w-3 h-3 text-brand" />
                          <span>Photos</span>
                        </Button>

                        {/* Multi-Axle Tyre Audit Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1 text-slate-700"
                          onClick={() => openTyresModal(c)}
                          title="Multi-Axle Tyre Inspection"
                        >
                          <CircleDot className="w-3 h-3 text-amber-600" />
                          <span>Tyres</span>
                        </Button>

                        {/* Checklist Audit Button */}
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-7 text-[11px] px-2 gap-1 text-brand"
                          onClick={() => openChecklistModal(c)}
                        >
                          <ClipboardList className="w-3 h-3" />
                          <span>Audit</span>
                        </Button>

                        {/* Valuation Dossier Link */}
                        <Link href={`/valuation?reg=${c.vehicle_registration}`}>
                          <Button variant="default" size="sm" className="h-7 text-[11px] px-2">
                            Dossier
                          </Button>
                        </Link>

                        {/* A4 Report Link */}
                        <Link href={`/inspections/${c.id}/report`}>
                          <Button variant="outline" size="sm" className="h-7 text-[11px] px-2 gap-1 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100" title="View A4 Printable Report Dossier">
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>Report</span>
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Create New Inspection Case */}
      <Dialog
        open={isNewCaseOpen}
        onOpenChange={setIsNewCaseOpen}
        title="Create New Ground Inspection Case"
        description="Initiate an on-site physical inspection dossier for commercial or private vehicles."
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Registration Number *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. MH12AB1234"
              value={newReg}
              onChange={(e) => setNewReg(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Make & Model *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tata Prima 2830.K or Maruti Swift"
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Vehicle Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="commercial_goods">Commercial Goods (HCV/LCV)</option>
                <option value="passenger_car">Passenger Car (Sedan/SUV)</option>
                <option value="two_wheeler">Two Wheeler (Motorcycle)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Inspection Priority
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="NORMAL">Normal SLA (48 hrs)</option>
                <option value="HIGH">High Priority (24 hrs)</option>
                <option value="URGENT">Urgent Express (Same Day)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Client / Lending Institution
              </label>
              <select
                value={newClient}
                onChange={(e) => setNewClient(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              >
                <option value="HDFC Bank Auto Loans">HDFC Bank Auto Loans</option>
                <option value="Tata Capital Commercial">Tata Capital Commercial</option>
                <option value="ICICI Bank Used Cars">ICICI Bank Used Cars</option>
                <option value="Cholamandalam Finance">Cholamandalam Finance</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Loan Reference Number
              </label>
              <input
                type="text"
                placeholder="e.g. LN-2026-9081"
                value={newLoanRef}
                onChange={(e) => setNewLoanRef(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewCaseOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm">
              Create Case Dossier
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Assign Field Inspector */}
      <Dialog
        open={isAssignOpen}
        onOpenChange={setIsAssignOpen}
        title="Assign Field Surveyor"
        description={selectedCaseForAssign ? `Case ${selectedCaseForAssign.case_number} (${selectedCaseForAssign.vehicle_registration})` : ""}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Certified Field Inspector
            </label>
            <select
              value={selectedInspector}
              onChange={(e) => setSelectedInspector(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium"
            >
              <option value="Suresh Patil">Suresh Patil (Senior Surveyor — HCV Specialist)</option>
              <option value="Amit Shinde">Amit Shinde (Field Inspector — Pune City)</option>
              <option value="Mahesh Deshmukh">Mahesh Deshmukh (Certified Valuer & QC Lead)</option>
              <option value="Pooja Sharma">Pooja Sharma (Automotive Engineer — Pimpri)</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
            <div>
              <strong>Dispatch Notice:</strong> The mobile surveyor app will receive an instant push notification via FCM with offline sync credentials.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAssignInspector}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Interactive Checkpoints & State Transition Workflow */}
      <Dialog
        open={isChecklistOpen}
        onOpenChange={setIsChecklistOpen}
        title={`Inspection Dossier Audit — ${selectedCaseForChecklist?.case_number}`}
        description={`Vehicle: ${selectedCaseForChecklist?.vehicle_registration} (${selectedCaseForChecklist?.vehicle_model}) • Status: ${selectedCaseForChecklist?.status}`}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Architectural Invariant 3 Notice */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-brand" />
              <span>Architectural Invariant 3: Prohibition of Data Fabrication</span>
            </div>
            <div className="text-[11px] text-blue-800">
              Untested inspection checkpoints strictly default to <strong>not_checked</strong>. Items cannot be marked Pass/Fail without physical field verification.
            </div>
          </div>

          {/* QC Remarks Banner if Correction Requested */}
          {selectedCaseForChecklist?.qc_remarks && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>QC Reviewer Notes:</span>
              </div>
              <div className="text-[11px] text-amber-950 font-mono">
                {selectedCaseForChecklist.qc_remarks}
              </div>
            </div>
          )}

          {/* Checkpoints List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Physical Checkpoints ({editingCheckpoints.length} Items)
            </div>

            {editingCheckpoints.map((cp) => (
              <div
                key={cp.id}
                className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-colors space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-brand tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                      {cp.section}
                    </span>
                    <div className="font-semibold text-slate-800 mt-1">{cp.label}</div>
                  </div>
                  <div>
                    <Badge
                      variant={
                        cp.rating === "pass"
                          ? "success"
                          : cp.rating === "fail"
                          ? "destructive"
                          : cp.rating === "repair_required"
                          ? "warning"
                          : "secondary"
                      }
                      className="text-[10px] font-mono"
                    >
                      {cp.rating === "not_checked" ? "NOT CHECKED" : cp.rating.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cp.verified_physically}
                      onChange={(e) =>
                        updateCheckpointRating(
                          cp.id,
                          cp.rating === "not_checked" ? "pass" : cp.rating,
                          e.target.checked
                        )
                      }
                      className="w-3.5 h-3.5 rounded text-brand focus:ring-brand border-slate-300"
                    />
                    <span>Physically Verified on Site</span>
                  </label>

                  <div className="flex items-center gap-1">
                    {(["not_checked", "pass", "repair_required", "fail"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        disabled={!cp.verified_physically && r !== "not_checked"}
                        onClick={() => updateCheckpointRating(cp.id, r, cp.verified_physically)}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                          cp.rating === r
                            ? r === "pass"
                              ? "bg-emerald-600 text-white"
                              : r === "fail"
                              ? "bg-rose-600 text-white"
                              : r === "repair_required"
                              ? "bg-amber-600 text-white"
                              : "bg-slate-700 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                      >
                        {r === "not_checked" ? "Not Checked" : r.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Auditor or surveyor observation notes..."
                    value={cp.remarks}
                    onChange={(e) => updateCheckpointRemarks(cp.id, e.target.value)}
                    className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="gap-1 text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleOpenCorrection}
                className="gap-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Request Correction</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSubmitForReview}
                className="gap-1 text-xs"
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Submit for QC</span>
              </Button>

              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleApproveDossier}
                className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve Dossier</span>
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Sub-Dialog: Mandatory QC Correction Notes */}
      <Dialog
        open={isCorrectionModalOpen}
        onOpenChange={setIsCorrectionModalOpen}
        title="Request Surveyor Correction"
        description="Quality Invariant: You must specify clear, actionable instructions for the field surveyor."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory QC Rejection Remarks *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Odometer photo is out of focus; re-upload legible snapshot of instrument cluster."
              value={correctionRemarksInput}
              onChange={(e) => setCorrectionRemarksInput(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCorrectionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleConfirmCorrection}
            >
              Dispatch Correction Request
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Categorized Photographic Evidence & Document OCR Comparison */}
      <Dialog
        open={isEvidenceOpen}
        onOpenChange={setIsEvidenceOpen}
        title={`Photographic Evidence & Document OCR — ${selectedCaseForEvidence?.case_number}`}
        description={`Vehicle: ${selectedCaseForEvidence?.vehicle_registration} (${selectedCaseForEvidence?.vehicle_model}) • Multi-Tenant Private S3 Storage`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Sub-tab Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setEvidenceTab("photos")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                evidenceTab === "photos"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Categorized Photos ({evidenceList.length})</span>
            </button>
            <button
              onClick={() => setEvidenceTab("ocr")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                evidenceTab === "ocr"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <FileSearch className="w-3.5 h-3.5" />
              <span>Document OCR & Registry Match</span>
            </button>
          </div>

          {/* TAB 1: PHOTOGRAPHS GALLERY */}
          {evidenceTab === "photos" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  {["ALL", "FRONT_45", "ODOMETER", "CHASSIS_STAMP", "DAMAGE", "DOCUMENT"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setEvidenceCategoryFilter(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                        evidenceCategoryFilter === cat
                          ? "bg-brand text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {cat.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="default"
                  onClick={() => setIsUploadPhotoOpen(true)}
                  className="h-7 text-xs gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload Photograph</span>
                </Button>
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {evidenceList
                  .filter((evi) => evidenceCategoryFilter === "ALL" || evi.category === evidenceCategoryFilter)
                  .map((evi) => (
                    <div
                      key={evi.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-2 shadow-sm"
                    >
                      {/* Photo Placeholder Visual */}
                      <div className="h-32 bg-slate-900 rounded-md flex flex-col items-center justify-center relative overflow-hidden text-slate-400">
                        <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                        <span className="font-mono text-[10px] text-slate-300 uppercase tracking-wider">
                          {evi.category.replace("_", " ")}
                        </span>
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          <Badge variant="secondary" className="text-[9px] bg-slate-800 text-white">
                            WebP
                          </Badge>
                          {evi.is_damage_proof && (
                            <Badge variant="destructive" className="text-[9px]">
                              DAMAGE PROOF
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[9px] text-slate-300 bg-black/60 px-1.5 py-0.5 rounded">
                          <MapPin className="w-2.5 h-2.5 text-rose-400" />
                          <span>{evi.latitude ? `${evi.latitude.toFixed(4)}°, ${evi.longitude?.toFixed(4)}°` : "No GPS"}</span>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="space-y-1 text-xs">
                        <div className="font-semibold text-slate-900 truncate">{evi.caption}</div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Captured: {evi.captured_at}</span>
                          <span>{(evi.file_size_bytes / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="p-1.5 bg-slate-50 rounded border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-500 truncate max-w-[200px]">
                            <Hash className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span>{evi.sha256_hash.slice(0, 16)}...</span>
                          </div>
                          <Badge variant="success" className="text-[9px] px-1 py-0">
                            Verified SHA-256
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENT OCR & COMPARISON DESK */}
          {evidenceTab === "ocr" && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Automated OCR Document Extraction & Registry Comparison
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={ocrDocType}
                      onChange={(e) => setOcrDocType(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand/30"
                    >
                      <option value="RC_SMART_CARD">RC Smart Card (Registration Certificate)</option>
                      <option value="INSURANCE_POLICY">Motor Insurance Certificate</option>
                      <option value="PUC_CERTIFICATE">PUC Emission Certificate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Test Verification Scenario
                    </label>
                    <select
                      value={ocrScenario}
                      onChange={(e) => setOcrScenario(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-brand/30 font-medium"
                    >
                      <option value="standard">Standard Authentic Document (100% Match)</option>
                      <option value="discrepancy">Chassis VIN Suffix Discrepancy (Tampered)</option>
                      <option value="expired">Expired Document Scenario</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    variant="default"
                    disabled={ocrLoading}
                    onClick={handleRunOcrComparison}
                    className="gap-1.5 text-xs"
                  >
                    <FileSearch className="w-3.5 h-3.5" />
                    <span>{ocrLoading ? "Extracting OCR & Comparing..." : "Run OCR & Match Registry"}</span>
                  </Button>
                </div>
              </div>

              {/* OCR Comparison Results */}
              {ocrResult && (
                <div className="space-y-3 animate-in fade-in">
                  {/* Match Banner */}
                  <div
                    className={`p-3 rounded-lg border flex items-center justify-between ${
                      ocrResult.comparison.status === "MATCH"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                        : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {ocrResult.comparison.status === "MATCH" ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-rose-600" />
                      )}
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wide">
                          Registry Match Score: {ocrResult.comparison.match_percentage}% ({ocrResult.comparison.status.replace("_", " ")})
                        </div>
                        <div className="text-[11px] opacity-80">
                          OCR Confidence: {(ocrResult.confidence_score * 100).toFixed(0)}% • Engine: MockOcrV2-Vision
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant={ocrResult.comparison.status === "MATCH" ? "success" : "destructive"}
                      className="text-xs font-mono"
                    >
                      {ocrResult.comparison.status}
                    </Badge>
                  </div>

                  {/* Discrepancies Alert */}
                  {ocrResult.comparison.discrepancies.length > 0 && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-950 space-y-1">
                      <div className="font-semibold flex items-center gap-1.5 text-rose-800">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Critical Document Discrepancies Detected:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] font-medium">
                        {ocrResult.comparison.discrepancies.map((d: string, i: number) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Side-by-Side Comparison Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="w-[140px] text-xs">Field</TableHead>
                          <TableHead className="text-xs">Document OCR Extracted</TableHead>
                          <TableHead className="text-xs">VAHAN Official Registry</TableHead>
                          <TableHead className="w-[100px] text-center text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(ocrResult.comparison.field_comparisons).map(([field, comp]: any) => (
                          <TableRow key={field}>
                            <TableCell className="font-mono text-xs font-bold text-slate-700 capitalize">
                              {field.replace("_", " ")}
                            </TableCell>
                            <TableCell className="font-mono text-xs font-semibold text-slate-900">
                              {comp.document || comp.document_expiry || comp.document_value || "N/A"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-600">
                              {comp.registry || comp.registry_value || (comp.is_expired ? "EXPIRED" : "ACTIVE")}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  comp.status === "EXACT_MATCH" || comp.status === "VALID"
                                    ? "success"
                                    : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {comp.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Dialog>

      {/* Sub-Dialog: Upload New Evidence Photograph */}
      <Dialog
        open={isUploadPhotoOpen}
        onOpenChange={setIsUploadPhotoOpen}
        title="Upload Inspection Photograph"
        description="Private S3 partitioned upload with cryptographic SHA-256 hash and EXIF GPS tagging."
      >
        <form onSubmit={handleAddEvidence} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Evidence Slot Category *
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium"
            >
              <option value="FRONT_45">Front 45° Perspective</option>
              <option value="REAR_45">Rear 45° Perspective</option>
              <option value="LEFT_PROFILE">Left Full Profile</option>
              <option value="RIGHT_PROFILE">Right Full Profile</option>
              <option value="ODOMETER">Odometer & Instrument Cluster</option>
              <option value="CHASSIS_STAMP">Chassis Long Member Punch Stamp</option>
              <option value="ENGINE_BAY">Engine Bay & Tappet Cover</option>
              <option value="CABIN">Cabin & Dashboard Interior</option>
              <option value="TYRE">Tyre Tread & Sidewall</option>
              <option value="DAMAGE">Physical Damage / Dent / Rust</option>
              <option value="DOCUMENT">Physical Document (RC / Insurance / PUC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Observation / Photo Caption
            </label>
            <input
              type="text"
              placeholder="e.g. Sharp scratch on front bumper corner"
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-medium"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="damageProofCheck"
              checked={uploadIsDamageProof}
              onChange={(e) => setUploadIsDamageProof(e.target.checked)}
              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
            />
            <label htmlFor="damageProofCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              Tag as explicit <strong>Damage Proof</strong> for repair cost deductions
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadPhotoOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm">
              Confirm & Store Artifact
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Dialog: Configurable Multi-Axle Tyre Inspection & Layout Desk */}
      <Dialog
        open={isTyresOpen}
        onOpenChange={setIsTyresOpen}
        title={`Multi-Axle Tyre Inspection — ${selectedCaseForTyres?.case_number}`}
        description={`Vehicle: ${selectedCaseForTyres?.vehicle_registration} (${selectedCaseForTyres?.vehicle_model}) • Axle Schema Assessment`}
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Axle Layout Configuration Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-brand" />
                <span>Configurable Axle Layout (AC-TYRE-01)</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Individual road wheels assessment plus stepney spare.
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={currentAxleLayout}
                onChange={(e) => setCurrentAxleLayout(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand/30"
              >
                <option value="3_AXLE_10W">3-Axle Commercial Tipper (10 Wheels + Spare)</option>
                <option value="2_AXLE_6W">2-Axle Commercial Dual (6 Wheels + Spare)</option>
                <option value="2_AXLE_4W">2-Axle Passenger Vehicle (4 Wheels + Spare)</option>
                <option value="4_AXLE_12W">4-Axle Heavy Haulage (12 Wheels + Spare)</option>
              </select>
            </div>
          </div>

          {/* AC-TYRE-02 Legal Safety Alert Banner if any tyre breaches 1.6mm */}
          {tyreMetrics.criticalCount > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>AC-TYRE-02 Safety Threshold Breach Detected ({tyreMetrics.criticalCount} Tyre)</span>
              </div>
              <div className="text-[11px] text-rose-950">
                One or more wheels have measured tread depth &lt; <strong>1.6 mm</strong> (Central Motor Vehicles Safety Minimum). Condition is strictly forced to <strong>WORN_OUT</strong>.
              </div>
            </div>
          )}

          {/* Visual Axle Schematic Map */}
          <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Axle Layout Schematic View</span>
              <span className="text-[11px] text-slate-300">Click wheel to inspect / edit</span>
            </div>

            <div className="space-y-4 py-2">
              {/* Axle 1: Front Steer */}
              <div className="flex items-center justify-between px-6 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setSelectedWheelPosition("FRONT_LEFT")}
                  className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    selectedWheelPosition === "FRONT_LEFT"
                      ? "ring-2 ring-brand bg-slate-700 border-brand"
                      : "bg-slate-800 border-slate-600 hover:border-slate-400"
                  }`}
                >
                  <div className="text-[10px] text-slate-400">FL (Steer)</div>
                  <div className="font-mono text-xs font-bold text-emerald-400">
                    {tyresList.find((t) => t.position === "FRONT_LEFT")?.tread_depth_mm.toFixed(1)} mm
                  </div>
                </button>

                <div className="flex-1 flex items-center justify-center">
                  <div className="h-1 w-full bg-slate-600 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Axle 1 (Steering)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedWheelPosition("FRONT_RIGHT")}
                  className={`px-3 py-1.5 rounded-lg border text-center transition-all ${
                    selectedWheelPosition === "FRONT_RIGHT"
                      ? "ring-2 ring-brand bg-slate-700 border-brand"
                      : "bg-slate-800 border-slate-600 hover:border-slate-400"
                  }`}
                >
                  <div className="text-[10px] text-slate-400">FR (Steer)</div>
                  <div className="font-mono text-xs font-bold text-emerald-400">
                    {tyresList.find((t) => t.position === "FRONT_RIGHT")?.tread_depth_mm.toFixed(1)} mm
                  </div>
                </button>
              </div>

              {/* Axle 2: Drive Dual */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE2_LEFT_OUTER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE2_LEFT_OUTER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A2-LO</div>
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      {tyresList.find((t) => t.position === "AXLE2_LEFT_OUTER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE2_LEFT_INNER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE2_LEFT_INNER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A2-LI</div>
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      {tyresList.find((t) => t.position === "AXLE2_LEFT_INNER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="h-1.5 w-full bg-slate-600 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Axle 2 (Drive Dual)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE2_RIGHT_INNER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE2_RIGHT_INNER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A2-RI</div>
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      {tyresList.find((t) => t.position === "AXLE2_RIGHT_INNER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE2_RIGHT_OUTER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE2_RIGHT_OUTER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A2-RO</div>
                    <div className="font-mono text-xs font-bold text-emerald-400">
                      {tyresList.find((t) => t.position === "AXLE2_RIGHT_OUTER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                </div>
              </div>

              {/* Axle 3: Tag / Dummy Dual */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700/60">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE3_LEFT_OUTER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE3_LEFT_OUTER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A3-LO</div>
                    <div className="font-mono text-xs font-bold text-amber-400">
                      {tyresList.find((t) => t.position === "AXLE3_LEFT_OUTER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE3_LEFT_INNER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE3_LEFT_INNER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A3-LI</div>
                    <div className="font-mono text-xs font-bold text-amber-400">
                      {tyresList.find((t) => t.position === "AXLE3_LEFT_INNER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                </div>

                <div className="flex-1 flex items-center justify-center">
                  <div className="h-1.5 w-full bg-slate-600 relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      Axle 3 (Tag / Dummy)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE3_RIGHT_INNER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE3_RIGHT_INNER"
                        ? "ring-2 ring-rose-500 bg-slate-700 border-rose-500"
                        : "bg-slate-800 border-rose-500/80 hover:border-rose-400"
                    }`}
                  >
                    <div className="text-[9px] text-rose-300 font-bold">A3-RI ⚠️</div>
                    <div className="font-mono text-xs font-bold text-rose-400">
                      {tyresList.find((t) => t.position === "AXLE3_RIGHT_INNER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedWheelPosition("AXLE3_RIGHT_OUTER")}
                    className={`px-2.5 py-1.5 rounded border text-center transition-all ${
                      selectedWheelPosition === "AXLE3_RIGHT_OUTER"
                        ? "ring-2 ring-brand bg-slate-700 border-brand"
                        : "bg-slate-800 border-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">A3-RO</div>
                    <div className="font-mono text-xs font-bold text-amber-400">
                      {tyresList.find((t) => t.position === "AXLE3_RIGHT_OUTER")?.tread_depth_mm.toFixed(1)} mm
                    </div>
                  </button>
                </div>
              </div>

              {/* Spare Wheel */}
              <div className="flex items-center justify-center pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedWheelPosition("SPARE")}
                  className={`px-4 py-1.5 rounded-lg border text-center transition-all flex items-center gap-2 ${
                    selectedWheelPosition === "SPARE"
                      ? "ring-2 ring-brand bg-slate-700 border-brand"
                      : "bg-slate-800 border-slate-600 hover:border-slate-400"
                  }`}
                >
                  <div className="text-[10px] text-slate-400 uppercase">Stepney / Spare Wheel:</div>
                  <div className="font-mono text-xs font-bold text-emerald-400">
                    {tyresList.find((t) => t.position === "SPARE")?.tread_depth_mm.toFixed(1)} mm (Unused)
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Individual Wheel Assessment Editor */}
          {activeWheel && (
            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                  <CircleDot className="w-4 h-4 text-brand" />
                  <span>Inspecting Position: {activeWheel.position.replace(/_/g, " ")}</span>
                </div>
                <Badge
                  variant={
                    activeWheel.condition === "EXCELLENT" || activeWheel.condition === "GOOD"
                      ? "success"
                      : activeWheel.condition === "WORN_OUT"
                      ? "destructive"
                      : "warning"
                  }
                  className="text-[10px]"
                >
                  {activeWheel.condition}
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Tyre Brand
                  </label>
                  <input
                    type="text"
                    value={activeWheel.brand}
                    onChange={(e) => updateTyreBrand(activeWheel.position, e.target.value.toUpperCase())}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Measured Tread Depth (mm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="30"
                    value={activeWheel.tread_depth_mm}
                    onChange={(e) => updateTyreTreadDepth(activeWheel.position, parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Remaining Tread Life (%)
                  </label>
                  <input
                    type="number"
                    readOnly
                    value={activeWheel.remaining_life_pct}
                    className="w-full px-2.5 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded font-mono font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Legal Warning Notice if < 1.6mm */}
              {activeWheel.tread_depth_mm < 1.6 && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-[11px] text-rose-800 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                  <span>
                    <strong>Legal Safety Rule Violation:</strong> Tread depth &lt; 1.6 mm violates CMV rules. Condition automatically locked to <strong>WORN_OUT</strong>.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Aggregated Tyre Health & Valuation Penalty Card */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Wheels Inspected</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{tyreMetrics.total} Wheels</div>
              <div className="text-[10px] text-slate-500">10 Road + 1 Spare</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Average Tread Depth</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">{tyreMetrics.avgDepth} mm</div>
              <div className="text-[10px] text-emerald-600 font-semibold">{tyreMetrics.avgLife}% Life Remaining</div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Worn / Breached</div>
              <div className={`text-base font-bold mt-0.5 ${tyreMetrics.wornOutCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                {tyreMetrics.wornOutCount} Wheels
              </div>
              <div className="text-[10px] text-rose-600 font-medium">
                {tyreMetrics.criticalCount > 0 ? "Legal Minimum Breached" : "Within limits"}
              </div>
            </div>

            <div>
              <div className="text-[11px] text-slate-500 font-medium">Refurbishment Deduction</div>
              <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                ₹{tyreMetrics.estCost.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-slate-500">Auto-fed to valuation desk</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTyresOpen(false)}
            >
              Close
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                showToast("Multi-axle tyre assessments saved. Refurbishment deduction updated.");
                setIsTyresOpen(false);
              }}
            >
              Save Axle Assessment
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
