import { NextRequest, NextResponse } from "next/server";

interface MockReportSnapshot {
  id: string;
  inspection_case_id: string;
  organization_id: string;
  version: string;
  verification_token: string;
  sha256_checksum: string;
  pdf_s3_key: string;
  pdf_size_bytes: number;
  page_count: number;
  is_mock_watermarked: boolean;
  rendered_at: string;
  snapshot_data: any;
}

// In-memory mock snapshot registry for web API routes
const mockSnapshotsStore: Record<string, MockReportSnapshot[]> = {};

function compileMock11Sections(caseId: string, version: string) {
  return {
    section_1_executive_summary: {
      case_id: caseId,
      loan_reference_number: "HL-COMM-2026-88412",
      client_name: "State Bank of India - SME Commercial Asset Division",
      branch_name: "Mumbai Fort Commercial Branch",
      registration_number: "MH12PQ9876",
      maker_model: "Tata Motors - LPT 3118 TC 6x2 Tipper",
      vehicle_category: "COMMERCIAL_HEAVY",
      inspection_date: "2026-11-23 11:30:00",
      inspection_location: "Tata Motors Authorized Hub, Hadapsar Industrial Area, Pune, Maharashtra",
      inspection_gps: { latitude: 18.5089, longitude: 73.9260 },
      inspector_name: "Vikram S. Deshmukh",
      inspector_id: "EMP-INSP-8412",
      valuer_name: "Er. Rajeshwar K. Patil (F.I.E., Chartered Engineer)",
      valuer_id: "usr-valuer-01",
      overall_condition_grade: "B+ (Good Commercial Condition)",
      approved_fair_market_value_paise: 182000000,
      approved_fair_market_value_inr: 1820000.0,
      approved_distress_value_paise: 154700000,
      approved_distress_value_inr: 1547000.0,
      report_version: version,
      verification_token: "d6a8f10204e9800998ecf8427e112233445566778899aabbccddeeff00112233",
      sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    section_2_registration_identity: {
      registration_number: "MH12PQ9876",
      registered_owner_masked: "M**** S**** LOGISTICS LLP",
      ownership_sequence: "1st Owner",
      registration_date: "2022-06-15",
      manufacturing_date: "2022-04-01",
      chassis_number: "MAT842109N3K12345",
      chassis_number_masked: "MAT842109N3K*****",
      engine_number: "697TC54K987654",
      engine_number_masked: "697TC54K******",
      rto_authority: "MH-12 Pune RTO, Maharashtra",
      vehicle_class: "Heavy Goods Vehicle (HGV)",
      body_type: "Full Metal Open Tipper",
      fuel_type: "DIESEL",
      emission_norms: "BHARAT STAGE VI (BS-VI)",
      seating_capacity: "3 (Driver + 2 Co-passengers)",
      cubic_capacity_cc: 5883,
      unladen_weight_kg: 9850,
      gross_vehicle_weight_kg: 31000,
      financier_name: "Tata Motors Finance Limited",
      hypothecation_status: "HYPOTHECATED",
      insurance_company: "New India Assurance Co. Ltd.",
      insurance_policy_number: "NIA/2026/COMM/8841920",
      insurance_valid_until: "2027-06-14",
      fitness_valid_until: "2028-06-14",
      tax_valid_until: "2027-03-31",
      pucc_valid_until: "2027-05-10",
      national_permit_number: "NP/MH/2022/887412",
      permit_valid_until: "2027-06-14",
      blacklist_status: "CLEAN (No NCRB or Parivahan Blacklist Found)",
    },
    section_3_traffic_challans: {
      summary: {
        pending_challans_count: 2,
        pending_fines_paise: 350000,
        pending_fines_inr: 3500.0,
        disposed_challans_count: 4,
        total_lifetime_challans: 6,
        clean_record: false,
      },
      challan_records: [
        {
          challan_number: "MH12P221008145210",
          offence_date_time: "2026-03-12 14:32:00",
          offence_details: "Dangerous driving / Lane violation on expressway (MV Act Sec 184)",
          rto_name: "Pune Expressway Traffic Police",
          state_code: "MH",
          fine_amount_paise: 200000,
          fine_amount_inr: 2000.0,
          challan_status: "PENDING",
          parivahan_url: "https://echallan.parivahan.gov.in/",
        },
        {
          challan_number: "MH14T220805112040",
          offence_date_time: "2026-05-18 09:15:00",
          offence_details: "Over-speeding violation caught by automated camera (MV Act Sec 112/183)",
          rto_name: "Pimpri-Chinchwad Traffic Division",
          state_code: "MH",
          fine_amount_paise: 150000,
          fine_amount_inr: 1500.0,
          challan_status: "PENDING",
          parivahan_url: "https://echallan.parivahan.gov.in/",
        },
        {
          challan_number: "MH12D210904081020",
          offence_date_time: "2025-09-04 11:20:00",
          offence_details: "Improper parking obstructing general traffic (MV Act Sec 122/177)",
          rto_name: "Pune City Traffic Branch",
          state_code: "MH",
          fine_amount_paise: 50000,
          fine_amount_inr: 500.0,
          challan_status: "DISPOSED",
          parivahan_url: "https://echallan.parivahan.gov.in/",
        },
      ],
      statutory_notice:
        "Traffic violations queried from eChallan Parivahan National Portal. Official receipts strictly through https://echallan.parivahan.gov.in/.",
    },
    section_4_cabin_body_chassis: {
      checkpoints: [
        { category: "Cabin Structure", item: "Cabin Outer Sheet Metal & Cowl", status: "Pass", remarks: "Original factory panels; minor paint scrape on left lower footstep." },
        { category: "Cabin Structure", item: "Cabin Floor & Mounting Bushes", status: "Pass", remarks: "Cabin tilt hydraulic mechanism and rubber dampers firm and intact." },
        { category: "Load Platform", item: "Load Bed Floor Plate (8mm Steel)", status: "Pass", remarks: "Normal surface wear from aggregate haulage; no puncturing or tear." },
        { category: "Load Platform", item: "Side Walls & Hydraulic Tailgate", status: "Pass", remarks: "Reinforced steel side panels straight; locking latch pins secure." },
        { category: "Chassis Frame", item: "Main Longitudinal Ladder Side Members", status: "Pass", remarks: "Straight channel frame; no cold straightening, twist or rust pitting." },
        { category: "Chassis Frame", item: "Cross Members & Structural Riveting", status: "Pass", remarks: "Factory hot-riveted joints sound; zero loose bolts or repair welds." },
      ],
    },
    section_5_systems_mechanical: {
      checkpoints: [
        { system: "Powertrain", item: "Engine Cold Start & Idling Rhythm", status: "Pass", remarks: "Instant crank at ambient temperature; smooth 6-cylinder idling sound." },
        { system: "Powertrain", item: "Engine Lubrication & Sump Integrity", status: "Pass", remarks: "15W-40 oil level normal; zero active drip." },
        { system: "Drivetrain", item: "Clutch Engagement & Pedal Free Play", status: "Pass", remarks: "380mm single dry plate engages smoothly without chatter or slip." },
        { system: "Drivetrain", item: "Synchromesh Gearbox (9-Speed Manual)", status: "Pass", remarks: "All forward gears and crawler engage cleanly with no gear rattle." },
        { system: "Brakes & Air", item: "Dual Circuit Full Air S-Cam Brakes", status: "Pass", remarks: "Air reservoir reaches 8.5 bar cutoff in 3.8 mins; zero leak rate." },
        { system: "Steering", item: "Integral Hydraulic Power Steering", status: "Pass", remarks: "Free play < 15mm; power steering hydraulic pump silent under lock." },
      ],
    },
    section_6_electricals_safety_docs: {
      checkpoints: [
        { category: "Electricals", item: "24V Heavy Commercial Batteries (2x12V)", status: "Pass", remarks: "Exide 150Ah dual batteries; 25.8V resting terminal voltage." },
        { category: "Electricals", item: "Dashboard Instrumentation & Odometer", status: "Pass", remarks: "Digital odometer reads 148,210 km; warning lamps extinguish upon start." },
        { category: "Safety Kit", item: "Speed Governor Device (80 km/h Limit)", status: "Pass", remarks: "Electronic speed governor fitted and lead-sealed per AIS-018 standard." },
        { category: "Safety Kit", item: "High Security Registration Plates (HSRP)", status: "Pass", remarks: "Laser-etched front and rear HSRP aluminium plates securely riveted." },
        { category: "Documents Match", item: "Original Physical RC Smart Card Match", status: "Pass", remarks: "Original laminated RC present; matches VAHAN registry 100%." },
        { category: "Documents Match", item: "Chassis Number Stamping Verification", status: "Pass", remarks: "Chassis stamp on right side front frame flange matches RC and VIN plate exactly." },
      ],
    },
    section_7_tyres_matrix: {
      axle_layout: "3_AXLE_10W (Commercial Heavy Tipper - 10 Road Wheels + 1 Spare)",
      total_tyres_count: 11,
      average_tread_depth_mm: 6.2,
      worn_out_count: 1,
      critical_alert_count: 1,
      ac_tyre_02_safety_alert: "SAFETY NOTICE: 1 wheel (Axle 3 Right Outer) measures 1.4 mm tread depth (< 1.6 mm legal limit).",
      tyre_records: [
        { position: "A1_LEFT", position_label: "Front Steer Left (FL)", brand: "Apollo EnduRace RA", size_spec: "295/90 R20", tread_depth_mm: 8.4, remaining_life_pct: 75, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A1_RIGHT", position_label: "Front Steer Right (FR)", brand: "Apollo EnduRace RA", size_spec: "295/90 R20", tread_depth_mm: 8.1, remaining_life_pct: 72, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A2_LEFT_OUTER", position_label: "Axle 2 Left Outer", brand: "MRF Super Lug 50", size_spec: "295/90 R20", tread_depth_mm: 6.8, remaining_life_pct: 60, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A2_LEFT_INNER", position_label: "Axle 2 Left Inner", brand: "MRF Super Lug 50", size_spec: "295/90 R20", tread_depth_mm: 6.5, remaining_life_pct: 58, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A2_RIGHT_INNER", position_label: "Axle 2 Right Inner", brand: "MRF Super Lug 50", size_spec: "295/90 R20", tread_depth_mm: 6.2, remaining_life_pct: 55, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A2_RIGHT_OUTER", position_label: "Axle 2 Right Outer", brand: "MRF Super Lug 50", size_spec: "295/90 R20", tread_depth_mm: 6.4, remaining_life_pct: 57, condition: "GOOD", is_critical_safety_alert: false },
        { position: "A3_LEFT_OUTER", position_label: "Axle 3 Left Outer", brand: "CEAT WinSuper X3", size_spec: "295/90 R20", tread_depth_mm: 5.2, remaining_life_pct: 45, condition: "FAIR", is_critical_safety_alert: false },
        { position: "A3_LEFT_INNER", position_label: "Axle 3 Left Inner", brand: "CEAT WinSuper X3", size_spec: "295/90 R20", tread_depth_mm: 5.0, remaining_life_pct: 42, condition: "FAIR", is_critical_safety_alert: false },
        { position: "A3_RIGHT_INNER", position_label: "Axle 3 Right Inner", brand: "CEAT WinSuper X3", size_spec: "295/90 R20", tread_depth_mm: 4.8, remaining_life_pct: 40, condition: "FAIR", is_critical_safety_alert: false },
        { position: "A3_RIGHT_OUTER", position_label: "Axle 3 Right Outer", brand: "CEAT WinSuper X3", size_spec: "295/90 R20", tread_depth_mm: 1.4, remaining_life_pct: 10, condition: "WORN_OUT", is_critical_safety_alert: true },
        { position: "SPARE_1", position_label: "Spare Wheel Carrier", brand: "JK Tyre Jet R Miles", size_spec: "295/90 R20", tread_depth_mm: 9.2, remaining_life_pct: 85, condition: "GOOD", is_critical_safety_alert: false },
      ],
    },
    section_8_evidence_gallery: {
      total_photographs: 12,
      photos: [
        { category: "FRONT_45", label: "Front 45° Angle View", sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:15:20", is_damage: false },
        { category: "REAR_45", label: "Rear 45° Angle View", sha256_hash: "d41d8cd98f00b204e9800998ecf8427e00000000000000000000000000000000", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:16:04", is_damage: false },
        { category: "ODOMETER", label: "Illuminated Dashboard & Odometer", sha256_hash: "c3d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff001122", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:21:05", is_damage: false },
        { category: "CHASSIS_STAMP", label: "Chassis Frame VIN Stamping", sha256_hash: "e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff0011223344", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:23:45", is_damage: false },
        { category: "DAMAGE", label: "Footstep Scrape & Dent Close-up", sha256_hash: "18293a4b5c6d7e8f90112233445566778899aabbccddeeff0011223344556677", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:27:00", is_damage: true },
        { category: "ENGINE_BAY", label: "Complete Engine Compartment View", sha256_hash: "d4e5f60718293a4b5c6d7e8f90112233445566778899aabbccddeeff00112233", gps: "18.5089° N, 73.9260° E", timestamp: "2026-11-23 11:22:30", is_damage: false },
      ],
    },
    section_9_valuation_dossier: {
      valuation_type: "Certified Valuation Dossier",
      is_certified: true,
      valuation_methodology: "DEPRECIATED_MARKET_VALUE_COMMERCIAL",
      ex_showroom_price_inr: 3850000.0,
      age_in_months: 53,
      age_depreciation_pct: 48.5,
      base_depreciated_value_inr: 1982750.0,
      odometer_adjustment_inr: 85000.0,
      condition_deduction_inr: 50000.0,
      estimated_repair_refurbishment_inr: 105000.0,
      proposed_fair_market_value_inr: 1742750.0,
      proposed_distress_value_inr: 1481337.0,
      valuer_override_applied: true,
      override_justification:
        "Strong institutional transport demand and complete powertrain overhaul justify premium above algorithmic benchmark.",
      final_fair_market_value_inr: 1820000.0,
      final_distress_value_inr: 1547000.0,
      certified_valuer_remarks: "Chassis alignment checked, engine compression normal, no structural damage detected.",
      valuation_approved_at: "2026-11-24 16:45:00",
    },
    section_10_approvals: {
      inspector_signoff: {
        name: "Vikram S. Deshmukh",
        role: "Certified Field Automobile Inspector",
        employee_id: "EMP-INSP-8412",
        timestamp: "2026-11-23 14:10:00",
      },
      qc_officer_signoff: {
        name: "Sunil V. Mahajan",
        role: "Quality Control Officer & Technical Reviewer",
        employee_id: "EMP-QC-1092",
        timestamp: "2026-11-23 18:20:00",
        qc_remarks: "Inspection checkpoints, chassis stamping close-up, and tyre tread depths verified.",
      },
      certified_valuer_signoff: {
        name: "Er. Rajeshwar K. Patil",
        role: "Govt. Approved Valuer (Cat-I) & Chartered Engineer",
        license_number: "CAT-I/MUM/VAL/2014-9982",
        timestamp: "2026-11-24 16:45:00",
      },
      verification_token: "d6a8f10204e9800998ecf8427e112233445566778899aabbccddeeff00112233",
      sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    },
    section_11_disclaimers: {
      is_mock_watermarked: true,
      watermark_text: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
      statutory_disclaimers: [
        "This Inspection and Valuation Dossier has been compiled for the exclusive use of the requesting banking or financing institution.",
        "Vehicle identification stamping was examined physically at the time of inspection.",
        "Traffic violation records represent information indexed by Parivahan eChallan at the exact query timestamp.",
        "All market valuations are opinions based on prevailing commercial vehicle benchmarks and trade transactions.",
      ],
    },
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const url = new URL(request.url);
  const requestedVersion = url.searchParams.get("version");

  const snapshots = mockSnapshotsStore[caseId] || [];

  if (snapshots.length === 0) {
    // Generate initial snapshot v1.0
    const snapshotData = compileMock11Sections(caseId, "1.0");
    const initial: MockReportSnapshot = {
      id: "snap-1001",
      inspection_case_id: caseId,
      organization_id: "org-11111111-1111-1111-1111-111111111111",
      version: "1.0",
      verification_token: "d6a8f10204e9800998ecf8427e112233445566778899aabbccddeeff00112233",
      sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      pdf_s3_key: `org-11111111-1111-1111-1111-111111111111/reports/${caseId}/vahancheck_inspection_${caseId}_v1.0.pdf`,
      pdf_size_bytes: 1845200,
      page_count: 9,
      is_mock_watermarked: true,
      rendered_at: new Date().toISOString(),
      snapshot_data: snapshotData,
    };
    mockSnapshotsStore[caseId] = [initial];
    return NextResponse.json({ success: true, data: initial });
  }

  if (requestedVersion) {
    const match = snapshots.find((s) => s.version === requestedVersion);
    if (!match) {
      return NextResponse.json(
        { success: false, error_code: "ERR_REPORT_VERSION_NOT_FOUND", message: `Version ${requestedVersion} not found.` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: match });
  }

  // Return latest
  return NextResponse.json({ success: true, data: snapshots[snapshots.length - 1] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const existing = mockSnapshotsStore[caseId] || [];

  const nextVersion = existing.length === 0 ? "1.0" : `1.${existing.length}`;
  const snapshotData = compileMock11Sections(caseId, nextVersion);

  const newSnapshot: MockReportSnapshot = {
    id: `snap-${Date.now()}`,
    inspection_case_id: caseId,
    organization_id: "org-11111111-1111-1111-1111-111111111111",
    version: nextVersion,
    verification_token: `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    pdf_s3_key: `org-11111111-1111-1111-1111-111111111111/reports/${caseId}/vahancheck_inspection_${caseId}_v${nextVersion}.pdf`,
    pdf_size_bytes: 1845200,
    page_count: 9,
    is_mock_watermarked: true,
    rendered_at: new Date().toISOString(),
    snapshot_data: snapshotData,
  };

  mockSnapshotsStore[caseId] = [...existing, newSnapshot];

  return NextResponse.json(
    { success: true, message: `Report snapshot v${nextVersion} compiled and frozen.`, data: newSnapshot },
    { status: 201 }
  );
}
