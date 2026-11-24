import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reg = (searchParams.get("reg") || "MH12AB1234").trim().toUpperCase();
  const mode = searchParams.get("mode") || "combined"; // combined, rc_only, challan_only
  const forceFresh = searchParams.get("force_fresh") === "true";
  const simulateError = searchParams.get("simulate_error"); // timeout, ratelimit, unavailable, notfound

  // 1. Error simulation handlers for testing provider failure modes
  if (reg === "UP16AB0000" || simulateError === "timeout") {
    return NextResponse.json(
      {
        status: "error",
        error_code: "GATEWAY_TIMEOUT",
        message: "Gateway timeout communicating with Parivahan National Register (HTTP 504). Please retry.",
        provider: "apisathi_mock",
        registration_number: reg,
      },
      { status: 504 }
    );
  }

  if (reg === "RJ14XY0000" || simulateError === "ratelimit") {
    return NextResponse.json(
      {
        status: "error",
        error_code: "RATE_LIMIT_EXCEEDED",
        message: "Upstream rate limit exceeded for provider APISathi (HTTP 429). Retry after 60 seconds.",
        provider: "apisathi_mock",
        registration_number: reg,
      },
      { status: 429 }
    );
  }

  if (reg === "GJ01AB0000" || simulateError === "unavailable") {
    return NextResponse.json(
      {
        status: "error",
        error_code: "PROVIDER_UNAVAILABLE",
        message: "Provider balance exhausted or upstream maintenance (HTTP 503). Service temporarily suspended.",
        provider: "apisathi_mock",
        registration_number: reg,
      },
      { status: 503 }
    );
  }

  if (reg === "WB02AB0000" || simulateError === "notfound") {
    return NextResponse.json(
      {
        status: "error",
        error_code: "VEHICLE_NOT_FOUND",
        message: `Vehicle registration ${reg} was not found in Central Transport Register (HTTP 404).`,
        provider: "apisathi_mock",
        registration_number: reg,
      },
      { status: 404 }
    );
  }

  // 2. Try forward to Laravel central backend if reachable
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const backendEndpoint =
      mode === "challan_only"
        ? `${backendUrl}/challans/lookup?registration_number=${reg}&force_fresh=${forceFresh}`
        : mode === "rc_only"
        ? `${backendUrl}/vehicles/lookup?registration_number=${reg}&consent=1&force_fresh=${forceFresh}`
        : `${backendUrl}/vehicles/verify-combined`;

    const res = await fetch(backendEndpoint, {
      method: mode === "combined" ? "POST" : "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: mode === "combined" ? JSON.stringify({ registration_number: reg, consent: true, force_fresh: forceFresh }) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
  } catch (err) {
    // Graceful fallback to deterministic mock contract when backend is offline
  }

  // 3. Deterministic Scenarios
  // Scenario A: DL01XY9999 (Partial & Restricted Fields)
  if (reg === "DL01XY9999") {
    return NextResponse.json({
      status: "success",
      data: {
        registration_number: "DL01XY9999",
        cached: { vehicle: !forceFresh, challans: !forceFresh },
        total_credits_deducted: forceFresh ? 25 : 0,
        vehicle: {
          registration_number: "DL01XY9999",
          chassis_number: "MALBB51BLHM98****",
          engine_number: "G4LCHM76****",
          owner_name_masked: "V**** A****",
          ownership_sequence: 2,
          maker_model: "HYUNDAI MOTOR INDIA LTD CRETA",
          maker_name: "HYUNDAI",
          model_name: "CRETA",
          variant_name: "1.5 SX",
          vehicle_class: "Motor Car (LMV)",
          body_type: "SUV",
          fuel_type: "PETROL",
          color: "Polar White",
          emission_norms: "BS-VI",
          seating_capacity: 5,
          gross_vehicle_weight_kg: 1690,
          registration_date: "2020-01-10",
          manufacturing_date: "2019-11-20",
          rto_code: "DL-01",
          rto_name: "MALL ROAD RTO",
          state_code: "DL",
          rc_status: "ACTIVE",
          hypothecated: false,
          financier_name: null, // Restricted
          insurance_company: "Bajaj Allianz General Insurance",
          insurance_policy_number: "BAGIC/PVT/2020/12984",
          insurance_valid_until: "2025-01-09",
          fitness_valid_until: null, // Restricted by State RTO
          tax_valid_until: "LTT (One-Time)",
          pucc_valid_until: "2025-01-09",
          national_permit_number: null,
          blacklist_status: "CLEAN",
          is_mock_data: true,
          watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
          field_provenance: {
            registration_number: "rto_registry",
            chassis_number: "dpdp_masked",
            engine_number: "dpdp_masked",
            owner_name: "dpdp_masked",
            maker_model: "rto_registry",
            fuel_type: "rto_registry",
            fitness_valid_until: "restricted",
            financier_name: "restricted",
            insurance_company: "provider_reported",
            national_permit_number: "not_applicable",
            blacklist_status: "rto_enforcement",
          },
        },
        challans: {
          total_challans: 1,
          pending_challans_count: 1,
          total_pending_paise: 200000,
          total_pending_inr: 2000,
          total_pending_formatted: "₹2,000.00",
          total_disposed_paise: 0,
          total_disposed_inr: 0,
          challans: [
            {
              challan_number: "DL019827361541",
              offence_details: "Exceeding prescribed speed limits (Automated Speed Camera Sec 112/183)",
              offence_date_time: "2024-02-18 09:30:12",
              fine_amount_paise: 200000,
              fine_amount_inr: 2000,
              fine_amount_formatted: "₹2,000.00",
              state_code: "DL",
              rto_name: "DELHI TRAFFIC POLICE",
              challan_status: "PENDING",
              parivahan_url: "https://echallan.parivahan.gov.in/",
            },
          ],
        },
        watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
      },
    });
  }

  // Scenario B: KA01MJ0001 (Clean Record - 0 Challans)
  if (reg === "KA01MJ0001") {
    return NextResponse.json({
      status: "success",
      data: {
        registration_number: "KA01MJ0001",
        cached: { vehicle: !forceFresh, challans: !forceFresh },
        total_credits_deducted: forceFresh ? 25 : 0,
        vehicle: {
          registration_number: "KA01MJ0001",
          chassis_number: "WBA43AZ00P1234***",
          engine_number: "B48B2012****",
          owner_name_masked: "S**** N****",
          ownership_sequence: 1,
          maker_model: "BMW INDIA PVT LTD 330LI",
          maker_name: "BMW",
          model_name: "330Li",
          variant_name: "Gran Limousine M Sport",
          vehicle_class: "Luxury Sedan (LMV)",
          body_type: "Sedan",
          fuel_type: "PETROL",
          color: "Mineral White Metallic",
          emission_norms: "BS-VI",
          seating_capacity: 5,
          gross_vehicle_weight_kg: 2050,
          registration_date: "2023-09-01",
          manufacturing_date: "2023-08-01",
          rto_code: "KA-01",
          rto_name: "KORAMANGALA RTO",
          state_code: "KA",
          rc_status: "ACTIVE",
          hypothecated: false,
          financier_name: null,
          insurance_company: "HDFC ERGO General Insurance",
          insurance_policy_number: "2311/98201/00/000",
          insurance_valid_until: "2026-08-31",
          fitness_valid_until: "2038-08-31",
          tax_valid_until: "LTT",
          pucc_valid_until: "2025-08-31",
          national_permit_number: null,
          blacklist_status: "CLEAN",
          is_mock_data: true,
          watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
          field_provenance: {
            registration_number: "rto_registry",
            chassis_number: "dpdp_masked",
            engine_number: "dpdp_masked",
            owner_name: "dpdp_masked",
            maker_model: "rto_registry",
            fuel_type: "rto_registry",
            fitness_valid_until: "rto_registry",
            financier_name: "not_applicable",
            insurance_company: "provider_reported",
            national_permit_number: "not_applicable",
            blacklist_status: "rto_enforcement",
          },
        },
        challans: {
          total_challans: 0,
          pending_challans_count: 0,
          total_pending_paise: 0,
          total_pending_inr: 0,
          total_pending_formatted: "₹0.00",
          total_disposed_paise: 0,
          total_disposed_inr: 0,
          challans: [],
        },
        watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
      },
    });
  }

  // Scenario C: MH12AB1234 (Standard HCV Commercial Tipper with 2 Challans)
  return NextResponse.json({
    status: "success",
    data: {
      registration_number: "MH12AB1234",
      cached: { vehicle: !forceFresh, challans: !forceFresh },
      total_credits_deducted: forceFresh ? 25 : 0,
      vehicle: {
        registration_number: "MH12AB1234",
        chassis_number: "MAT624001P2******",
        engine_number: "ISBE59******",
        owner_name_masked: "M**** L**** LOGISTICS PVT LTD",
        ownership_sequence: 1,
        maker_model: "TATA MOTORS LTD PRIMA 2830.K",
        maker_name: "TATA MOTORS",
        model_name: "Prima 2830.K",
        variant_name: "Cab Chassis Tipper",
        vehicle_class: "Heavy Goods Vehicle (HGV)",
        body_type: "Tipper (Dump Truck)",
        fuel_type: "DIESEL",
        color: "Arctic White / Deep Amber",
        emission_norms: "BHARAT STAGE VI (BS-VI)",
        seating_capacity: 3,
        gross_vehicle_weight_kg: 28000,
        registration_date: "2022-06-15",
        manufacturing_date: "2022-04-01",
        rto_code: "MH-12",
        rto_name: "PUNE RTO",
        state_code: "MH",
        rc_status: "ACTIVE",
        hypothecated: true,
        financier_name: "TATA MOTORS FINANCE LIMITED",
        insurance_company: "Bajaj Allianz General Insurance Co.",
        insurance_policy_number: "BAGIC/COMM/2023/981245",
        insurance_valid_until: "2026-06-14",
        fitness_valid_until: "2026-06-14",
        tax_valid_until: "2026-06-14 (Annual)",
        pucc_valid_until: "2025-12-14",
        national_permit_number: "NP/MH/2022/19820",
        national_permit_valid_until: "2027-06-14",
        blacklist_status: "CLEAN",
        is_mock_data: true,
        watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
        field_provenance: {
          registration_number: "rto_registry",
          chassis_number: "dpdp_masked",
          engine_number: "dpdp_masked",
          owner_name: "dpdp_masked",
          maker_model: "rto_registry",
          fuel_type: "rto_registry",
          fitness_valid_until: "rto_registry",
          financier_name: "rto_registry",
          insurance_company: "provider_reported",
          national_permit_number: "rto_registry",
          blacklist_status: "rto_enforcement",
        },
      },
      challans: {
        total_challans: 2,
        pending_challans_count: 1,
        total_pending_paise: 2000000,
        total_pending_inr: 20000,
        total_pending_formatted: "₹20,000.00",
        total_disposed_paise: 1000000,
        total_disposed_inr: 10000,
        challans: [
          {
            challan_number: "MH128391024921",
            offence_details: "Overloading of Goods Vehicle exceeding GVW limit (Sec 194(1) MV Act)",
            offence_date_time: "2024-03-12 14:22:10",
            fine_amount_paise: 2000000,
            fine_amount_inr: 20000,
            fine_amount_formatted: "₹20,000.00",
            state_code: "MH",
            rto_name: "PUNE HIGHWAY POLICE",
            challan_status: "PENDING",
            parivahan_url: "https://echallan.parivahan.gov.in/",
          },
          {
            challan_number: "MH128390887123",
            offence_details: "Failure to produce valid PUC Certificate (Sec 190(2) MV Act)",
            offence_date_time: "2023-11-05 18:45:00",
            fine_amount_paise: 1000000,
            fine_amount_inr: 10000,
            fine_amount_formatted: "₹10,000.00",
            state_code: "MH",
            rto_name: "WAKAD TRAFFIC CHOWK",
            challan_status: "DISPOSED",
            payment_date: "2023-11-10",
            parivahan_url: "https://echallan.parivahan.gov.in/",
          },
        ],
      },
      watermark: "DEMONSTRATION DATA — NOT FOR OFFICIAL USE",
    },
  });
}
