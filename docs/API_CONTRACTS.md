# REST API Contracts & Provider Specifications: VahanCheck Enterprise

## 1. API Standards & Conventions

All endpoints adhere to RESTful architecture and OpenAPI 3.1 standards.
- **Base URL**: `https://api.vahancheck.com/api/v1`
- **Content-Type**: `application/json` (Multipart for direct binary uploads where pre-signed S3 is not used).
- **Authentication**: Bearer Token (Laravel Sanctum) via `Authorization: Bearer {token}`.
- **Tenant Context**: Automatically resolved from token; optional `X-Tenant-ID` header allowed for Super-Admins.
- **Error Standard**: RFC 7807 Problem Details specification.
- **Idempotency**: Sensitive state-changing requests (billing, evidence confirmation, sync) support `Idempotency-Key: {uuid-v4}`.

---

## 2. Standard Error Format (RFC 7807)

```json
{
  "type": "https://errors.vahancheck.com/insufficient-credits",
  "title": "Insufficient Credits",
  "status": 402,
  "detail": "Your organization requires at least 15 credits for this operation. Current balance: 4.",
  "instance": "/api/v1/vehicles/lookup",
  "code": "BILLING_INSUFFICIENT_CREDITS",
  "timestamp": "2026-11-24T16:20:00Z",
  "invalid_params": []
}
```

---

## 3. Core Authentication & Identity Endpoints

### 3.1 POST /auth/login
Authenticates user, binds device token (FCM), and returns Sanctum access token.

**Request:**
```json
{
  "email": "inspector.rajesh@speedcheck.in",
  "password": "SecurePassword#2026",
  "device_id": "android_98a76c54b32d",
  "device_name": "Samsung Galaxy Tab Active4 Pro",
  "fcm_token": "fcm_e8F9s0A..."
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "token": "14|vahan_pat_8f97e6d5c4b3a2...",
    "expires_at": "2026-12-01T16:20:00Z",
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "name": "Rajesh Kumar",
      "email": "inspector.rajesh@speedcheck.in",
      "phone": "+919876543210",
      "role": "INSPECTOR",
      "organization": {
        "id": "e4eaaaf2-d142-11e1-b3e4-080027620c41",
        "name": "SpeedCheck Valuers Pvt Ltd",
        "slug": "speedcheck",
        "logo_url": "https://s3.vahancheck.com/logos/speedcheck.png"
      },
      "permissions": [
        "inspections.view_assigned",
        "inspections.update_item",
        "inspections.upload_evidence",
        "inspections.submit"
      ]
    }
  }
}
```

---

## 4. Vehicle Intelligence & APISathi Provider Contracts

### 4.1 Official External Provider Endpoints (APISathi)
1. **Vehicle RC v1**: `POST https://apisathi.in/api/v1/vehicle/rc-v1`
   - Primary Parameters: `reg_no` (e.g. `DL01AB1234`)
   - Official Schema Fields: `rc_number`, `registration_date`, `chassis_number`, `engine_number`, `owner_name`, `maker`, `model`, `vehicle_class`, `fuel_type`, `emission_norms`, `insurance_company`, `insurance_validity`, `fitness_validity`, `pucc_validity`, `financier`.
2. **eChallan API**: `POST https://apisathi.in/api/v1/echallan/rc-challan`
   - Primary Parameters: `reg_no`, `chassis_no_last_5` (optional)
   - Official Schema Fields: `challan_number`, `challan_date`, `offence_name`, `amount`, `status`, `state`, `court_name`.

### 4.2 POST /vehicles/lookup (VahanCheck API)
Performs cached lookup or live provider retrieval with atomic credit deduction and provenance logging.

**Request:**
```json
{
  "registration_number": "MH12AB1234",
  "consent_obtained": true,
  "force_refresh": false
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "registration_number": "MH12AB1234",
    "chassis_number": "MA3EWB12S00123456",
    "engine_number": "K12MN1234567",
    "vehicle_identity": {
      "maker_name": "TATA MOTORS LTD",
      "model_name": "PRIMA 4028.S",
      "variant_name": "CAB CHASSIS",
      "vehicle_class": "Heavy Goods Vehicle (HGV)",
      "body_type": "TRACTOR COMMERCIAL",
      "fuel_type": "DIESEL",
      "color": "ARCTIC WHITE",
      "emission_norms": "BHARAT STAGE VI (BS-VI)",
      "manufacturing_date": "2022-04-01",
      "registration_date": "2022-06-15"
    },
    "registration_details": {
      "rto_code": "MH-12",
      "rto_name": "PUNE RTO",
      "state_code": "MH",
      "rc_status": "ACTIVE",
      "ownership_sequence": 1,
      "owner_name_masked": "M**** L**** LOGISTICS PVT LTD"
    },
    "hypothecation_details": {
      "is_hypothecated": true,
      "financier_name": "HDFC BANK LIMITED",
      "verification_status": "provider_reported"
    },
    "technical_specifications": {
      "unladen_weight_kg": 7250,
      "gross_vehicle_weight_kg": 40000,
      "wheelbase_mm": 3800,
      "number_of_cylinders": 6,
      "cubic_capacity": 6700
    },
    "compliance_validities": {
      "insurance": {
        "company": "ICICI LOMBARD GENERAL INSURANCE CO LTD",
        "policy_number": "3001/29849201/00/000",
        "valid_until": "2026-06-14",
        "is_active": true
      },
      "fitness": {
        "valid_until": "2026-06-14",
        "is_active": true
      },
      "pucc": {
        "valid_until": "2026-12-14",
        "is_active": true
      },
      "national_permit": {
        "permit_number": "NP/MH/2022/19820",
        "valid_until": "2027-06-14",
        "is_active": true
      }
    },
    "blacklist_status": {
      "is_blacklisted": false,
      "reason": null
    },
    "provenance": {
      "provider_source": "apisathi_rc_v1",
      "is_mock_data": false,
      "retrieved_at": "2026-11-24T16:20:00Z",
      "cache_hit": false
    }
  }
}
```

---

## 5. Traffic Challan Endpoints

### 5.1 GET /vehicles/{regNumber}/challans
Returns normalized list of traffic violations, categorizing pending vs disposed fines.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "registration_number": "MH12AB1234",
    "summary": {
      "total_challans_count": 2,
      "pending_challans_count": 1,
      "pending_fines_paise": 200000,
      "pending_fines_formatted_inr": "₹2,000.00",
      "disposed_challans_count": 1,
      "disposed_fines_paise": 100000
    },
    "challans": [
      {
        "id": "11ea4b20-6d42-4b2e-a579-d5e4b11f7e01",
        "challan_number": "MH1209230009182",
        "offence_details": "Driving in violation of mandatory road signs / Speeding (Sec 112/183)",
        "offence_date_time": "2026-09-12T14:32:00Z",
        "fine_amount_paise": 200000,
        "fine_amount_inr": 2000.00,
        "status": "PENDING",
        "state_code": "MH",
        "rto_name": "PUNE HIGHWAY POLICE",
        "court_name": null,
        "parivahan_url": "https://echallan.parivahan.gov.in/"
      },
      {
        "id": "22fa5c31-7e53-5c3f-b680-e6f5c22a8f02",
        "challan_number": "MH1205220001092",
        "offence_details": "Improper Parking creating obstruction (Sec 122/177)",
        "offence_date_time": "2026-05-10T09:15:00Z",
        "fine_amount_paise": 100000,
        "fine_amount_inr": 1000.00,
        "status": "DISPOSED",
        "state_code": "MH",
        "rto_name": "PUNE CITY POLICE",
        "court_name": null,
        "receipt_number": "RC-MH12-984920",
        "payment_date": "2026-05-12T11:00:00Z",
        "parivahan_url": "https://echallan.parivahan.gov.in/"
      }
    ],
    "disclaimer": "Challan data reflects records returned by national/state police portals at query time. For authoritative settlement, visit echallan.parivahan.gov.in."
  }
}
```

---

## 6. Inspection Management Endpoints

### 6.1 POST /inspections (Create Inspection Case)
Creates a new physical inspection case requested by a bank, NBFC, or client.

**Request:**
```json
{
  "client_id": "8a1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d",
  "bank_branch_id": "b1c2d3e4-f5a6-7b8c-9d0e-1f2a3b4c5d6e",
  "loan_reference_number": "HDFC-AUTO-2026-8912",
  "registration_number": "MH12AB1234",
  "vehicle_category": "COMMERCIAL_HEAVY",
  "priority": "HIGH",
  "scheduled_at": "2026-11-26T10:00:00Z",
  "inspection_address": "Near HP Petrol Pump, Chakan Industrial Area Phase 2, Pune, Maharashtra 410501",
  "assigned_inspector_id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

### 6.2 POST /inspections/{id}/evidence/presign
Issues private pre-signed S3 upload URLs with exact metadata restrictions.

**Request:**
```json
{
  "category": "FRONT_45",
  "mime_type": "image/webp",
  "file_size_bytes": 1450280,
  "sha256_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "upload_url": "https://vahan-storage.s3.ap-south-1.amazonaws.com/speedcheck/inspections/case_123/FRONT_45_20261124.webp?AWSAccessKeyId=AKIAIOSFODNN7EXAMPLE&Signature=vjbyPxybdSpVKzkdwfb...&Expires=1700843400",
    "s3_key": "speedcheck/inspections/case_123/FRONT_45_20261124.webp",
    "expires_in_seconds": 900
  }
}
```

### 6.3 POST /inspections/{id}/items (Batch Checkpoint Responses)
Submits checkpoint evaluations (ratings, remarks, physical verification).

**Request:**
```json
{
  "items": [
    {
      "section_key": "chassis_frame",
      "item_key": "longitudinal_cross_members",
      "item_label": "Longitudinal Members & Cross Bracing",
      "rating": "PASS",
      "remarks": "Chassis member straight without weld repair or cracks."
    },
    {
      "section_key": "engine_compartment",
      "item_key": "engine_oil_leakage",
      "item_label": "Engine Head & Sump Oil Leakage",
      "rating": "ATTENTION_REQUIRED",
      "remarks": "Minor oil weeping observed around tappet cover gasket."
    }
  ]
}
```

### 6.4 POST /inspections/{id}/tyres (Log Axle & Tyre Condition)
Logs individual wheel specifications across multi-axle configurations.

**Request:**
```json
{
  "tyres": [
    {
      "axle_number": 1,
      "position": "FRONT_LEFT",
      "brand": "MRF STEEL MUSCLE",
      "size_spec": "295/90 R20",
      "tread_depth_mm": 11.5,
      "remaining_life_pct": 80,
      "condition": "GOOD",
      "remarks": "Normal wear, no sidewall cuts."
    },
    {
      "axle_number": 2,
      "position": "REAR_LEFT_OUTER",
      "brand": "APOLLO ENDURACE",
      "size_spec": "295/90 R20",
      "tread_depth_mm": 5.2,
      "remaining_life_pct": 35,
      "condition": "WORN_OUT",
      "remarks": "Approaching legal tread wear indicators."
    }
  ]
}
```

---

## 7. Valuation & Report Generation Endpoints

### 7.1 POST /inspections/{id}/valuation/calculate
Executes automated depreciation and market reference algorithms.

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "ex_showroom_price_inr": 3850000,
    "age_in_months": 53,
    "depreciation_percentage": 48.5,
    "base_depreciated_value_inr": 1982750,
    "deductions": {
      "odometer_penalty_inr": 85000,
      "body_condition_penalty_inr": 50000,
      "tyre_refurbishment_cost_inr": 65000,
      "mechanical_repair_cost_inr": 40000
    },
    "proposed_fair_market_value_inr": 1742750,
    "proposed_distress_value_inr": 1481337,
    "methodology": "DEPRECIATED_MARKET_VALUE_COMMERCIAL"
  }
}
```

### 7.2 POST /inspections/{id}/valuation/override
Allows a certified valuer to review, adjust, and approve the valuation with mandatory reasons.

**Request:**
```json
{
  "override_fair_market_value_inr": 1700000,
  "override_distress_value_inr": 1450000,
  "override_justification": "Adjusted downwards by ₹42,750 based on local Pune commercial transport market demand softening and upcoming fitness renewal cost.",
  "certified_valuer_remarks": "Vehicle is roadworthy and structurally sound. Suitable for hypothecation up to 75% of fair market value."
}
```

### 7.3 POST /inspections/{id}/reports/generate
Freezes snapshot and queues asynchronous Headless Chromium A4 PDF rendering.

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "data": {
    "report_version": "1.0",
    "verification_token": "rpt_98a76f54c3b2e1d09876543210abcdef",
    "verification_url": "https://app.vahancheck.com/verify-report/rpt_98a76f54c3b2e1d09876543210abcdef",
    "status": "QUEUED_FOR_RENDERING",
    "estimated_seconds": 3
  }
}
```

---

## 8. Mobile Synchronization Endpoints

### 8.1 POST /sync/batch
Transactional offline batch synchronizer supporting resilient retries.

**Request:**
```json
{
  "idempotency_key": "9f7a8b6c-5d4e-3f2a-1b0c-9d8e7f6a5b4c",
  "timestamp": "2026-11-24T16:21:00Z",
  "case_updates": [
    {
      "case_id": "c1a2b3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "status": "SUBMITTED",
      "odometer_reading_km": 142580,
      "inspection_lat": 18.752310,
      "inspection_lng": 73.856920,
      "submitted_at": "2026-11-24T16:15:00Z"
    }
  ],
  "item_results": [...],
  "tyre_results": [...],
  "evidence_confirmations": [
    {
      "case_id": "c1a2b3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "category": "ODOMETER",
      "s3_key": "speedcheck/inspections/c1a2b3d4/ODOMETER_20261124.webp",
      "sha256_hash": "a4b5c6...",
      "captured_at": "2026-11-24T16:10:00Z"
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "data": {
    "synced_cases_count": 1,
    "synced_items_count": 84,
    "synced_tyres_count": 10,
    "synced_evidences_count": 14,
    "server_timestamp": "2026-11-24T16:21:05Z"
  }
}
```
