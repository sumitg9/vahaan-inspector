# Acceptance Criteria & Verification Gates: VahanCheck Enterprise

## 1. Quality Assurance Standards

Every module and capability developed within VahanCheck Enterprise must pass strict, measurable acceptance criteria before being certified for production deployment. Criteria are structured using standard BDD **Given-When-Then** definitions.

---

## 2. Module-by-Module Acceptance Criteria

### 2.1 Multi-Tenant Data Isolation
- **AC-TENANT-01: Cross-Tenant Read Prevention**
  - **Given** an authenticated user belonging to Organization A (`org_id_1`),
  - **When** the user sends a request to `GET /api/v1/inspections/{case_id}` where the case belongs to Organization B (`org_id_2`),
  - **Then** the API must respond with `404 Not Found` or `403 Forbidden`, and no data from Organization B may be exposed.
- **AC-TENANT-02: Storage Partitioning**
  - **Given** an uploaded photo attachment for an inspection,
  - **When** the S3 pre-signed URL is generated,
  - **Then** the object storage path must be strictly prefixed with the user's `organization_id`, and pre-signed tokens must expire within 900 seconds.

---

### 2.2 API Provider Abstraction & Mock Resilience
- **AC-PROV-01: Default to Mock in Development**
  - **Given** the application environment is configured as `local` or `testing`,
  - **When** a vehicle registration or challan lookup is initiated,
  - **Then** the system must utilize `MockProvider`, return deterministic test fixtures, and flag the record as `is_mock_data = true`.
- **AC-PROV-02: Zero Silent Fallback in Production**
  - **Given** the application is running in `production` and APISathi credentials fail, time out (8s), or return a 500 error,
  - **When** a vehicle lookup is executed,
  - **Then** the system must **NOT** silently substitute mock data; it must return a sanitized `502 Bad Gateway` error and refund any held credit.
- **AC-PROV-03: Provider Cost & Telemetry Logging**
  - **Given** any call to an external provider API,
  - **When** the response is received,
  - **Then** the system must log provider response time, HTTP status, and estimated credit cost without logging raw unmasked citizen personal data.

---

### 2.3 Data Integrity & Prohibition of Fabrication
- **AC-DATA-01: No Fabrication of Missing Registry Fields**
  - **Given** a vehicle registry query where the provider omits the fitness certificate date or hypothecation details,
  - **When** the vehicle profile is saved and rendered,
  - **Then** the field must be recorded as `unavailable` or `not_applicable`, and must **NEVER** be filled with fabricated or synthetic placeholder dates.
- **AC-DATA-02: Checkpoints Never Default to Pass**
  - **Given** a new inspection case created from a template containing 80 checkpoints,
  - **When** the inspector opens the case or submits an incomplete form,
  - **Then** any checkpoint not physically verified by the inspector must be marked `not_checked` and must **NEVER** default to `Pass` or `Good`.
- **AC-DATA-03: PII Masking of Vehicle Owners**
  - **Given** a vehicle profile returned from a registry lookup,
  - **When** viewed in the standard web portal, mobile app, or public report,
  - **Then** the registered owner name must be masked (e.g., `M**** S**** LOGISTICS`) to comply with DPDP Act regulations.

---

### 2.4 Traffic Challans & Financial Integrity
- **AC-CHALLAN-01: Minor Unit Monetary Precision**
  - **Given** traffic violation records retrieved from eChallan,
  - **When** fine amounts are stored in the database,
  - **Then** they must be stored as integers representing Indian Paise (`fine_amount_paise`) to prevent floating-point rounding errors.
- **AC-CHALLAN-02: Deduplication by Challan Number**
  - **Given** multiple queries for the same vehicle over time,
  - **When** the same challan number is returned,
  - **Then** the database must update status (e.g. pending to disposed) rather than creating duplicate challan records.
- **AC-CHALLAN-03: Direct Parivahan Link & Zero Unofficial Payment**
  - **Given** a list of outstanding traffic violations,
  - **When** presented to the user on the web dashboard or PDF report,
  - **Then** each item must include a prominent redirect link to `https://echallan.parivahan.gov.in/` and must not attempt unauthorized private payment collection.

---

### 2.5 Multi-Axle Tyre Management
- **AC-TYRE-01: Position-Accurate Tyre Assessment**
  - **Given** a 3-axle commercial truck inspection case,
  - **When** tyre inspection data is submitted,
  - **Then** the system must record individual specifications for all 10 road wheels plus spare (Brand, Size, Tread Depth in mm, Remaining Life in %, Condition Rating) linked to dedicated photographic proof.
- **AC-TYRE-02: Tread Depth Validation**
  - **Given** an inspector logs a tread depth of 1.2 mm,
  - **When** remaining life is evaluated,
  - **Then** the system must flag condition as `WORN_OUT` or `CRITICAL` as it breaches commercial motor vehicle safety thresholds (< 1.6 mm).

---

### 2.6 Professional Vehicle Valuation & Override
- **AC-VAL-01: Separation of Algorithmic vs Certified Valuation**
  - **Given** an algorithmic valuation generated by standard depreciation formulas,
  - **When** displayed in reports or user interfaces,
  - **Then** it must be explicitly labeled as `Proposed Algorithmic Estimate` and must not be represented as a certified valuation until approved by an authorized valuer.
- **AC-VAL-02: Mandatory Written Justification for Override**
  - **Given** a certified valuer adjusts the proposed market value,
  - **When** the valuer submits the override,
  - **Then** the system must require a non-empty `override_justification` (minimum 30 characters) and permanently log the valuer's user ID and timestamp.

---

### 2.7 Comprehensive A4 PDF Report Engine
- **AC-REP-01: Reference Coverage Matrix Verification**
  - **Given** an approved inspection case,
  - **When** the A4 PDF report is rendered,
  - **Then** it must contain all 11 required sections (Executive Summary, Registration, Challans, Body/Chassis, Systems, Condition/Docs, Photos, Tyres, Valuation, Approvals, Disclaimers) without clipped text or overflowing tables.
- **AC-REP-02: Cryptographic QR Code Verification**
  - **Given** a generated PDF report,
  - **When** the embedded QR code is scanned using a smartphone camera,
  - **Then** it must open `https://app.vahancheck.com/verify-report/{token}` and display the untampered snapshot valuation, vehicle identifiers, and approver details.
- **AC-REP-03: Permanent Mock Watermarking**
  - **Given** an inspection report generated using mock provider data,
  - **When** the PDF is compiled,
  - **Then** every page must feature an indelible semi-transparent diagonal watermark: `DEMONSTRATION DATA — NOT FOR OFFICIAL USE`.

---

### 2.8 Offline-First Mobile Synchronization
- **AC-MOB-01: Offline Form Completion**
  - **Given** a field inspector's Android device has zero cellular or Wi-Fi connectivity,
  - **When** the inspector conducts an inspection, captures photos, and marks checkpoints,
  - **Then** all data must be saved locally in encrypted SQLite (`sqflite_sqlcipher`) without application crash or data loss.
- **AC-MOB-02: Idempotent Batch Sync**
  - **Given** a mobile device reconnects to a flaky cellular network,
  - **When** the sync engine pushes the offline queue multiple times due to TCP timeouts,
  - **Then** the backend must use `Idempotency-Key` headers to ensure records are not duplicated and credits are not deducted more than once.

---

### 2.9 Wallet & Atomic Billing Transactions
- **AC-BILL-01: Atomic Credit Deduction**
  - **Given** an organization has a balance of 20 credits, and an RC lookup costs 10 credits,
  - **When** two concurrent API requests arrive simultaneously,
  - **Then** the system must use database transactions with pessimistic row locks (`SELECT ... FOR UPDATE`) to ensure only one request succeeds and the balance becomes 10, while the second request fails with `402 Insufficient Balance`.
