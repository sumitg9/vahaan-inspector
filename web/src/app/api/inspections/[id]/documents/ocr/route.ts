import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const docType = (body.document_type || "RC_SMART_CARD").toUpperCase();
  const scenario = body.scenario || "standard";

  let extractedFields: Record<string, any> = {};
  let rawText = "";

  if (docType === "RC_SMART_CARD" || docType === "RC") {
    if (scenario === "discrepancy") {
      extractedFields = {
        registration_number: "MH12AB1234",
        chassis_number: "MAT621045K8Z99999", // Suffix 99999 mismatch with 12345
        engine_number: "497TC92XYZ11111",
        registered_owner: "KUMAR TRANSPORTS PVT LTD",
        maker_model: "TATA PRIMA 2830.K",
        vehicle_class: "HGV",
        fuel_type: "DIESEL",
        registration_date: "2021-06-15",
        fitness_upto: "2025-06-14",
      };
      rawText = "TRANSPORT DEPARTMENT MAHARASHTRA\nRC NO: MH12AB1234\nCHASSIS: MAT621045K8Z99999\nENGINE: 497TC92XYZ11111\nOWNER: KUMAR TRANSPORTS PVT LTD";
    } else {
      extractedFields = {
        registration_number: "MH12AB1234",
        chassis_number: "MAT621045K8Z12345",
        engine_number: "497TC92XYZ56789",
        registered_owner: "M/S LOGISTICS INDIA PRIVATE LIMITED",
        maker_model: "TATA PRIMA 2830.K",
        vehicle_class: "HGV",
        fuel_type: "DIESEL",
        registration_date: "2021-06-15",
        fitness_upto: "2026-06-14",
      };
      rawText = "TRANSPORT DEPARTMENT MAHARASHTRA\nRC NO: MH12AB1234\nCHASSIS: MAT621045K8Z12345\nENGINE: 497TC92XYZ56789\nOWNER: M/S LOGISTICS INDIA PRIVATE LIMITED";
    }
  } else if (docType === "INSURANCE_POLICY") {
    const isExpired = scenario === "expired";
    extractedFields = {
      policy_number: "OG-26-1102-1801-00045678",
      insurance_company: "ICICI LOMBARD GENERAL INSURANCE",
      registration_number: "MH12AB1234",
      policy_type: "COMPREHENSIVE_COMMERCIAL",
      idv_inr: 2450000,
      valid_from: isExpired ? "2024-03-01" : "2026-03-01",
      valid_upto: isExpired ? "2025-02-28" : "2027-02-28",
      insured_name: "M/S LOGISTICS INDIA PRIVATE LIMITED",
    };
    rawText = `CERTIFICATE OF INSURANCE\nPOLICY: OG-26-1102-1801-00045678\nINSURED: M/S LOGISTICS INDIA PVT LTD\nVALID UPTO: ${extractedFields.valid_upto}`;
  } else {
    extractedFields = {
      certificate_number: "MH01200340008912",
      registration_number: "MH12AB1234",
      valid_upto: "2026-12-31",
      emission_standard: "BS VI",
    };
    rawText = "POLLUTION UNDER CONTROL CERTIFICATE\nMH12AB1234\nVALID UPTO: 31/12/2026";
  }

  // Canonical VAHAN Profile comparison
  const canonical = {
    registration_number: "MH12AB1234",
    chassis_number: "MAT621045K8Z12345",
    engine_number: "497TC92XYZ56789",
    owner_name: "M/S LOGISTICS INDIA PRIVATE LIMITED",
    status: "ACTIVE",
  };

  const discrepancies: string[] = [];
  const fieldComparisons: Record<string, any> = {};
  let matchedScore = 0;
  let totalScore = 0;

  // Compare Registration
  totalScore += 30;
  if (extractedFields.registration_number === canonical.registration_number) {
    matchedScore += 30;
    fieldComparisons.registration_number = {
      document: extractedFields.registration_number,
      registry: canonical.registration_number,
      status: "EXACT_MATCH",
    };
  } else {
    fieldComparisons.registration_number = {
      document: extractedFields.registration_number,
      registry: canonical.registration_number,
      status: "MISMATCH",
    };
    discrepancies.push("Registration number mismatch between document and registry.");
  }

  // Compare Chassis VIN
  if (extractedFields.chassis_number) {
    totalScore += 25;
    const docSuffix = extractedFields.chassis_number.slice(-5);
    const regSuffix = canonical.chassis_number.slice(-5);
    if (docSuffix === regSuffix) {
      matchedScore += 25;
      fieldComparisons.chassis_number = {
        document: extractedFields.chassis_number,
        registry: canonical.chassis_number,
        status: "EXACT_MATCH",
      };
    } else {
      fieldComparisons.chassis_number = {
        document: extractedFields.chassis_number,
        registry: canonical.chassis_number,
        status: "MISMATCH",
      };
      discrepancies.push(`Chassis VIN suffix '${docSuffix}' does not match registry '${regSuffix}'.`);
    }
  }

  // Compare Engine
  if (extractedFields.engine_number) {
    totalScore += 20;
    const docSuffix = extractedFields.engine_number.slice(-5);
    const regSuffix = canonical.engine_number.slice(-5);
    if (docSuffix === regSuffix) {
      matchedScore += 20;
      fieldComparisons.engine_number = {
        document: extractedFields.engine_number,
        registry: canonical.engine_number,
        status: "EXACT_MATCH",
      };
    } else {
      fieldComparisons.engine_number = {
        document: extractedFields.engine_number,
        registry: canonical.engine_number,
        status: "MISMATCH",
      };
      discrepancies.push(`Engine suffix '${docSuffix}' does not match registry '${regSuffix}'.`);
    }
  }

  // Compare Owner
  if (extractedFields.registered_owner || extractedFields.insured_name) {
    totalScore += 15;
    const docOwner = extractedFields.registered_owner || extractedFields.insured_name;
    if (docOwner.includes("LOGISTICS INDIA")) {
      matchedScore += 15;
      fieldComparisons.owner_name = {
        document: docOwner,
        registry: canonical.owner_name,
        status: "EXACT_MATCH",
      };
    } else {
      fieldComparisons.owner_name = {
        document: docOwner,
        registry: canonical.owner_name,
        status: "MISMATCH",
      };
      discrepancies.push(`Owner name divergence: Document shows '${docOwner}' while Registry records '${canonical.owner_name}'.`);
    }
  }

  // Compare Expiry
  if (extractedFields.valid_upto) {
    totalScore += 10;
    const isExpired = new Date(extractedFields.valid_upto) < new Date();
    if (!isExpired) {
      matchedScore += 10;
      fieldComparisons.validity = {
        document_expiry: extractedFields.valid_upto,
        status: "VALID",
      };
    } else {
      fieldComparisons.validity = {
        document_expiry: extractedFields.valid_upto,
        status: "EXPIRED",
      };
      discrepancies.push(`Document expired on ${extractedFields.valid_upto}.`);
    }
  }

  const matchPercentage = totalScore > 0 ? Math.round((matchedScore / totalScore) * 100) : 100;
  const overallStatus =
    matchPercentage >= 90 && discrepancies.length === 0
      ? "MATCH"
      : matchPercentage >= 70
      ? "PARTIAL_MATCH"
      : "DISCREPANCY_DETECTED";

  return NextResponse.json({
    status: "success",
    message: "Document OCR extracted and compared with VAHAN registry",
    data: {
      document_type: docType,
      confidence_score: 0.96,
      extracted_fields: extractedFields,
      raw_text: rawText,
      comparison: {
        match_percentage: matchPercentage,
        status: overallStatus,
        field_comparisons: fieldComparisons,
        discrepancies: discrepancies,
        verified_at: new Date().toISOString(),
      },
    },
  });
}
