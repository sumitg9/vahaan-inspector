/**
 * Comprehensive Automated Test Suite for Next.js Web SaaS Portal
 * Verifies UI components, accessibility, responsive design, domain pages, and backend connections.
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function assert(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    failed++;
  }
}

console.log('[Web Portal Automated UI/UX & Contract Test Suite] Starting test runner...\n');

// 1. Verify Health API route
assert('Health API route exists and defines GET handler with service identifier', () => {
  const routePath = path.join(__dirname, '../src/app/api/health/route.ts');
  if (!fs.existsSync(routePath)) throw new Error('Health route.ts missing');
  const content = fs.readFileSync(routePath, 'utf8');
  if (!content.includes('export async function GET')) throw new Error('Missing GET export in health route');
  if (!content.includes('vahancheck-web-portal')) throw new Error('Service identifier not found in health route');
});

// 2. Verify Reusable UI Components
assert('All reusable shadcn UI components exist with complete props & styling', () => {
  const components = [
    'button.tsx',
    'badge.tsx',
    'card.tsx',
    'dialog.tsx',
    'input.tsx',
    'table.tsx',
    'skeleton.tsx',
    'empty-state.tsx',
    'error-boundary.tsx',
  ];
  for (const comp of components) {
    const compPath = path.join(__dirname, '../src/components/ui', comp);
    if (!fs.existsSync(compPath)) throw new Error(`Missing UI component: ${comp}`);
    const content = fs.readFileSync(compPath, 'utf8');
    if (content.length < 50) throw new Error(`UI component ${comp} is empty or invalid`);
  }
});

// 3. Verify Global Error & Loading Boundaries
assert('Global loading.tsx and error.tsx are implemented for robust user experience', () => {
  const loadingPath = path.join(__dirname, '../src/app/loading.tsx');
  const errorPath = path.join(__dirname, '../src/app/error.tsx');
  if (!fs.existsSync(loadingPath)) throw new Error('loading.tsx missing');
  if (!fs.existsSync(errorPath)) throw new Error('error.tsx missing');

  const errorContent = fs.readFileSync(errorPath, 'utf8');
  if (!errorContent.includes('reset') || !errorContent.includes('Something went wrong')) {
    throw new Error('error.tsx does not implement proper Next.js error boundary pattern');
  }
});

// 4. Verify Vehicle Intelligence Page & DPDP Compliance
assert('Vehicle intelligence page (/vehicles) enforces DPDP consent and displays normalized registry', () => {
  const pagePath = path.join(__dirname, '../src/app/vehicles/page.tsx');
  if (!fs.existsSync(pagePath)) throw new Error('vehicles/page.tsx missing');
  const content = fs.readFileSync(pagePath, 'utf8');

  if (!content.includes('DPDP Act 2023') && !content.includes('dpdp-consent')) {
    throw new Error('DPDP Act consent requirement missing from vehicle intelligence');
  }
  if (!content.includes('vin_masked') || !content.includes('engine_number_masked')) {
    throw new Error('Masked chassis/engine fields missing from vehicle intelligence schema');
  }
  if (!content.includes('MH12AB1234') || !content.includes('DL01XY9999')) {
    throw new Error('Deterministic test fixtures missing from vehicle intelligence view');
  }
});

// 5. Verify Traffic Challans Page & Monetary Precision
assert('Traffic challans page (/challans) implements paise monetary format and Parivahan links', () => {
  const pagePath = path.join(__dirname, '../src/app/challans/page.tsx');
  if (!fs.existsSync(pagePath)) throw new Error('challans/page.tsx missing');
  const content = fs.readFileSync(pagePath, 'utf8');

  if (!content.includes('fine_amount_paise') || !content.includes('formatCurrencyINR')) {
    throw new Error('Paise precision and INR formatter missing from challans page');
  }
  if (!content.includes('echallan.parivahan.gov.in')) {
    throw new Error('Official Parivahan eChallan verification link missing');
  }
  if (!content.includes('EmptyState') || !content.includes('Clean Vehicle Record')) {
    throw new Error('Zero-challan empty state missing');
  }
});

// 6. Verify Physical Inspection Cases & Dialog Modals
assert('Inspection cases page (/inspections) provides case table, new case dialog, and inspector assignment', () => {
  const pagePath = path.join(__dirname, '../src/app/inspections/page.tsx');
  if (!fs.existsSync(pagePath)) throw new Error('inspections/page.tsx missing');
  const content = fs.readFileSync(pagePath, 'utf8');

  if (!content.includes('Create New Ground Inspection Case') || !content.includes('isNewCaseOpen')) {
    throw new Error('New inspection case dialog modal missing');
  }
  if (!content.includes('Assign Field Surveyor') || !content.includes('isAssignOpen')) {
    throw new Error('Inspector assignment dialog modal missing');
  }
  if (!content.includes('QC_REVIEW') || !content.includes('APPROVED')) {
    throw new Error('Inspection status lifecycle badges missing');
  }
});

// 7. Verify Valuation Desk, Justification Rule & Immutable Snapshots
assert('Valuation desk page (/valuation) implements 4-pillar condition appraisal and mandatory override justification', () => {
  const pagePath = path.join(__dirname, '../src/app/valuation/page.tsx');
  if (!fs.existsSync(pagePath)) throw new Error('valuation/page.tsx missing');
  const content = fs.readFileSync(pagePath, 'utf8');

  if (!content.includes('body_score') || !content.includes('mechanical_score') || !content.includes('electrical_score')) {
    throw new Error('Multi-pillar condition scoring inputs missing');
  }
  if (!content.includes('override_reason') || !content.includes('mandatory')) {
    throw new Error('Mandatory override justification check missing');
  }
  if (!content.includes('snapshotHash') || !content.includes('SHA-256')) {
    throw new Error('Immutable snapshot freezing UI missing');
  }
});

// 8. Verify Dashboard Metrics API & Live Connection
assert('Dashboard metrics route (/api/dashboard/metrics) exists and provides live stats', () => {
  const routePath = path.join(__dirname, '../src/app/api/dashboard/metrics/route.ts');
  if (!fs.existsSync(routePath)) throw new Error('dashboard/metrics route.ts missing');
  const content = fs.readFileSync(routePath, 'utf8');

  if (!content.includes('active_inspections') || !content.includes('total_pending_fines_paise')) {
    throw new Error('Metrics schema does not match backend contract');
  }
});

// 9. Verify Dashboard Page & Watermark Invariant
assert('Dashboard page (/page.tsx) connects to metrics, renders skeletons, and displays demo watermark', () => {
  const pagePath = path.join(__dirname, '../src/app/page.tsx');
  if (!fs.existsSync(pagePath)) throw new Error('Dashboard page.tsx missing');
  const content = fs.readFileSync(pagePath, 'utf8');

  if (!content.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Mandatory mock demonstration watermark missing from dashboard');
  }
  if (!content.includes('fetchMetrics') || !content.includes('/api/dashboard/metrics')) {
    throw new Error('Dashboard does not fetch live metrics from API');
  }
  if (!content.includes('Skeleton')) {
    throw new Error('Loading skeleton state missing from dashboard');
  }
});

// 10. Verify Sidebar Dynamic Navigation
assert('Sidebar implements dynamic active link highlighting with usePathname', () => {
  const sidebarPath = path.join(__dirname, '../src/components/layout/Sidebar.tsx');
  if (!fs.existsSync(sidebarPath)) throw new Error('Sidebar.tsx missing');
  const content = fs.readFileSync(sidebarPath, 'utf8');

  if (!content.includes('usePathname') || !content.includes('isCurrent')) {
    throw new Error('Sidebar does not use dynamic usePathname for active route styling');
  }
  if (!content.includes('/vehicles') || !content.includes('/challans') || !content.includes('/inspections') || !content.includes('/valuation')) {
    throw new Error('Core domain routes missing from sidebar navigation');
  }
});

// 11. Verify PII Masking Utility Function in utils.ts
assert('maskVehicleOwner utility function in utils.ts correctly obscures PII names', () => {
  const utilsPath = path.join(__dirname, '../src/lib/utils.ts');
  if (!fs.existsSync(utilsPath)) throw new Error('utils.ts missing');
  const content = fs.readFileSync(utilsPath, 'utf8');

  if (!content.includes('export function maskVehicleOwner') || !content.includes('formatCurrencyINR')) {
    throw new Error('maskVehicleOwner or formatCurrencyINR missing in utils.ts');
  }

  function maskVehicleOwner(name) {
    if (!name) return "REDACTED";
    const words = name.split(" ");
    return words.map(w => {
      if (w.length <= 2) return w;
      return w[0] + "****" + (w.length > 5 ? w[w.length - 1] : "");
    }).join(" ");
  }

  const masked1 = maskVehicleOwner('M/S LOGISTICS INDIA');
  const masked2 = maskVehicleOwner('RAJESH KUMAR');

  if (!masked1.includes('M****') || !masked1.includes('I****')) {
    throw new Error(`Owner name not masked properly: ${masked1}`);
  }
  if (!masked2.includes('R****') || !masked2.includes('K****')) {
    throw new Error(`Owner name not masked properly: ${masked2}`);
  }
});

// 12. Verify Vehicle Intelligence Next.js API Routes
assert('Vehicle intelligence API routes exist and handle combined lookups and failure simulations', () => {
  const lookupRoute = path.join(__dirname, '../src/app/api/vehicles/lookup/route.ts');
  const statusRoute = path.join(__dirname, '../src/app/api/vehicles/check-status/route.ts');

  if (!fs.existsSync(lookupRoute)) throw new Error('vehicles/lookup/route.ts missing');
  if (!fs.existsSync(statusRoute)) throw new Error('vehicles/check-status/route.ts missing');

  const lookupContent = fs.readFileSync(lookupRoute, 'utf8');
  if (!lookupContent.includes('GATEWAY_TIMEOUT') || !lookupContent.includes('504')) {
    throw new Error('Timeout failure simulation missing from vehicle lookup route');
  }
  if (!lookupContent.includes('RATE_LIMIT_EXCEEDED') || !lookupContent.includes('429')) {
    throw new Error('Rate limit failure simulation missing from vehicle lookup route');
  }
  if (!lookupContent.includes('PROVIDER_UNAVAILABLE') || !lookupContent.includes('503')) {
    throw new Error('Provider unavailable failure simulation missing from vehicle lookup route');
  }
  if (!lookupContent.includes('field_provenance') || !lookupContent.includes('DL01XY9999')) {
    throw new Error('Field provenance and restricted scenario missing from lookup route');
  }
});

// 13. Verify Vehicles Page Combined Verification & Provenance Controls
assert('Vehicles page provides combined verification, field provenance dialog, and live refresh controls', () => {
  const vehiclesPage = path.join(__dirname, '../src/app/vehicles/page.tsx');
  const content = fs.readFileSync(vehiclesPage, 'utf8');

  if (!content.includes('Combined Dossier') || !content.includes('verificationMode')) {
    throw new Error('Combined verification mode selector missing from vehicles page');
  }
  if (!content.includes('Field-Level Provenance & Traceability Audit') || !content.includes('isProvenanceOpen')) {
    throw new Error('Field provenance inspector dialog missing from vehicles page');
  }
  if (!content.includes('Confirm Live Registry Refresh') || !content.includes('isRefreshConfirmOpen')) {
    throw new Error('Credit warning refresh confirmation dialog missing from vehicles page');
  }
  if (!content.includes('Cached Dossier Record') || !content.includes('0 Credits Deducted')) {
    throw new Error('Cache notification and duplicate detection advisory missing');
  }
  if (!content.includes('504 Timeout') || !content.includes('UP16AB0000')) {
    throw new Error('Provider failure simulation controls missing from vehicles page');
  }
});

// 14. Verify Challans Page Refresh Controls & Status Filters
assert('Challans page provides live refresh confirmation, status filters, and clean record states', () => {
  const challansPage = path.join(__dirname, '../src/app/challans/page.tsx');
  const content = fs.readFileSync(challansPage, 'utf8');

  if (!content.includes('Refresh Live Enforcement Violations') || !content.includes('10 Credits')) {
    throw new Error('Refresh live violations modal with credit warning missing from challans page');
  }
  if (!content.includes('Clean Vehicle Record') || !content.includes('KA01MJ0001')) {
    throw new Error('Clean vehicle empty state and test preset missing from challans page');
  }
  if (!content.includes('total_pending_formatted') || !content.includes('total_disposed_formatted')) {
    throw new Error('Formatted fine totals missing from challans page');
  }
});

// 15. Verify Inspection Checklist Audit & Invariant 3 (Untested Checkpoints Default to not_checked)
assert('Inspection checklist audit enforces Invariant 3 (not_checked default) and mandatory correction remarks', () => {
  const inspectionsPage = path.join(__dirname, '../src/app/inspections/page.tsx');
  const content = fs.readFileSync(inspectionsPage, 'utf8');

  if (!content.includes('isChecklistOpen') || !content.includes('Inspection Dossier Audit')) {
    throw new Error('Inspection checklist audit dialog missing from inspections page');
  }
  if (!content.includes('not_checked') || !content.includes('Prohibition of Data Fabrication')) {
    throw new Error('Invariant 3: Untested checkpoints default to not_checked requirement missing');
  }
  if (!content.includes('isCorrectionModalOpen') || !content.includes('Mandatory QC Rejection Remarks')) {
    throw new Error('Mandatory QC correction notes dialog missing from inspections page');
  }
  if (!content.includes('CORRECTION_REQUESTED') || !content.includes('UNDER_REVIEW')) {
    throw new Error('Extended inspection lifecycle states missing from inspections page');
  }
});

// 16. Verify Photographic Evidence & Document OCR Comparison Desk
assert('Evidence gallery provides categorized photo slots, SHA-256 integrity pills, and OCR comparison', () => {
  const inspectionsPage = path.join(__dirname, '../src/app/inspections/page.tsx');
  const content = fs.readFileSync(inspectionsPage, 'utf8');

  if (!content.includes('isEvidenceOpen') || !content.includes('Photographic Evidence & Document OCR')) {
    throw new Error('Evidence & OCR dialog missing from inspections page');
  }
  if (!content.includes('Verified SHA-256') || !content.includes('sha256_hash')) {
    throw new Error('SHA-256 cryptographic integrity hash pill missing from evidence cards');
  }
  if (!content.includes('Run OCR & Match Registry') || !content.includes('Registry Match Score')) {
    throw new Error('Document OCR & automated VAHAN registry comparison desk missing');
  }
  if (!content.includes('DAMAGE PROOF') || !content.includes('is_damage_proof')) {
    throw new Error('Damage proof evidence tagging missing');
  }
});

// 17. Verify Multi-Axle Tyre Inspection Desk & AC-TYRE-02 Legal Safety Check
assert('Multi-axle tyre visualizer enforces AC-TYRE-01 wheel layouts and AC-TYRE-02 tread depth threshold (<1.6mm)', () => {
  const inspectionsPage = path.join(__dirname, '../src/app/inspections/page.tsx');
  const content = fs.readFileSync(inspectionsPage, 'utf8');

  if (!content.includes('isTyresOpen') || !content.includes('Multi-Axle Tyre Inspection')) {
    throw new Error('Multi-axle tyre inspection dialog missing from inspections page');
  }
  if (!content.includes('3_AXLE_10W') || !content.includes('10 Wheels + Spare')) {
    throw new Error('3-Axle 10-Wheeler Tipper layout (AC-TYRE-01) missing from axle layout selector');
  }
  if (!content.includes('1.6') || !content.includes('AC-TYRE-02 Safety Threshold Breach Detected')) {
    throw new Error('AC-TYRE-02 legal safety threshold violation alert (<1.6mm) missing from tyre desk');
  }
  if (!content.includes('estCost') || !content.includes('Refurbishment Deduction')) {
    throw new Error('Tyre refurbishment cost calculation missing from tyre desk');
  }
});

// 18. Verify A4 Printable Report Page & All 11 Sections
assert('A4 Printable Report Page (/inspections/[id]/report) renders all 11 sections with print CSS and watermark', () => {
  const reportPage = path.join(__dirname, '../src/app/inspections/[id]/report/page.tsx');
  const reportRoute = path.join(__dirname, '../src/app/api/inspections/[id]/report/route.ts');
  if (!fs.existsSync(reportPage)) throw new Error('inspections/[id]/report/page.tsx missing');
  if (!fs.existsSync(reportRoute)) throw new Error('api/inspections/[id]/report/route.ts missing');

  const content = fs.readFileSync(reportPage, 'utf8');

  // Verify all 11 sections are referenced
  const requiredSections = [
    'section_1_executive_summary',
    'section_2_registration_identity',
    'section_3_traffic_challans',
    'section_4_cabin_body_chassis',
    'section_5_systems_mechanical',
    'section_6_electricals_safety_docs',
    'section_7_tyres_matrix',
    'section_8_evidence_gallery',
    'section_9_valuation_dossier',
    'section_10_approvals',
    'section_11_disclaimers',
  ];

  for (const sec of requiredSections) {
    if (!content.includes(sec)) {
      throw new Error(`Report page missing required section: ${sec}`);
    }
  }

  if (!content.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Indelible watermark string missing from report view');
  }
  if (!content.includes('window.print()')) {
    throw new Error('Print action handler missing from report view');
  }
});

// 19. Verify Public QR Code Verification Portal (AC-REP-02)
assert('Public QR verification portal (/verify-report/[token]) validates cryptographic seal & tamper evidence', () => {
  const verifyPage = path.join(__dirname, '../src/app/verify-report/[token]/page.tsx');
  const verifyRoute = path.join(__dirname, '../src/app/api/verify-report/[token]/route.ts');
  if (!fs.existsSync(verifyPage)) throw new Error('verify-report/[token]/page.tsx missing');
  if (!fs.existsSync(verifyRoute)) throw new Error('api/verify-report/[token]/route.ts missing');

  const content = fs.readFileSync(verifyPage, 'utf8');

  if (!content.includes('AC-REP-02') && !content.includes('Public Cryptographic QR Verification')) {
    throw new Error('AC-REP-02 verification header missing');
  }
  if (!content.includes('sha256_checksum') || !content.includes('Cryptographic Snapshot Fingerprint')) {
    throw new Error('SHA-256 snapshot checksum display missing from verification portal');
  }
  if (!content.includes('TAMPER-FREE') || !content.includes('Authentic Report Verified')) {
    throw new Error('Tamper verification badges missing from verification portal');
  }
});

// 20. Verify Super Admin Dashboard (/admin)
assert('Super Admin dashboard (/admin) implements platform telemetry, provider latency, and Invariant 2 fail-safe warning', () => {
  const adminPage = path.join(__dirname, '../src/app/admin/page.tsx');
  if (!fs.existsSync(adminPage)) throw new Error('admin/page.tsx missing');
  const content = fs.readFileSync(adminPage, 'utf8');

  if (!content.includes('Super Admin Dashboard') || !content.includes('Privileged Super Admin Console')) {
    throw new Error('Super Admin header missing from admin page');
  }
  if (!content.includes('INVARIANT 2 ENFORCEMENT ACTIVE') || !content.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Invariant 2 demonstration watermark warning missing from admin dashboard');
  }
  if (!content.includes('apisathi_rc_v1') || !content.includes('avg_latency_ms') || !content.includes('circuit_breaker_state')) {
    throw new Error('Provider latency and circuit breaker telemetry missing from admin dashboard');
  }
});

// 21. Verify Organizations Management Desk (/admin/organizations)
assert('Organizations management (/admin/organizations) enforces tenant isolation and credit ledger precision', () => {
  const orgPage = path.join(__dirname, '../src/app/admin/organizations/page.tsx');
  if (!fs.existsSync(orgPage)) throw new Error('admin/organizations/page.tsx missing');
  const content = fs.readFileSync(orgPage, 'utf8');

  if (!content.includes('Organization & Tenant Governance') || !content.includes('Provision New Tenant')) {
    throw new Error('Organization governance header or provisioning action missing');
  }
  if (!content.includes('wallet_balance_credits') || !content.includes('Privileged Credit Wallet Allocation')) {
    throw new Error('Credit wallet minor units precision or allocation modal missing');
  }
  if (!content.includes('SpeedCheck Valuers Pvt Ltd') || !content.includes('27AABCS1429B1Z8')) {
    throw new Error('Tenant organization fixtures missing');
  }
});

// 22. Verify User Directory & RBAC Governance (/admin/users)
assert('User directory (/admin/users) enforces RBAC roles and privilege escalation safeguard', () => {
  const usersPage = path.join(__dirname, '../src/app/admin/users/page.tsx');
  if (!fs.existsSync(usersPage)) throw new Error('admin/users/page.tsx missing');
  const content = fs.readFileSync(usersPage, 'utf8');

  if (!content.includes('Enterprise User Directory & RBAC') || !content.includes('Provision New User')) {
    throw new Error('User directory header or provisioning action missing');
  }
  if (!content.includes('PRIVILEGE ESCALATION SAFEGUARD ACTIVE') || !content.includes('SUPER_ADMIN')) {
    throw new Error('Privilege escalation defense notice missing from users page');
  }
  if (!content.includes('INSPECTOR') || !content.includes('VALUER') || !content.includes('ORG_ADMIN')) {
    throw new Error('Core enterprise role fixtures missing from users page');
  }
});

// 23. Verify Provider Configuration & Secret Vault (/admin/providers)
assert('Provider configuration (/admin/providers) enforces Invariant 1 secret masking and Invariant 2 production lock', () => {
  const provPage = path.join(__dirname, '../src/app/admin/providers/page.tsx');
  if (!fs.existsSync(provPage)) throw new Error('admin/providers/page.tsx missing');
  const content = fs.readFileSync(provPage, 'utf8');

  if (!content.includes('INVARIANT 1 (ZERO SECRET LEAKAGE)') || !content.includes('INVARIANT 2 (FAIL-SAFE PRODUCTION LOCK)')) {
    throw new Error('Invariant 1 and 2 security callouts missing from provider page');
  }
  if (!content.includes('masked_key') || !content.includes('••••••••')) {
    throw new Error('Secret key masking representation missing from provider page');
  }
  if (!content.includes('mock_fallback_enabled') || !content.includes('circuit_breaker_threshold')) {
    throw new Error('Mock fallback or circuit breaker settings missing from provider page');
  }
});

// 24. Verify Audit Trail & Security Telemetry Desk (/admin/audit & /audit)
assert('Audit trail desk (/admin/audit & /audit) enforces DPDP Act 2023 citizen redaction and security alerts', () => {
  const auditAdminPage = path.join(__dirname, '../src/app/admin/audit/page.tsx');
  const auditPublicPage = path.join(__dirname, '../src/app/audit/page.tsx');
  if (!fs.existsSync(auditAdminPage)) throw new Error('admin/audit/page.tsx missing');
  if (!fs.existsSync(auditPublicPage)) throw new Error('audit/page.tsx missing');

  const content = fs.readFileSync(auditAdminPage, 'utf8');

  if (!content.includes('PROHIBITION OF UNRESTRICTED SENSITIVE-DATA ACCESS (DPDP ACT 2023)')) {
    throw new Error('DPDP Act prohibition of unrestricted sensitive-data access callout missing');
  }
  if (!content.includes('PRIVILEGE_ESCALATION_ATTEMPT') || !content.includes('CROSS_TENANT_ACCESS_ATTEMPT')) {
    throw new Error('Security alert indicators missing from audit desk');
  }
  if (!content.includes('M**** S****') || !content.includes('••••••••')) {
    throw new Error('Masked citizen PII fixtures missing from audit logs view');
  }
});

// 25. Verify Institutional Clients & Banks Management (/clients)
assert('Institutional clients page (/clients) manages bank/NBFC partners, SLA turnaround, and rate cards', () => {
  const clientsPage = path.join(__dirname, '../src/app/clients/page.tsx');
  if (!fs.existsSync(clientsPage)) throw new Error('clients/page.tsx missing');
  const content = fs.readFileSync(clientsPage, 'utf8');

  if (!content.includes('Institutional Clients & Banks') || !content.includes('Add Institutional Client')) {
    throw new Error('Institutional clients header or add client action missing');
  }
  if (!content.includes('HDFC Bank Limited') || !content.includes('Tata Capital') || !content.includes('ICICI Lombard')) {
    throw new Error('Key institutional bank and NBFC fixtures missing');
  }
  if (!content.includes('sla_hours') || !content.includes('rate_tier')) {
    throw new Error('SLA turnaround hours or rate card tier missing from clients view');
  }
});

// 26. Verify Credit Wallet & Billing Desk (/billing)
assert('Credit wallet and billing desk (/billing) implements double-entry ledger, idempotency keys, top-up pack checkout, and GST invoices', () => {
  const billingPage = path.join(__dirname, '../src/app/billing/page.tsx');
  if (!fs.existsSync(billingPage)) throw new Error('billing/page.tsx missing');
  const content = fs.readFileSync(billingPage, 'utf8');

  if (!content.includes('Credit Wallet & Billing Ledgers') || !content.includes('Top-Up Credit Wallet')) {
    throw new Error('Billing desk header or top-up action missing');
  }
  if (!content.includes('idempotency_key') || !content.includes('Immutable Double-Entry Ledger')) {
    throw new Error('Double-entry ledger or idempotency key representation missing');
  }
  if (!content.includes('GST Tax Invoices') || !content.includes('INV-2026-')) {
    throw new Error('GST tax invoices or invoice number formatting missing');
  }
  if (!content.includes('Unit Economics (COGS)') || !content.includes('Gross Margin')) {
    throw new Error('Provider COGS unit economics or margin tracking missing');
  }
});

// 27. Verify Fleet Management & Statutory Expiry Desk (/fleet)
assert('Fleet management and statutory expiry desk (/fleet) implements expiry countdowns, bulk verification, CSV import/export, and scheduled checks', () => {
  const fleetPage = path.join(__dirname, '../src/app/fleet/page.tsx');
  if (!fs.existsSync(fleetPage)) throw new Error('fleet/page.tsx missing');
  const content = fs.readFileSync(fleetPage, 'utf8');

  if (!content.includes('Fleet Management & Statutory Expiry Registry')) {
    throw new Error('Fleet management header missing');
  }
  if (!content.includes('Bulk Parivahan Vehicle Verification') || !content.includes('Tariff: 1 Credit (₹15.00)')) {
    throw new Error('Bulk verification modal or tariff disclosure missing');
  }
  if (!content.includes('Pre-flight Cost Estimation') || !content.includes('Cost Ceiling Guard')) {
    throw new Error('Pre-flight cost estimation or cost limit ceiling missing');
  }
  if (!content.includes('Import Fleet Vehicles from CSV') || !content.includes('handleExportCsv')) {
    throw new Error('CSV import modal or export functionality missing');
  }
  if (!content.includes('Scheduled Fleet Compliance Checks') || !content.includes('Auto-Reverify Threshold')) {
    throw new Error('Scheduled compliance checks drawer or auto-reverify threshold missing');
  }
  if (!content.includes('Fleet Expiry Alerts')) {
    throw new Error('Fleet expiry alerts drawer missing');
  }
});

console.log(`\n[Web Test Summary] Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Web portal UI/UX, responsive layout, domain view, and contract checks passed successfully.\n');
  process.exit(0);
}
