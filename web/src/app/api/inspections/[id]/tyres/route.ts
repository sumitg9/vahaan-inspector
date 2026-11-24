import { NextRequest, NextResponse } from "next/server";

const DEFAULT_10_TYRES = [
  // Axle 1: Steer
  { axle_number: 1, position: "FRONT_LEFT", brand: "MRF STEEL MUSCLE", size_spec: "295/90 R20", tread_depth_mm: 12.0, remaining_life_pct: 85, condition: "GOOD", remarks: "Even tread wear" },
  { axle_number: 1, position: "FRONT_RIGHT", brand: "MRF STEEL MUSCLE", size_spec: "295/90 R20", tread_depth_mm: 11.5, remaining_life_pct: 80, condition: "GOOD", remarks: "Even tread wear" },
  // Axle 2: Drive Dual
  { axle_number: 2, position: "AXLE2_LEFT_OUTER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 9.0, remaining_life_pct: 65, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_LEFT_INNER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 8.5, remaining_life_pct: 60, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_RIGHT_INNER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 9.2, remaining_life_pct: 65, condition: "GOOD", remarks: "Normal wear" },
  { axle_number: 2, position: "AXLE2_RIGHT_OUTER", brand: "APOLLO ENDURACE", size_spec: "295/90 R20", tread_depth_mm: 8.8, remaining_life_pct: 60, condition: "GOOD", remarks: "Normal wear" },
  // Axle 3: Tag / Dummy Dual
  { axle_number: 3, position: "AXLE3_LEFT_OUTER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 5.0, remaining_life_pct: 35, condition: "AVERAGE", remarks: "Approaching wear indicator" },
  { axle_number: 3, position: "AXLE3_LEFT_INNER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 4.8, remaining_life_pct: 35, condition: "AVERAGE", remarks: "Approaching wear indicator" },
  { axle_number: 3, position: "AXLE3_RIGHT_INNER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 1.2, remaining_life_pct: 10, condition: "WORN_OUT", remarks: "Breaches legal safety minimum (1.6mm)" }, // AC-TYRE-02
  { axle_number: 3, position: "AXLE3_RIGHT_OUTER", brand: "JK TYRE TYREMATE", size_spec: "295/90 R20", tread_depth_mm: 4.5, remaining_life_pct: 30, condition: "AVERAGE", remarks: "Moderate wear" },
  // Spare
  { axle_number: 0, position: "SPARE", brand: "MRF SUPER LUG", size_spec: "295/90 R20", tread_depth_mm: 14.0, remaining_life_pct: 95, condition: "EXCELLENT", remarks: "Unused spare wheel" },
];

function calculateMetrics(tyres: any[]) {
  const count = tyres.length;
  if (!count) return { total_wheels: 0, average_tread_depth_mm: 0, worn_out_count: 0, critical_safety_alert: false, estimated_refurbishment_cost_inr: 0 };

  let totalDepth = 0;
  let totalLife = 0;
  let wornOutCount = 0;
  let criticalCount = 0;

  for (const t of tyres) {
    const depth = Number(t.tread_depth_mm) || 0;
    totalDepth += depth;
    totalLife += Number(t.remaining_life_pct) || 0;
    if (depth < 1.6 || t.condition === "WORN_OUT" || t.condition === "DAMAGED_CUT") {
      wornOutCount++;
    }
    if (depth < 1.6) {
      criticalCount++;
    }
  }

  return {
    total_wheels: count,
    average_tread_depth_mm: Number((totalDepth / count).toFixed(2)),
    average_life_percentage: Math.round(totalLife / count),
    worn_out_count: wornOutCount,
    critical_safety_alert: criticalCount > 0,
    critical_breached_count: criticalCount,
    estimated_refurbishment_cost_inr: wornOutCount * 26500,
  };
}

let CASE_TYRES_STORE: Record<string, any[]> = {};

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const tyres = CASE_TYRES_STORE[caseId] || DEFAULT_10_TYRES;
  const metrics = calculateMetrics(tyres);

  return NextResponse.json({
    status: "success",
    message: "Tyre assessment records retrieved",
    data: {
      case_id: caseId,
      tyres,
      metrics,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;
  const body = await req.json();
  const rawTyres = body.tyres || [];

  // Enforce AC-TYRE-02: tread depth < 1.6mm forced to WORN_OUT
  const processed = rawTyres.map((t: any) => {
    const depth = Number(t.tread_depth_mm) || 0;
    let cond = (t.condition || "GOOD").toUpperCase();
    let life = Number(t.remaining_life_pct) || Math.min(100, Math.round((depth / 14) * 100));

    if (depth < 1.6) {
      cond = "WORN_OUT";
      life = Math.min(life, 15);
    }

    return {
      ...t,
      tread_depth_mm: depth,
      condition: cond,
      remaining_life_pct: life,
      remarks: depth < 1.6 ? "Breaches legal safety minimum (1.6mm)" : t.remarks || "",
    };
  });

  CASE_TYRES_STORE[caseId] = processed;
  const metrics = calculateMetrics(processed);

  return NextResponse.json(
    {
      status: "success",
      message: "Tyre assessments recorded successfully",
      data: {
        case_id: caseId,
        recorded_count: processed.length,
        tyres: processed,
        metrics,
      },
    },
    { status: 201 }
  );
}
