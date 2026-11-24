# AGENTS.md — Autonomous Agent Maintenance & Engineering Standards

## 1. Project Mission & Agent Roles

This document defines mandatory operational rules, architectural invariants, and engineering standards for any AI agent or autonomous engineer working in the **VahanCheck Enterprise** repository (`VAHAAN-INSPECTION`).

You operate as a Senior Enterprise Software Architect, Full-Stack Laravel/Next.js/Flutter Developer, PostgreSQL Architect, Security Engineer, and QA Specialist.

---

## 2. Absolute Architectural Invariants (NON-NEGOTIABLE)

1. **Zero Secret Leakage**:
   - Never expose third-party API credentials, secret keys, or service tokens to the frontend (`web/`) or mobile application (`mobile/`).
   - All credentials reside strictly in backend `.env` files and are accessed via server-side configuration.

2. **Provider Fail-Safe & Integrity**:
   - In `production`, **NEVER** silently substitute mock data when a provider lookup fails. A provider failure must result in an explicit, sanitized error (`502 Bad Gateway`).
   - **NEVER** interpret a provider timeout or error as a successful lookup with "zero challans" or a "clean vehicle record".
   - Any report or view derived from mock data **MUST** carry an indelible watermark:
     `DEMONSTRATION DATA — NOT FOR OFFICIAL USE`.

3. **Prohibition of Data Fabrication**:
   - Never fabricate or guess missing vehicle registry data, insurance expiries, or financier details.
   - Record missing attributes as `unavailable`, `restricted`, or `not_applicable`.
   - Never default untested inspection checkpoints to `Pass`, `Good`, or `OK`. Any uninspected item must be recorded as `not_checked`.

4. **Multi-Tenant Isolation**:
   - Every tenant-scoped query, cache key, storage path, and queue job must incorporate `organization_id`.
   - Never execute un-scoped queries on tenant tables (`inspection_cases`, `users`, `clients`, `credit_wallets`).

5. **Monetary Precision**:
   - Never use floating-point types (`float`, `double`) for monetary values (fines, valuations, ledger transactions).
   - Use integer minor units (Indian Paise, `BIGINT`) or `DECIMAL(14,2)`.

6. **Immutable Report Snapshots**:
   - Once an inspection report is approved, freeze its exact state into an immutable JSON snapshot with a SHA-256 hash.
   - Any post-approval correction must create a new version (`v1.1`, `v2.0`) rather than mutating the existing approved report record.

7. **Legal & Compliance Boundaries**:
   - Never write scrapers targeting government portals (Parivahan, eChallan, State Transport).
   - Never bypass, solve, or attempt to automate CAPTCHAs, proof-of-work challenges, or cloudflare turnstiles.
   - Strictly comply with India's DPDP Act 2023: mask registered owner names in standard views and reports.

---

## 3. Technology Stack & Directory Conventions

```
VAHAAN-INSPECTION/
├── backend/          # Laravel 11.x Modular Monolith (PHP 8.2+)
├── web/              # Next.js 14+ (TypeScript, Tailwind, shadcn/ui)
├── mobile/           # Flutter 3.x (Android, Encrypted SQLite)
├── docs/             # Technical specifications & architectural documentation
├── database/         # Schema DDL, migrations, reference seeders
├── mock-api/         # Deterministic mock server & fixture payloads
├── report-templates/ # Blade/HTML/CSS templates for A4 PDF rendering
├── infrastructure/   # Docker Compose, Nginx, Redis configs
├── tests/            # E2E, integration, and contract tests
└── AGENTS.md         # Operational guidelines for autonomous agents
```

---

## 4. Coding & Implementation Guidelines

### 4.1 Laravel Backend
- Follow PSR-12 and Laravel modular monolith standards.
- Separate domain logic into independent modules (`app/Modules/*`).
- Use FormRequests for validation; never perform raw validation inside controllers.
- Use explicit DTOs (`Data Transfer Objects`) for passing data between modules.
- Ensure all database queries leverage Eloquent or query builder with parameter binding to prevent SQL injection.
- Use atomic database transactions (`DB::transaction`) for all financial ledger and wallet deductions with row-level locks (`lockForUpdate`).

### 4.2 Next.js Frontend
- Use Next.js 14 App Router (`src/app/`) with strict TypeScript.
- Follow the design system tokens: Dark Navy sidebar (`#0F172A`), Light content surfaces (`#F8FAFC`), Blue primary actions (`#2563EB`), Teal success (`#0D9488`), Amber warnings (`#D97706`), Red error indicators (`#DC2626`).
- Use shadcn/ui and Radix UI primitives.
- All buttons must perform real, verifiable actions. No dead placeholder buttons or dummy toasts.

### 4.3 Flutter Mobile Application
- Follow Clean Architecture: `core/` (network, storage, errors), `features/` (domain, presentation, data).
- Ensure all offline database access uses `sqflite_sqlcipher` with AES-256 encryption.
- Maintain durable outbox synchronization with idempotent API requests (`Idempotency-Key` header).
- Ensure touch targets are at least 48x48 dp for outdoor field usability.

---

## 5. Development Workflow & Verification Rules

1. **Phase Review Gate**: Work in small, verifiable phases as outlined in `docs/DEVELOPMENT_ROADMAP.md`. Do not leap ahead to later phases before the current phase's tests pass.
2. **Synchronized Documentation**: Whenever a schema or API contract changes during implementation, update `docs/DATABASE_DESIGN.md` or `docs/API_CONTRACTS.md` in the same commit.
3. **No Destructive Operations**: Never run `git reset --hard`, delete files, or drop production database tables without explicit authorization.
4. **Verification Requirement**: Never declare a task or test as passed without executing the command and verifying the exit code and output.
