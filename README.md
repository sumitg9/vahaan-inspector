# VahanCheck Enterprise

**Vehicle Intelligence, Verification, Inspection & Valuation Platform**

A production-oriented, multi-tenant cloud SaaS and mobile platform for Indian banks, NBFCs, vehicle surveyors, valuation agencies, and fleet operators.

---

## 1. Repository Structure

```
VAHAAN-INSPECTION/
├── backend/              # Laravel 11 Modular Monolith REST API (PHP 8.2+)
├── web/                  # Next.js 14+ SaaS Web Portal (TypeScript, Tailwind, shadcn/ui)
├── mobile/               # Flutter 3.x Android Application (Encrypted SQLite, Clean Architecture)
├── database/             # PostgreSQL DDL migrations, ER diagrams, seeders
├── mock-api/             # APISathi deterministic mock server & test fixtures
├── report-templates/     # Headless Chromium A4 PDF print templates
├── infrastructure/       # Docker Compose, Nginx, Redis configs
├── docs/                 # Architectural specifications, API contracts, guides
├── tests/                # End-to-end integration and contract test suites
├── .github/workflows/    # CI/CD pipelines
└── AGENTS.md             # Autonomous engineering standards
```

---

## 2. Quick Start with Docker

### Prerequisites
- Docker Engine 24+ & Docker Compose v2+
- Node.js 20+ & PHP 8.2+ (for local host development without Docker)

### Launch Local Development Stack
```bash
# 1. Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env
cp web/.env.example web/.env
cp mobile/.env.example mobile/.env

# 2. Start all services via Docker Compose
docker compose -f infrastructure/docker-compose.yml up -d

# 3. Verify health endpoints
curl http://localhost:8000/api/v1/health   # Backend API
curl http://localhost:3000/api/health      # Next.js Web
curl http://localhost:4000/health          # Mock APISathi Server
```

---

## 3. Technology Stack & Ports

| Service | Port | Description |
| :--- | :--- | :--- |
| **Nginx Gateway** | `80` / `443` | Reverse proxy routing web (`/`) and API (`/api`) |
| **Next.js Web Portal** | `3000` | SaaS Web dashboard (App Router, Tailwind, shadcn) |
| **Laravel API Backend** | `8000` | Modular Monolith central REST API (Sanctum) |
| **Mock APISathi Gateway** | `4000` | Deterministic vehicle registry & eChallan mock server |
| **PostgreSQL 16** | `5432` | Primary relational database (`vahancheck_db`) |
| **Redis 7** | `6379` | Cache, Queues, Rate Limiting, Distributed Locks |
| **MinIO S3 Storage** | `9000` / `9001` | Private S3-compatible media bucket & admin console |
| **Mailpit SMTP & UI** | `1025` / `8025` | Local transactional email testing inbox |

---

## 4. Documentation Index

- [docs/USER_README.md](docs/USER_README.md): Master System Administrator & Super Admin Operations Manual.
- [docs/DEPLOYMENT_AND_RELEASE_GUIDE.md](docs/DEPLOYMENT_AND_RELEASE_GUIDE.md): Master production deployment and release runbook.
- [docs/PROJECT_SPECIFICATION.md](docs/PROJECT_SPECIFICATION.md): Core platform vision, user personas, module scopes.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): System architecture, tenancy isolation, offline sync protocol.
- [docs/DATABASE_DESIGN.md](docs/DATABASE_DESIGN.md): PostgreSQL DDL, schema diagrams, minor unit monetary storage.
- [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md): OpenAPI 3.1 specifications, APISathi official contracts, mock fixtures.
- [docs/UI_UX_SPECIFICATION.md](docs/UI_UX_SPECIFICATION.md): Dark navy tokens, shadcn layout, outdoor-ready mobile design.
- [docs/SECURITY_REQUIREMENTS.md](docs/SECURITY_REQUIREMENTS.md): DPDP Act compliance, PII masking, token rotation, QR security.
- [docs/REPORT_FIELD_MAPPING.md](docs/REPORT_FIELD_MAPPING.md): 9-page reference inspection dossier coverage matrix.
- [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md): Phased implementation timeline and external dependency register.
- [docs/ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md): BDD Given-When-Then verification criteria.
- [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md): Live phase tracker, toolchain status, blocker log.
- [AGENTS.md](AGENTS.md): Architecture invariants and autonomous developer instructions.
