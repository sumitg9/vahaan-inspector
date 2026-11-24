import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;

  // If token is invalid or too short
  if (!token || token.length < 8) {
    return NextResponse.json(
      {
        success: false,
        error_code: "ERR_INVALID_TOKEN",
        message: "Invalid or malformed verification token.",
      },
      { status: 404 }
    );
  }

  // Simulated authentic verification response
  return NextResponse.json({
    success: true,
    message: "Authentic report snapshot verified successfully.",
    data: {
      is_valid: true,
      tamper_check_passed: true,
      verification_token: token,
      sha256_checksum: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      case_id: "case-001",
      report_version: "1.0",
      registration_number: "MH12PQ9876",
      maker_model: "Tata Motors - LPT 3118 TC 6x2 Tipper",
      vehicle_category: "COMMERCIAL_HEAVY",
      inspection_date: "2026-11-23 11:30:00",
      client_name: "State Bank of India - SME Commercial Asset Division",
      overall_condition_grade: "B+ (Good Commercial Condition)",
      approved_fair_market_value_inr: 1820000.0,
      approved_distress_value_inr: 1547000.0,
      valuation_type: "Certified Valuation Dossier",
      is_certified: true,
      valuer_override_applied: true,
      override_justification:
        "Strong institutional transport demand and complete powertrain overhaul justify premium above algorithmic benchmark.",
      certified_valuer_name: "Er. Rajeshwar K. Patil",
      certified_valuer_license: "CAT-I/MUM/VAL/2014-9982",
      certified_valuer_remarks: "Chassis alignment checked, engine compression normal, no structural damage detected.",
      inspector_name: "Vikram S. Deshmukh",
      qc_officer_name: "Sunil V. Mahajan",
      is_mock_watermarked: true,
      watermark_text: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
      rendered_at: "2026-11-24 16:50:00",
    },
  });
}
