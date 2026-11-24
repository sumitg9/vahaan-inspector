import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch(`${backendUrl}/dashboard/metrics`, {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Graceful fallback to deterministic mock contract when backend server is offline
  }

  // Fallback response matching Laravel DashboardController contract
  return NextResponse.json({
    status: "success",
    data: {
      metrics: {
        active_inspections: 28,
        pending_valuation_approvals: 11,
        pending_challans_count: 3,
        total_pending_fines_paise: 2700000,
        total_pending_fines_formatted_inr: "₹27,000.00",
        available_credits: 950,
        available_credits_inr: "₹14,250.00",
      },
      recent_dossiers: [
        {
          id: "case-001",
          loan_reference_number: "HDFC-AUTO-2026-8912",
          registration_number: "MH12AB1234",
          vehicle_desc: "TATA MOTORS PRIMA 2830.K (HCV)",
          client_name: "Tata Capital Commercial",
          inspector_name: "Suresh Patil",
          status: "QC_REVIEW",
          priority: "URGENT",
          scheduled_at: "24 Nov 2026, 10:00 AM",
          condition_rating: "GOOD",
        },
        {
          id: "case-002",
          loan_reference_number: "TATA-FIN-2026-1049",
          registration_number: "DL01XY9999",
          vehicle_desc: "MARUTI SUZUKI SWIFT ZXI (LMV)",
          client_name: "HDFC Bank Auto Loans",
          inspector_name: "Amit Shinde",
          status: "IN_PROGRESS",
          priority: "HIGH",
          scheduled_at: "24 Nov 2026, 02:30 PM",
          condition_rating: "AVERAGE",
        },
        {
          id: "case-003",
          loan_reference_number: "ICICI-USED-2026-9021",
          registration_number: "KA01MJ0001",
          vehicle_desc: "BMW 330LI GRAN LIMOUSINE (SEDAN)",
          client_name: "ICICI Bank Used Cars",
          inspector_name: "Mahesh Deshmukh",
          status: "APPROVED",
          priority: "NORMAL",
          scheduled_at: "23 Nov 2026, 11:15 AM",
          condition_rating: "EXCELLENT",
        },
      ],
      system_status: {
        provider_mode: "mock",
        watermark_active: true,
        redis_queue: "operational",
        database: "connected",
      },
    },
  });
}
