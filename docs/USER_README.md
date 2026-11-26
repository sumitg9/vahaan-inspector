# VahanCheck Enterprise — System Administrator & Super Admin Operations Manual
> **Document Identifier:** `DOC-OPS-ADM-001`  
> **Classification:** Internal Enterprise Confidential  
> **Platform Version:** `v1.0.0-RELEASE`  
> **Living Document Status:** Synchronized with Monorepo State

---

## 1. Executive Platform Overview & Architectural Topology

**VahanCheck Enterprise** is a mission-critical, multi-tenant cloud SaaS and mobile platform designed for Indian commercial banks, non-banking financial companies (NBFCs), chartered vehicle surveyors, loss assessors, insurance underwriters, and enterprise fleet operators.

The platform provides end-to-end automation across four core domains:
1. **Automated Vehicle Intelligence**: Real-time VAHAN vehicle registry verification and eChallan traffic violation retrieval.
2. **On-Ground Field Inspection**: Digital offline-first mobile checklists, cryptographic photo evidence with EXIF GPS coordinates, and multi-axle tyre condition assessments.
3. **Actuarial Vehicle Valuation**: Algorithmic market depreciation models with authorized valuer override governance.
4. **Tamper-Evident Reporting**: 11-section A4 PDF dossiers, immutable SHA-256 JSON snapshots, and public QR-code cryptographic verification.

```mermaid
flowchart TD
    subgraph Clients["Clients & Edge Devices"]
        WEB["Next.js 14 SaaS Web Portal<br/>(Desktop / Office Desk)"]
        MOB["Flutter 3.x Android Application<br/>(Field Surveyors / Offline SQLite)"]
        PUB["Public QR Verification Portal<br/>(Bank Underwriters / Third Parties)"]
    end

    subgraph Gateway["Edge & Security Layer"]
        NGINX["Nginx HTTPS Gateway (Port 80/443)<br/>TLS 1.3 | HSTS | Rate Limiting | CSP"]
    end

    subgraph AppServers["Application Services"]
        LARAVEL["Laravel 11.x Modular Monolith API<br/>(PHP 8.2-FPM | Sanctum Auth)"]
        WORKER["Queue Workers (3x Parallel)<br/>high | default | notifications"]
        CRON["Crond Scheduler Daemon<br/>(Statutory Expiry Audits)"]
    end

    subgraph DataServices["Persistence & State Engine"]
        PG["PostgreSQL 16 Primary DB<br/>(Multi-Tenant Scoped | Integer Paise)"]
        REDIS["Redis 7 In-Memory Cache<br/>(Sessions | Queues | Rate Limits)"]
        MINIO["MinIO / AWS S3 Object Store<br/>(Private Encrypted Media & PDFs)"]
    end

    subgraph Providers["External Intelligence Gateways"]
        APISATHI["APISathi Production Gateway<br/>(RC v1 & eChallan APIs)"]
        MOCKAPI["Deterministic Mock Gateway (Port 4000)<br/>(10 Pre-configured Test Fixtures)"]
    end

    WEB --> NGINX
    MOB --> NGINX
    PUB --> NGINX

    NGINX -->|/api/*| LARAVEL
    NGINX -->|/*| WEB
    NGINX -->|/vahan-storage/*| MINIO

    LARAVEL --> PG
    LARAVEL --> REDIS
    LARAVEL --> MINIO
    WORKER --> REDIS
    WORKER --> PG
    CRON --> LARAVEL

    LARAVEL -.->|Live Mode (EXT-01)| APISATHI
    LARAVEL -.->|Dev / Staging Mode| MOCKAPI
```

---

## 2. Absolute Architectural Invariants (`AGENTS.md`)

Every System Administrator and Super Admin must strictly enforce the **7 Non-Negotiable Architectural Invariants** defined in `AGENTS.md`. No configuration, code patch, or manual override may bypass these rules:

| # | Invariant Name | Mandatory Technical Requirement | Violation Consequence |
| :-: | :--- | :--- | :--- |
| **1** | **Zero Secret Leakage** | Third-party API credentials, secret keys, and service tokens reside strictly in server-side backend environment variables. Admin APIs permanently mask secrets (`••••••••`). | Immediate security block & token revocation. |
| **2** | **Provider Fail-Safe & Watermarks** | In `production`, mock fallback data is strictly prohibited (`APISATHI_PROD_ENABLED=false` lockout). Any report generated with mock data carries an indelible watermark: `DEMONSTRATION DATA — NOT FOR OFFICIAL USE`. | HTTP 422 Unprocessable Entity & Security Alert. |
| **3** | **Prohibition of Data Fabrication** | Missing registry attributes must be stored as `unavailable` or `restricted`. Untested inspection checkpoints strictly default to `not_checked` and never to `Pass` or `Good`. | Audit failure & rejection of valuation dossier. |
| **4** | **Multi-Tenant Isolation** | Every query, cache key, queue job, and S3 storage path incorporates `organization_id`. Cross-tenant queries are blocked at middleware and database levels. | HTTP 403 Forbidden & `CROSS_TENANT_ACCESS_ATTEMPT` audit log. |
| **5** | **Monetary Precision in Paise** | Never use floating-point types (`float`, `double`) for money. All valuations, fines, wallet transactions, and ledger balances use 64-bit integers in Indian Paise (`BIGINT`). | Schema rejection & immediate build failure. |
| **6** | **Immutable Report Snapshots** | Approved inspection reports are frozen into canonical JSON snapshots with SHA-256 hashes and 64-character verification tokens. Revisions create new versions (`v1.1`, `v2.0`). | Report tampering alert & digital seal revocation. |
| **7** | **Legal & DPDP Compliance** | Zero web scraping targeting government portals (Parivahan/eChallan) and zero CAPTCHA automation. Citizen owner names are masked (`M**** S****`) per India's Digital Personal Data Protection Act 2023. | Regulatory non-compliance & service suspension. |

---

## 3. Super Admin Console & System Governance

Super Admins access the privileged governance desk at `/admin` (or through the **Governance** section in the sidebar).

### 3.1 Tenant Organization Management (`/admin/organizations`)
- **Provisioning**: Creates new isolated enterprise tenants with custom business registration numbers (CIN/GSTIN), primary headquarters branch, and assigned administrator.
- **Tenant Status Lifecycle**:
  - `ACTIVE`: Normal production operations.
  - `TRIAL`: Standard lookups enabled with quota ceilings.
  - `SUSPENDED`: Immediate lockout of all users in the tenant organization; API calls return `HTTP 403 Organization Suspended`.
- **Privileged Credit Wallet Adjustments**: Allows Super Admins to manually credit or debit a tenant's wallet using atomic database row-level locks (`lockForUpdate`) with minor unit paise precision and mandatory audit reasoning.

### 3.2 Provider Secret Vault (`/admin/providers`)
- **Zero Secret Leakage**: API tokens and client secrets are permanently masked in the UI (`sk_live_••••••••9921`).
- **Production Lockout Guard**: Prevents toggling `mock_fallback_enabled` to `true` when `APP_ENV=production` (Invariant 2).
- **Tariff & Circuit Breaker Controls**:
  - Configurable timeout thresholds (default: 8,000ms for RC, 10,000ms for Challans).
  - Maximum retry attempts (default: 2 retries with exponential backoff).
  - Circuit breaker trip limits (trips after 5 consecutive upstream failures, cooldown 60s).
  - Cost tracking per query in paise for gross margin telemetry.

### 3.3 Feature Flags Management (`/admin/feature-flags`)
System Administrators can toggle platform capabilities globally or per tenant:
- `enable_live_parivahan_lookup`: Governs whether upstream queries hit external APIs.
- `enable_ocr_comparison`: Enables Tesseract / Vision OCR discrepancy detection against RC smart cards.
- `enforce_cmv_rule_95_tyres`: Strictly enforces Central Motor Vehicles Rule 95 (<1.6mm tread depth = `WORN_OUT`).
- `enable_distress_valuation_override`: Allows certified valuers to apply liquidation haircuts with written justifications.
- `enable_public_qr_verification`: Activates public tamper-verification web portal for printed reports.
- `enforce_dpdp_strict_masking`: Enforces citizen PII redaction across all views, exports, and logs.

### 3.4 Report Settings & Branding (`/admin/report-settings`)
- Configures tenant-specific A4 PDF header titles, confidentiality footer clauses, organization logos, and custom legal disclaimers.
- Configures three-tier digital signature requirements (Field Surveyor, QC Officer, Certified Valuer).
- **Lock Notice**: Displays the indelible `DEMONSTRATION DATA` watermark status lock.

### 3.5 Forensic Audit Trail & Critical Alerts (`/admin/audit`)
- Real-time stream of all sensitive platform mutations.
- Monitored Security Incidents:
  - `PRIVILEGE_ESCALATION_ATTEMPT`: Non-super-admin attempting to grant `SUPER_ADMIN` role.
  - `CROSS_TENANT_ACCESS_ATTEMPT`: User attempting to query another organization's records.
  - `INVARIANT_2_VIOLATION_ATTEMPT`: Attempting to enable mock fallback in production.
  - `COST_CEILING_BREACH`: Bulk verification batch exceeding configured budget.
- Payloads detail: `user_id`, `ip_address`, `event_type`, `old_values`, `new_values`, with DPDP citizen PII automatically redacted.

---

## 4. Authentication, RBAC & Security Matrix

### 4.1 6-Tier Role Permission Matrix

| Module / Action | Key | SUPER_ADMIN | ORG_ADMIN | MANAGER | VALUER | INSPECTOR | CLIENT_VIEWER |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **System Governance** | `admin.*` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Organization CRUD** | `org.*` | ✅ | ✅ | 👁️ Read | 👁️ Read | ❌ | ❌ |
| **Branch Management** | `branches.*` | ✅ | ✅ | 👁️ Read | 👁️ Read | ❌ | ❌ |
| **User Management** | `users.*` | ✅ | ✅ | 👁️ Read | ❌ | ❌ | ❌ |
| **Clients & Banks** | `clients.*` | ✅ | ✅ | ✅ (No Del) | 👁️ Read | 👁️ Read | ❌ |
| **Vehicle Intelligence**| `vehicles.lookup` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Bulk Verification** | `vehicles.bulk_verify` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Fleet Compliance** | `fleet.view / manage` | ✅ | ✅ | ✅ | ✅ | 👁️ Read | ❌ |
| **Fleet Data Export** | `fleet.export` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Traffic Challans** | `challans.view` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Challans Refresh** | `challans.refresh` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Inspection Cases** | `inspections.view_all` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Assigned Cases Only**| `inspections.view_assigned` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Assign Surveyors** | `inspections.assign` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Fill Checklists** | `inspections.update_item` | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **QC Review & Reject** | `inspections.review` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Valuation Modeling** | `valuation.calculate` | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Valuation Override** | `valuation.override` | ✅ | ❌ | ❌ | ✅ (Min 30 chars)| ❌ | ❌ |
| **Valuation Certify** | `valuation.approve` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Generate A4 Report** | `reports.generate` | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Download PDF** | `reports.download` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Billing & Credits** | `billing.*` | ✅ | ✅ | 👁️ Wallet | ❌ | ❌ | ❌ |
| **Audit Logs** | `audit.view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### 4.2 Privilege Escalation Defense
Any user attempting to assign a role equal to or higher than their own (e.g. `ORG_ADMIN` attempting to assign `SUPER_ADMIN`) is halted at `UserController::store` and `update` with `HTTP 403 Forbidden` and logged as a high-severity security alert.

### 4.3 Frontend Role-Based Dynamic Sidebar Filtering
The web portal (`Sidebar.tsx` and `AppShell.tsx`) dynamically adapts its navigation menus according to the authenticated user's role:
- **`SUPER_ADMIN`**: Displays all 10 core operational links plus the privileged **Governance** section (Super Admin Console, Tenant Organizations, Users & RBAC, Provider Vault, Feature Flags, Report Settings).
- **`ORG_ADMIN`**: Displays all 10 core operational links (Dashboard, Vehicles, Challans, Inspections, Valuation, Fleet, Clients, Wallet, Audit, Branches). The **Governance** section is strictly **hidden**.
- **`MANAGER`**: Displays operational links for case management, surveyor assignment, and QC review. Gated from Valuation Calculation and Admin Governance.
- **`VALUER`**: Displays Dashboard, Vehicles, Challans, Inspections, Valuation Desk, Fleet Compliance, and Settings. Hides Billing, Clients, and Governance.
- **`INSPECTOR`**: Streamlined for field work; displays only Dashboard, Vehicles, Challans, and Assigned Inspections. Hides Valuation, Fleet, Clients, Billing, Audit, and Governance.
- **`CLIENT_VIEWER`**: Displays only Dashboard and Inspection Reports for bank/NBFC underwriters.
- **Role Evaluation on Login**: Administrators can test role-filtered sidebars using the persona switcher on the `/login` desk. When logging in as a specific persona, the sidebar automatically initializes with that role's exact permitted views.

---

## 5. External Provider Integration & 24-Field VAHAN Coverage

### 5.1 Service Level Agreements (SLAs)

| Provider Feed | Endpoint Scope | Expected SLA | Timeout Threshold | Rate Limit |
| :--- | :--- | :--- | :--- | :--- |
| **APISathi Vehicle RC v1** | Complete Registration Dossier | 99.5% Uptime | 8,000 ms | 60 requests / min |
| **APISathi eChallan Parivahan** | Traffic Violations & Court Records | 99.0% Uptime | 10,000 ms | 30 requests / min |
| **Deterministic Mock Gateway** | Local Development & CI Testing | 100.0% Uptime | 25 ms | Unlimited |

### 5.2 24-Field Canonical VAHAN Coverage Matrix

| # | Canonical Attribute | Raw Upstream JSON Key | Normalized DTO Property | Database Model Field |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Registration Number | `rc_number` / `regNo` | `registration_number` | `vehicle_profiles.registration_number` |
| 2 | Registered Owner Name | `owner_name` / `registered_owner` | `registered_owner` (Masked DPDP) | `vehicle_profiles.registered_owner_masked` |
| 3 | Chassis Number (VIN) | `chassis_no` / `vin` | `chassis_number` (Suffix masked) | `vehicle_profiles.chassis_number_masked` |
| 4 | Engine Number | `engine_no` / `engine_number` | `engine_number` (Suffix masked) | `vehicle_profiles.engine_number_masked` |
| 5 | Vehicle Class / Category | `vehicle_class` / `class` | `vehicle_class` | `vehicle_profiles.vehicle_class` |
| 6 | Make & Manufacturer | `maker_model` / `manufacturer` | `maker_model` | `vehicle_profiles.maker_model` |
| 7 | Commercial Model Name | `model_name` / `commercial_name` | `commercial_model` | `vehicle_profiles.commercial_model` |
| 8 | Body Type Configuration | `body_type` / `desc` | `body_type` | `vehicle_profiles.body_type` |
| 9 | Fuel Type Specification | `fuel_type` / `fuel` | `fuel_type` | `vehicle_profiles.fuel_type` |
| 10 | Emission Norms Tier | `emission_norms` / `norms` | `emission_norms` (e.g. BS-VI) | `vehicle_profiles.emission_norms` |
| 11 | Date of Registration | `registration_date` / `regDate` | `registration_date` | `vehicle_profiles.registration_date` |
| 12 | Manufacturing Date / Year | `manufacturing_date` / `mfg_year` | `manufacturing_date` | `vehicle_profiles.manufacturing_date` |
| 13 | Registration Validity Expiry | `fitness_upto` / `valid_until` | `fitness_valid_until` | `vehicle_profiles.fitness_valid_until` |
| 14 | Motor Insurance Validity | `insurance_upto` / `insurance_validity`| `insurance_valid_until` | `vehicle_profiles.insurance_valid_until` |
| 15 | Insurance Policy Number | `insurance_policy_no` | `insurance_policy_number` | `vehicle_profiles.insurance_policy_number` |
| 16 | Insurance Underwriter Name | `insurance_company` | `insurance_company_name` | `vehicle_profiles.insurance_company_name` |
| 17 | Pollution Under Control (PUC)| `pucc_upto` / `puc_valid_until` | `pucc_valid_until` | `vehicle_profiles.pucc_valid_until` |
| 18 | Commercial Goods/Permit | `national_permit_upto` / `permit_valid`| `national_permit_valid_until` | `vehicle_profiles.national_permit_valid_until`|
| 19 | Road Tax Expiry | `tax_upto` / `mv_tax_validity` | `tax_valid_until` | `vehicle_profiles.tax_valid_until` |
| 20 | Hypothecation / Financed Bank | `financier` / `hypothecated_to` | `financier_name` | `vehicle_profiles.financier_name` |
| 21 | Registering RTO Authority | `registered_at` / `rto_name` | `registered_rto_authority` | `vehicle_profiles.registered_rto_authority` |
| 22 | Seating / Standing Capacity | `seat_capacity` / `seating_cap` | `seating_capacity` | `vehicle_profiles.seating_capacity` |
| 23 | Unladen / Gross Weight (GVW) | `gross_weight` / `gvw_kg` | `gross_vehicle_weight_kg` | `vehicle_profiles.gross_vehicle_weight_kg` |
| 24 | Number of Axles & Cylinders | `number_of_axles` / `cylinders` | `axle_count` | `vehicle_profiles.axle_count` |

### 5.3 Deterministic Test Fixtures (`mock-api/fixtures/`)
- `MH12AB1234`: Authentic 3-axle commercial tipper with 2 pending traffic violations (₹2,500 total).
- `DL01XY9999`: Passenger SUV with restricted citizen ownership and 0 violations.
- `KA01MJ0001`: Heavy goods vehicle with expired insurance, lapsed fitness, and 4 unpaid violations.

---

## 6. Core Business Modules & Workflows

### 6.1 Inspection Case Lifecycle State Machine
```
[DRAFT] ──> [ASSIGNED] ──> [IN_PROGRESS] ──> [SUBMITTED] ──> [QC_REVIEW] ──> [QC_APPROVED] ──> [APPROVED]
                                                     │              │
                                                     └──<──[QC_CORRECTION]<──┘
```
1. **Creation**: Organization Admin or Manager initiates a case with client bank and vehicle registration number.
2. **Assignment**: Case assigned to a licensed field surveyor (`INSPECTOR`).
3. **Execution**: Surveyor fills checklist across 7 domains (Engine, Transmission, Suspension, Electrical, Body, Cabin, Safety). **Invariant 3**: Untouched checkpoints strictly remain `not_checked`.
4. **Evidence & Tyres**: Surveyor captures mandatory photo slots (Front 45°, Rear 45°, Odometer, Chassis Stamp, Tyres). Measures individual tyre tread depths in mm. If depth < 1.6mm, CMV Rule 95 alert triggers, condition forced to `WORN_OUT`.
5. **QC Review**: QC Manager reviews submission. If photos are blurry or tyres mismarked, case rejected back to `QC_CORRECTION` with mandatory written remarks.
6. **Valuation**: Certified valuer reviews approved condition, computes algorithmic estimate, applies overrides if justified, and certifies the valuation.
7. **Report Compilation**: Report compiled, snapshot frozen with SHA-256 hash, and published.

### 6.2 Actuarial Valuation Formulas
The algorithmic valuation engine calculates Depreciated Market Value (DMV):
$$\text{Base Depreciated Value} = \text{Invoice Cost} \times (1 - \text{Age Depreciation Rate})$$
$$\text{Utilization Excess} = \max(0, \text{Odometer} - (\text{Benchmark} \times \text{Age})) \times \text{Tariff Rate}$$
$$\text{Condition Penalty} = \sum_{p \in \{\text{body, mech, elec}\}} (10 - \text{Score}_p) \times \text{Weight}_p \times \text{Base Value}$$
$$\text{Proposed Valuation} = \max(\text{Scrap Floor}, \text{Base Value} - \text{Excess} - \text{Condition Penalty} - \text{Tyre Refurbishment} - \text{Damages})$$
$$\text{Distress Liquidation Value} = \text{Proposed Valuation} \times 0.85$$

---

## 7. Enterprise Billing, Credits & Invoicing

### 7.1 Double-Entry Immutable Ledger
- Minor monetary units: Stored in **Indian Paise** (`BIGINT`).
- Tariff structure:
  - 1 Credit = ₹15.00 (1500 paise).
  - RC Lookup: 1 Credit (1500 paise retail; COGS provider cost 450 paise; gross margin 70.0%).
  - eChallan Lookup: 1 Credit (1500 paise retail; COGS provider cost 250 paise; gross margin 83.3%).
  - Full Ground Inspection & Dossier: 20 Credits (₹300.00).

### 7.2 Two-Phase Credit Reservation Protocol
1. `CreditReservationService::reserve`: Decrements spendable balance immediately and moves credits to `PENDING` pool with a 60-minute TTL to prevent concurrent overdrafts.
2. `CreditReservationService::commit`: Upon successful lookup or inspection sign-off, permanently debits wallet and transitions reservation to `COMMITTED`.
3. `CreditReservationService::release`: If external lookup times out or inspection is cancelled, reserved credits return to spendable balance immediately (`RELEASED`).

### 7.3 Idempotency & Deduplication
Every financial debit/credit accepts an `Idempotency-Key` header (UUIDv4). Replayed requests with the same key return the previous result with **zero duplicate charges**.

---

## 8. Fleet Management & Statutory Expiry Engine

- Monitors 5 statutory documents for every registered fleet vehicle:
  1. Fitness Certificate (`fitness_valid_until`)
  2. Motor Insurance (`insurance_valid_until`)
  3. Pollution Under Control (`pucc_valid_until`)
  4. National / State Goods Permit (`national_permit_valid_until`)
  5. Road Tax (`tax_valid_until`)
- Expiry Categories: `EXPIRED` (<0d), `EXPIRES_TODAY` (0d), `EXPIRING_7D` (1-7d), `EXPIRING_30D` (8-30d), `VALID` (>30d).
- Pre-flight batch cost ceiling guards prevent running bulk verifications that exceed tenant budget limits.

---

## 9. Operations, Deployment & Disaster Recovery

### 9.1 Local Standalone Execution (Developer Mode)

```powershell
# Copy environment configuration
Copy-Item .env.example .env
Copy-Item backend/.env.example backend/.env
Copy-Item web/.env.example web/.env

# Run database migrations and seeders (SQLite standalone)
php backend/artisan migrate --force
php backend/artisan db:seed --force

# Start Mock APISathi Gateway (Port 4000)
node mock-api/server.js

# Start Laravel Backend (Port 8000)
php backend/artisan serve --port=8000

# Start Next.js Web Portal (Port 3000)
cd web; npm run dev
```

### 9.2 Production Docker Deployment

```bash
# 1. Audit production secrets for default values or Invariant 2 violations
bash infrastructure/scripts/validate-secrets.sh .env.production

# 2. Launch production container stack
docker compose -f infrastructure/docker-compose.prod.yml --env-file .env.production up -d --build

# 3. Verify health probes
curl -k https://localhost/api/health
curl -k https://localhost/api/health/ping
curl -k https://localhost/
```

### 9.3 Automated Database Backups & DR Restore Testing

```bash
# Run automated AES-256 encrypted backup
bash infrastructure/scripts/backup-db.sh

# Run Disaster Recovery sandbox verification
# Decrypts backup, validates SHA-256, restores to test DB, validates table counts, and cleans up
bash infrastructure/scripts/restore-db-test.sh /var/backups/vahancheck/vahancheck_backup_latest.sql.gz.enc
```

### 9.4 Flutter Android Signed Release Build

```bash
# Build production signed Android App Bundle (AAB) & split APKs
cd mobile
bash scripts/build-android-release.sh
```

---

## 10. System Administrator Troubleshooting & Error Taxonomy

The platform standardizes on **RFC 7807 Problem Details** (`application/problem+json`):

| HTTP Status | Error Type / Exception | Cause | System Administrator Resolution |
| :-: | :--- | :--- | :--- |
| **401** | `UnauthenticatedException` | Expired Sanctum token or invalid session. | User must re-authenticate via `/login`. |
| **403** | `TenantMismatchException` | Attempting to access record belonging to another `organization_id`. | Security alert logged. Verify user's assigned organization in `/admin/users`. |
| **403** | `ExportPermissionDeniedException` | User lacks `fleet.export` permission. | Grant `fleet.export` permission to user role in `PermissionMatrix`. |
| **404** | `VehicleNotFoundException` | Registration number does not exist in registry. | Verify syntax (e.g. `MH12AB1234`). |
| **422** | `ValuationOverrideJustificationException` | Valuer override reason is under 30 characters. | Valuer must provide detailed actuarial justification (min 30 chars). |
| **422** | `Invariant2ProductionLockException` | Attempted to enable mock fallback in production. | Invariant 2 violation. Keep mock fallback disabled in production. |
| **429** | `ProviderRateLimitException` | Upstream provider query limit exhausted. | System retries after `Retry-After` header interval. Check provider quota. |
| **502** | `ProviderUnavailableException` | Upstream APISathi/Parivahan portal unreachable. | Sanitized error returned. Inspect network connectivity and provider status. |
| **504** | `ProviderTimeoutException` | Upstream query exceeded timeout threshold (8-10s). | Check provider latency in `/admin/providers`. |

---

## 11. Living Document Synchronization Protocol

> [!IMPORTANT]
> **Mandatory Agent & Developer Invariant**:  
> Whenever any schema migration, REST API endpoint, RBAC permission, environment configuration, or core business workflow is added, modified, or deprecated in the codebase, **THIS FILE (`docs/USER_README.md`) MUST BE UPDATED IN THE SAME SESSION OR COMMIT**.  
> The codebase and this manual must remain in lockstep at all times.
