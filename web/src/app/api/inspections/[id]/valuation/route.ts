import { NextRequest, NextResponse } from "next/server";

let MOCK_VALUATION_STORE: Record<string, any> = {
  "case-001": {
    inspection_case_id: "case-001",
    valuation_type: "Proposed Algorithmic Estimate", // AC-VAL-01
    is_certified: false,
    status: "PENDING_VALUER_APPROVAL",
    valuation_methodology: "DEPRECIATED_MARKET_VALUE_COMMERCIAL",
    ex_showroom_price_paise: 510000000, // ₹51,00,000
    base_depreciated_value_paise: 420000000, // ₹42,00,000
    age_in_months: 36,
    age_depreciation_pct: 30.0,
    odometer_adjustment_paise: 8500000, // ₹85,000
    condition_deduction_paise: 5000000, // ₹50,000
    estimated_repair_refurbishment_paise: 6650000, // ₹66,500 (Tyres + Damage)
    proposed_fair_market_value_paise: 399850000, // ₹39,98,500
    proposed_distress_value_paise: 339872500, // ₹33,98,725
    valuer_override_applied: false,
    override_fair_market_value_paise: null,
    override_distress_value_paise: null,
    override_justification: null,
    valuer_name: "Mahesh Deshmukh (Certified IBBI Valuer)",
    certified_valuer_remarks: "Commercial tipper in operational condition. Regular preventive maintenance observed on engine and chassis.",
    approved_at: null,
    assumptions: {
      standard_depreciation_schedule: "General Insurance Council Commercial Motor Tariff",
      benchmark_annual_km: 60000,
      distress_haircut_percentage: 15,
      scrap_floor_percentage: 15,
    },
    version_history: [],
  },
};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const val = MOCK_VALUATION_STORE[caseId] || MOCK_VALUATION_STORE["case-001"];

  return NextResponse.json({
    status: "success",
    message: "Valuation dossier retrieved",
    data: val,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const body = await req.json();

  const existing = MOCK_VALUATION_STORE[caseId] || MOCK_VALUATION_STORE["case-001"];

  // AC-VAL-02: Mandatory justification of at least 30 characters
  if (body.valuer_override_applied) {
    const just = (body.override_justification || "").trim();
    if (just.length < 30) {
      return NextResponse.json(
        {
          status: "error",
          message: "AC-VAL-02: Override justification is strictly mandatory with a minimum of 30 characters.",
        },
        { status: 422 }
      );
    }
  }

  // Version preservation if already approved
  const history = [...(existing.version_history || [])];
  if (existing.is_certified && existing.approved_at) {
    history.push({
      version: history.length + 1,
      archived_at: new Date().toISOString(),
      fair_market_value_paise: existing.valuer_override_applied ? existing.override_fair_market_value_paise : existing.proposed_fair_market_value_paise,
      override_applied: existing.valuer_override_applied,
      override_justification: existing.override_justification,
    });
  }

  const fmvPaise = body.valuer_override_applied
    ? Number(body.override_fair_market_value_paise)
    : Number(body.proposed_fair_market_value_paise || existing.proposed_fair_market_value_paise);

  const updated = {
    ...existing,
    ...body,
    inspection_case_id: caseId,
    valuation_type: "Certified Valuation Dossier", // AC-VAL-01
    is_certified: true,
    status: "CERTIFIED_APPROVED",
    approved_at: new Date().toISOString(),
    version_history: history,
  };

  MOCK_VALUATION_STORE[caseId] = updated;

  return NextResponse.json({
    status: "success",
    message: "Valuation dossier certified and approved. Version snapshot preserved.",
    data: updated,
  });
}
