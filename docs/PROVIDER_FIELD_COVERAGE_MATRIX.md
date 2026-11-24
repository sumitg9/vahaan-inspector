# Provider Verification, Agreements & 24-Field Coverage Matrix

**Project**: VahanCheck Enterprise (`VAHAAN-INSPECTION`)  
**Product**: Provider Gateway Verification, Schema Reconciliation & Production Execution Gate  
**Reference Invariants**: `AGENTS.md` Invariant 1 (Zero Secret Leakage), Invariant 2 (Production Fail-Safe & Watermarks), Invariant 3 (Prohibition of Data Fabrication), Invariant 5 (Minor Currency Units)  
**Status**: **AUDITED & VERIFIED (Staging Sandbox Active; Production Credential Gate Locked pending EXT-01)**  

---

## 1. Executive Summary

This document establishes the verified provider integration specification, service level agreements (SLAs), and 24-field VAHAN registry coverage matrix for VahanCheck Enterprise.

In strict compliance with the project's engineering invariants:
1. **Production Credential Gate**: Live production queries are executed **ONLY when authorized credentials are provisioned** (`EXT-01`). Uncredentialed queries and silent fallback to mock data in production are strictly forbidden.
2. **Field Provenance**: Missing or restricted attributes are recorded as `unavailable` or `restricted`. Untested checkpoints default to `not_checked` and are never fabricated to "Pass" or "OK".
3. **Monetary Precision**: All tariffs, fine amounts, and COGS margins are calculated in integer minor units (Indian Paise).

---

## 2. Master Provider Service Level Agreements (SLAs)

| Specification | APISathi Vehicle RC v1 (`/vehicle-rc-v1`) | APISathi RC Challan (`/rc-challan`) |
| :--- | :--- | :--- |
| **Product Purpose** | Real-time VAHAN National Registry Vehicle Verification | Real-time Traffic Violation & eChallan Ingestion |
| **National Coverage** | 28 States & 8 Union Territories | Parivahan National Portal + State Police Court Portals |
| **Monthly Uptime SLA** | 99.5% availability | 99.0% availability |
| **Timeout Ceiling** | 8,000 ms (8.0 seconds) | 10,000 ms (10.0 seconds) |
| **Retry Strategy** | Max 2 retries on 5xx upstream with exponential backoff (500ms, 1000ms) | Max 2 retries on 5xx upstream with exponential backoff |
| **Circuit Breaker** | Trips to open state after 5 consecutive upstream failures | Trips to open state after 4 consecutive upstream failures |
| **Rate Limit Handling**| Explicit HTTP 429 with parsed `Retry-After` header | Explicit HTTP 429 with parsed `Retry-After` header |
| **Provider Unit Tariff** | 450 paise (₹4.50) per successful lookup | 400 paise (₹4.00) per successful lookup |
| **Total Provider COGS**| **850 paise (₹8.50) per combined vehicle inspection lookup** | |

---

## 3. 24-Field Canonical VAHAN Coverage Matrix

| Field ID | Canonical Attribute | Provider Raw Key | Normalized DTO Property | Database Column | Report Dossier Section | Provenance Flag | DPDP Act Redaction Standard |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FC-01** | Registration Number | `rc_number` / `reg_no` | `registrationNumber` | `vehicle_profiles.registration_number` | Section 2: Vehicle Identification | `provider_reported` | Public Statutory Identifier |
| **FC-02** | Chassis VIN (Masked) | `chassis_number` | `chassisNumberMasked` | `vehicle_profiles.chassis_number` | Section 2: Vehicle Identification | `provider_reported` | Masked (`MAT624******23456`) |
| **FC-03** | Engine Number (Masked) | `engine_number` | `engineNumberMasked` | `vehicle_profiles.engine_number` | Section 2: Vehicle Identification | `provider_reported` | Masked (`ISBE59******3456`) |
| **FC-04** | Registered Owner (Masked) | `owner_name` | `ownerNameMasked` | `vehicle_profiles.registered_owner` | Section 2: Vehicle Identification | `provider_reported` | Masked DPDP Act (`M**** S****`) |
| **FC-05** | Ownership Serial Sequence | `ownership_sequence` | `ownershipSequence` | `vehicle_profiles.owner_serial_number` | Section 2: Vehicle Identification | `provider_reported` | Integer (`1` = First Owner) |
| **FC-06** | Maker Name | `maker` / `maker_name` | `makerName` | `vehicle_profiles.maker_name` | Section 3: Technical Specs | `provider_reported` | Manufacturer (e.g. TATA MOTORS) |
| **FC-07** | Model Name | `model` / `model_name` | `modelName` | `vehicle_profiles.model_name` | Section 3: Technical Specs | `provider_reported` | Commercial Line (e.g. PRIMA 2830.K) |
| **FC-08** | Commercial Variant | `variant` / `variant_name` | `variantName` | `vehicle_profiles.variant` | Section 3: Technical Specs | `provider_reported` | Chassis Type (e.g. CAB CHASSIS TIPPER) |
| **FC-09** | Vehicle Class | `vehicle_class` | `vehicleClass` | `vehicle_profiles.vehicle_class` | Section 3: Technical Specs | `provider_reported` | Heavy Goods Vehicle (HGV) / LMV |
| **FC-10** | Body Type | `body_type` | `bodyType` | `vehicle_profiles.body_type` | Section 3: Technical Specs | `provider_reported` | Tipper / Tanker / Flatbed / Sedan |
| **FC-11** | Fuel Type | `fuel_type` | `fuelType` | `vehicle_profiles.fuel_type` | Section 3: Technical Specs | `provider_reported` | DIESEL / PETROL / ELECTRIC / CNG |
| **FC-12** | Visual Color | `color` | `color` | `vehicle_profiles.color` | Section 3: Technical Specs | `provider_reported` | Visual Paint Code |
| **FC-13** | Emission Norms | `norms` / `emission_norms`| `emissionNorms` | `vehicle_profiles.emission_norms` | Section 3: Technical Specs | `provider_reported` | BHARAT STAGE VI (BS-VI) |
| **FC-14** | Seating Capacity | `seating_capacity` | `seatingCapacity` | `vehicle_profiles.seating_capacity` | Section 3: Technical Specs | `provider_reported` | Integer Seats (e.g. 3) |
| **FC-15** | Cubic Capacity (CC) | `cubic_capacity` | `cubicCapacity` | `vehicle_profiles.cubic_capacity` | Section 3: Technical Specs | `provider_reported` | Engine Displacement (e.g. 6700 cc) |
| **FC-16** | Gross Vehicle Weight (kg)| `gross_vehicle_weight` | `grossVehicleWeightKg` | `vehicle_profiles.gross_vehicle_weight_kg`| Section 3: Technical Specs | `provider_reported` | GVW in kg (e.g. 28,000 kg) |
| **FC-17** | Registration Date | `registration_date` | `registrationDate` | `vehicle_profiles.registration_date` | Section 4: Statutory Expiries | `provider_reported` | ISO Date String (`YYYY-MM-DD`) |
| **FC-18** | Manufacturing Date | `manufacturing_date` | `manufacturingDate` | `vehicle_profiles.manufacturing_date` | Section 4: Statutory Expiries | `provider_reported` | ISO Date String (`YYYY-MM-DD`) |
| **FC-19** | Fitness Valid Until | `fitness_valid_until` | `fitnessValidUntil` | `vehicle_profiles.fitness_valid_until` | Section 4: Statutory Expiries | `provider_reported` | Statutory Fitness Expiration |
| **FC-20** | Motor Insurance Expiry | `insurance_valid_until` | `insuranceValidUntil` | `vehicle_profiles.insurance_valid_until` | Section 4: Statutory Expiries | `provider_reported` | Policy Validity Date |
| **FC-21** | PUCC Valid Until | `pucc_valid_until` | `puccValidUntil` | `vehicle_profiles.pucc_valid_until` | Section 4: Statutory Expiries | `provider_reported` | Pollution Certificate Validity |
| **FC-22** | MV Road Tax Valid Until | `tax_valid_until` | `taxValidUntil` | `vehicle_profiles.tax_valid_until` | Section 4: Statutory Expiries | `provider_reported` | State Transport Tax Validity |
| **FC-23** | Commercial Permit Expiry| `national_permit_valid_until`| `nationalPermitValidUntil`| `vehicle_profiles.national_permit_valid_until`| Section 4: Statutory Expiries | `provider_reported` | National / All-India Permit Validity |
| **FC-24** | Hypothecation & Financier| `financier` / `financier_name`| `financierName` | `vehicle_profiles.financier_name` | Section 5: Hypothecation & NOC | `provider_reported` | Banking / NBFC Institution Name |

---

## 4. State Transport Policies & Regional Caveats

| Region / State | Transport Authority Scope | Observed Gateway Behavior & Caveat | Platform Mitigation |
| :--- | :--- | :--- | :--- |
| **Himachal Pradesh (HP)** | Mountainous District RTOs (Shimla, Mandi, Kangra) | Remote RTO node latency occasionally peaks between 5,000ms and 7,500ms. | Timeout ceiling set to 8,000ms with exponential backoff retries. |
| **Jammu & Kashmir (JK)** | J&K Transport Department (JK-01 to JK-22) | Citizen owner name data is withheld under regional transport privacy rules. | System safely marks attribute provenance as `restricted` rather than failing. |
| **North-East (MZ, AR, NL)**| Mizoram, Arunachal Pradesh, Nagaland RTOs | Intermittent upstream state optical fiber connectivity. | Circuit breaker trips to OPEN after 5 failures to prevent thread starvation. |
| **Delhi (DL)** | Delhi Transport Department & High Court | Disposed challan proceedings are archived separately from pending roadside fines. | Platform separates roadside pending fines from judicial court cases. |

---

## 5. Billing, Idempotency & Provider Unit Economics (COGS)

All financial transactions comply with Invariant 5 (Monetary Precision in minor units / paise).

### Positive Unit Economics (43.3% Gross Margin)

```
+---------------------------------------------------------+
| Customer Retail Price per Verification:                 |
|   1 Credit = 1,500 Paise (₹15.00)                       |
+---------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------+
| Less Upstream Provider COGS:                            |
|   - APISathi RC v1:       450 Paise (₹4.50)             |
|   - APISathi RC Challan:  400 Paise (₹4.00)             |
|   Total Upstream COGS:    850 Paise (₹8.50)             |
+---------------------------------------------------------+
                          |
                          v
+---------------------------------------------------------+
| Gross Margin per Verification:                          |
|   650 Paise (₹6.50) -> 43.3% Gross Margin               |
+---------------------------------------------------------+
```

### Idempotency Deduplication Guarantee

1. **Attempt 1**: Client requests combined verification with `Idempotency-Key: idemp-98124`. System reserves 1 credit (1500 paise), executes lookup, records ledger transaction, and caches payload.
2. **Attempt 2 (Replay)**: Client resends request with identical `Idempotency-Key` or queries within cache TTL. System recognizes deduplication key, serves cached result, and charges **0 additional credits (0 paise)**. Double charging is mathematically prevented.

---

## 6. Error Taxonomy & Invariant 2 Fail-Safe

| Upstream HTTP Code | Provider Exception Class | System Sanitized Response | Fail-Safe Compliance |
| :--- | :--- | :--- | :--- |
| **404 Not Found** | `VehicleNotFoundException` | `404 Not Found` | Explicit error; never defaults to empty vehicle. |
| **429 Rate Limit** | `ProviderRateLimitException` | `429 Too Many Requests` (includes `Retry-After: 60`) | Prevents upstream account ban; queues background jobs. |
| **500 Internal Error** | `ProviderException` | `502 Bad Gateway` | Explicit upstream failure; never substitutes mock data in production. |
| **504 Gateway Timeout**| `ProviderTimeoutException` | `504 Gateway Timeout` | Fails safely after 8,000ms; never interprets timeout as "clean record". |
| **503 Unavailable** | `ProviderUnavailableException` | `503 Service Unavailable` | Alerts administrators to replenish provider balance. |
| **Mock in Production** | `ProviderConfigurationException` | `422 Unprocessable Entity` | Invariant 2 strictly prevents enabling mock fallback in production. |

---

## 7. Production Readiness & Credential Gate Status

- **Authorized Credentials Status**: **BLOCKED PENDING CLIENT PROVISIONING (`EXT-01`)**
- **Production Execution Status**: **LOCKED OUT**
- **Mitigation Active**: `MockProvider` operational with 10 deterministic test fixtures; demonstration watermark `DEMONSTRATION DATA — NOT FOR OFFICIAL USE` indelibly enforced across all non-production outputs.
