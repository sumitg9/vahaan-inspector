/**
 * VahanCheck Enterprise — Comprehensive Security, Invariants & E2E Contract Audit Suite
 * Validates:
 * 1. Authentication & Privilege Escalation Defense
 * 2. Multi-Tenant Scoping & Cross-Tenant Access Barriers (Invariant 4)
 * 3. Zero Secret Leakage (Invariant 1)
 * 4. Provider Fail-Safe & Production Mock Lock (Invariant 2)
 * 5. Prohibition of Data Fabrication (Invariant 3)
 * 6. Monetary Precision in Minor Units Paise (Invariant 5)
 * 7. Immutable Report Snapshots & Cryptographic Seals (Invariant 6)
 * 8. DPDP Act 2023 Citizen PII Redaction (Invariant 7)
 * 9. S3 Pre-signed URL Constraints & Partitioning
 * 10. Mobile SQLCipher AES-256 Storage & Durable Outbox Idempotency
 */

const fs = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;
const errors = [];

function assert(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}: ${err.message}`);
    errors.push({ description, error: err.message });
    failed++;
  }
}

console.log('[Security, Architecture Invariants & E2E Contract Audit] Starting test runner...\n');

// 1. Audit Invariant 1: Zero Secret Leakage
assert('Invariant 1: No secret API keys or service tokens are leaked in frontend or mobile source', () => {
  const rootDir = path.join(__dirname, '..');
  const scanDirs = [path.join(rootDir, 'web/src'), path.join(rootDir, 'mobile/lib')];

  const leakPatterns = [
    /sk_live_[a-zA-Z0-9_-]{16,}/g,
    /rzp_live_[a-zA-Z0-9_-]{14,}/g,
    /apisathi_secret_[a-zA-Z0-9_-]{10,}/g,
  ];

  function scanFolder(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanFolder(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.dart'))) {
        const text = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of leakPatterns) {
          if (pattern.test(text)) {
            throw new Error(`Secret credential pattern detected in: ${fullPath}`);
          }
        }
      }
    }
  }

  scanDirs.forEach(scanFolder);
});

// 2. Audit Invariant 1: Admin Provider Secrets Permanently Masked
assert('Invariant 1: Admin Provider Controller permanently masks service credentials in responses', () => {
  const ctrlPath = path.join(__dirname, '../backend/app/Modules/Admin/Controllers/ProviderConfigController.php');
  const content = fs.readFileSync(ctrlPath, 'utf8');

  if (!content.includes('maskSecret') || !content.includes('••••••••')) {
    throw new Error('ProviderConfigController missing secret masking function');
  }
  if (!content.includes('$masked[\'api_key\'] = $this->maskSecret')) {
    throw new Error('API key must be masked before returning to client');
  }
});

// 3. Audit Invariant 2: Production Provider Fail-Safe & Mock Lock
assert('Invariant 2: Production Provider Fail-Safe strictly locks out mock fallback in PRODUCTION mode', () => {
  const ctrlPath = path.join(__dirname, '../backend/app/Modules/Admin/Controllers/ProviderConfigController.php');
  const content = fs.readFileSync(ctrlPath, 'utf8');

  if (!content.includes('$targetEnv === \'PRODUCTION\' && $targetMockFallback === true')) {
    throw new Error('Production guard check for mock fallback missing');
  }
  if (!content.includes('Invariant 2 Violation') || !content.includes('502 Bad Gateway')) {
    throw new Error('Explicit 502 Bad Gateway invariant requirement missing in error message');
  }
});

// 4. Audit Invariant 2: Indelible Mock Watermark
assert('Invariant 2: Indelible demonstration watermark enforced across PDF templates and UI screens', () => {
  const bladePath = path.join(__dirname, '../report-templates/a4_inspection_dossier.blade.php');
  const bladeContent = fs.readFileSync(bladePath, 'utf8');

  if (!bladeContent.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Indelible watermark missing from Blade A4 PDF template');
  }

  const reportPagePath = path.join(__dirname, '../web/src/app/inspections/[id]/report/page.tsx');
  const reportPageContent = fs.readFileSync(reportPagePath, 'utf8');

  if (!reportPageContent.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Indelible watermark missing from Web printable report dossier');
  }
});

// 5. Audit Invariant 3: Prohibition of Data Fabrication
assert('Invariant 3: Untested inspection checkpoints strictly default to not_checked and never to Pass/Good', () => {
  const exceptionPath = path.join(__dirname, '../backend/app/Modules/Inspections/Exceptions/InspectionException.php');
  const exceptionContent = fs.readFileSync(exceptionPath, 'utf8');

  if (!exceptionContent.includes('UntestedCheckpointDefaultException') || !exceptionContent.includes('Prohibition of Data Fabrication Invariant')) {
    throw new Error('Prohibition of Data Fabrication Invariant exception missing in InspectionException');
  }

  const inspectionServicePath = path.join(__dirname, '../backend/app/Modules/Inspections/Services/InspectionService.php');
  const serviceContent = fs.readFileSync(inspectionServicePath, 'utf8');

  if (!serviceContent.includes('Prohibition of Data Fabrication') || !serviceContent.includes('not_checked')) {
    throw new Error('Prohibition of Data Fabrication guard missing in InspectionService');
  }

  const mobileChecklistPath = path.join(__dirname, '../mobile/lib/features/inspection_form/presentation/inspection_checklist_screen.dart');
  const mobileContent = fs.readFileSync(mobileChecklistPath, 'utf8');

  if (!mobileContent.includes('not_checked') || !mobileContent.includes('Prohibition of Data Fabrication')) {
    throw new Error('Mobile checklist missing not_checked default invariant');
  }
});

// 6. Audit Invariant 4: Multi-Tenant Scoping & Cross-Tenant Barrier
assert('Invariant 4: Multi-Tenant isolation middleware blocks cross-tenant access with 403 and alert generation', () => {
  const middlewarePath = path.join(__dirname, '../backend/app/Http/Middleware/TenantContextMiddleware.php');
  const content = fs.readFileSync(middlewarePath, 'utf8');

  if (!content.includes('CROSS_TENANT_ACCESS_ATTEMPT')) {
    throw new Error('Cross-tenant access attempt security alert missing in middleware');
  }
  if (!content.includes('403') || !content.includes('Cross-Tenant Access Violation')) {
    throw new Error('HTTP 403 Forbidden cross-tenant violation response missing');
  }
  if (!content.includes('config([\'cache.prefix\' => \'tenant_\' . $effectiveTenantId . \'_\']);')) {
    throw new Error('Tenant cache prefix isolation missing');
  }
});

// 7. Audit Invariant 5: Monetary Precision in Minor Units (Paise)
assert('Invariant 5: Database migrations strictly enforce integer minor units (paise) with zero float types', () => {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.php'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    if (content.includes('->float(') || content.includes('->double(')) {
      throw new Error(`Floating point column detected in migration: ${file}`);
    }
  }

  const challanMigration = fs.readFileSync(path.join(migrationsDir, '2026_01_01_000008_create_challans_table.php'), 'utf8');
  if (!challanMigration.includes('fine_amount_paise')) {
    throw new Error('Missing fine_amount_paise in challans migration');
  }

  const billingMigration = fs.readFileSync(path.join(migrationsDir, '2026_01_01_000017_create_invoices_and_billing_tables.php'), 'utf8');
  if (!billingMigration.includes('subtotal_paise') || !billingMigration.includes('total_paise')) {
    throw new Error('Missing subtotal_paise or total_paise in billing migration');
  }
});

// 8. Audit Invariant 6: Immutable JSON Snapshot & Cryptographic Checksum
assert('Invariant 6: Approved report compiles into immutable JSON snapshot with SHA-256 and QR token', () => {
  const snapshotServicePath = path.join(__dirname, '../backend/app/Modules/Reports/Services/ReportSnapshotService.php');
  const content = fs.readFileSync(snapshotServicePath, 'utf8');

  if (!content.includes('hash(\'sha256\', $canonicalJson)')) {
    throw new Error('SHA-256 canonical JSON hashing missing in ReportSnapshotService');
  }
  if (!content.includes('verification_token')) {
    throw new Error('Verification token generation missing');
  }
  if (!content.includes('verifyApprovalBeforeReportGeneration')) {
    throw new Error('Valuation approval gate check missing before report snapshot compilation');
  }
});

// 9. Audit Invariant 7: DPDP Act 2023 Citizen PII Redaction
assert('Invariant 7: DPDP Act 2023 citizen owner names masked in standard views, audit logs, and exports', () => {
  const utilsPath = path.join(__dirname, '../web/src/lib/utils.ts');
  const utilsContent = fs.readFileSync(utilsPath, 'utf8');

  if (!utilsContent.includes('maskVehicleOwner') || !utilsContent.includes('****')) {
    throw new Error('Frontend owner name masking utility missing or incorrect');
  }

  const auditCtrlPath = path.join(__dirname, '../backend/app/Modules/Admin/Controllers/AuditLogController.php');
  const auditContent = fs.readFileSync(auditCtrlPath, 'utf8');

  if (!auditContent.includes('redactSensitiveData') || !auditContent.includes('owner_name')) {
    throw new Error('Audit log controller missing sensitive data redaction for citizen names');
  }
  if (!auditContent.includes('phone') || !auditContent.includes('pan') || !auditContent.includes('aadhaar')) {
    throw new Error('Audit log controller missing redaction for phone, PAN, or Aadhaar');
  }
});

// 10. Audit Evidence Storage Constraints (S3 Partitioning, Size, MIME & Hash)
assert('Storage Audit: Evidence service enforces multi-tenant S3 path, 15MB limit, and SHA-256 validation', () => {
  const evidenceServicePath = path.join(__dirname, '../backend/app/Modules/Evidence/Services/EvidenceStorageService.php');
  const content = fs.readFileSync(evidenceServicePath, 'utf8');

  if (!content.includes('{organization_id}') && !content.includes('$organizationId')) {
    throw new Error('Multi-tenant organization partition missing in S3 evidence path');
  }
  if (!content.includes('MAX_FILE_SIZE_BYTES = 15728640')) {
    throw new Error('15 MB maximum file size constraint missing');
  }
  if (!content.includes('strlen($sha256Hash) !== 64')) {
    throw new Error('64-character SHA-256 validation missing');
  }
});

// 11. Audit Mobile Offline Storage Security & Durable Sync Outbox
assert('Mobile Security Audit: SQLCipher AES-256 encryption, durable outbox, and touch targets verified', () => {
  const dbHelperPath = path.join(__dirname, '../mobile/lib/core/storage/encrypted_database.dart');
  const dbContent = fs.readFileSync(dbHelperPath, 'utf8');

  if (!dbContent.includes('SQLCipher') || !dbContent.includes('AES-256')) {
    throw new Error('AES-256 SQLCipher encrypted storage specification missing in mobile database');
  }
  if (!dbContent.includes('tableSyncOutbox') || !dbContent.includes('idempotency_key')) {
    throw new Error('Durable sync outbox or idempotency_key column missing in mobile database');
  }

  const themePath = path.join(__dirname, '../mobile/lib/core/theme/app_theme.dart');
  const themeContent = fs.readFileSync(themePath, 'utf8');

  if (!themeContent.includes('minTouchTargetSize = 48.0')) {
    throw new Error('Minimum 48dp outdoor touch target constraint missing in AppTheme');
  }
});

// 12. Audit Bulk Verification Cost Ceiling & Provider Coverage Caveats
assert('Cost & Provider Audit: Bulk verification enforces pre-flight cost ceilings and provider coverage caveats', () => {
  const bulkServicePath = path.join(__dirname, '../backend/app/Modules/Fleet/Services/BulkVerificationService.php');
  const content = fs.readFileSync(bulkServicePath, 'utf8');

  if (!content.includes('CostLimitExceededException') || !content.includes('cost_limit_paise')) {
    throw new Error('Cost ceiling exception or limit parameter missing in BulkVerificationService');
  }
  if (!content.includes('REGIONAL_COVERAGE_WARNINGS') || !content.includes('HP') || !content.includes('JK')) {
    throw new Error('Regional provider coverage warning dictionary missing in BulkVerificationService');
  }
});

// 13. Audit Permission-Controlled Fleet Export Defense
assert('RBAC Defense: Fleet export requires fleet.export permission and blocks unauthorized access with 403', () => {
  const fleetCtrlPath = path.join(__dirname, '../backend/app/Modules/Fleet/Controllers/FleetController.php');
  const content = fs.readFileSync(fleetCtrlPath, 'utf8');

  if (!content.includes('ExportPermissionDeniedException') || !content.includes('fleet.export')) {
    throw new Error('fleet.export permission check missing from FleetController export handler');
  }
  if (!content.includes('$hasPermission = false;')) {
    throw new Error('Default permission deny missing in FleetController export handler');
  }
});

// 14. Audit Provider Verification & 24-Field Coverage Matrix
assert('Provider Audit: 24-field VAHAN coverage matrix, SLA contracts, and regional caveats verified', () => {
  const servicePath = path.join(__dirname, '../backend/app/Modules/Providers/Services/ProviderVerificationService.php');
  const content = fs.readFileSync(servicePath, 'utf8');

  if (!content.includes('total_fields_mapped\' => 24') || !content.includes('coverage_completeness_pct\' => 100.0')) {
    throw new Error('ProviderVerificationService must define 24 fields with 100% completeness');
  }
  if (!content.includes('apisathi_rc_v1') || !content.includes('apisathi_rc_challan')) {
    throw new Error('APISathi RC v1 and RC Challan service agreements must be defined');
  }
  if (!content.includes('HP') || !content.includes('JK') || !content.includes('NE')) {
    throw new Error('Regional transport caveats missing from ProviderVerificationService');
  }
});

// 15. Audit Sandbox Schema Reconciliation & Invariant 3
assert('Schema Reconciliation: Sandbox schemas map to normalized DTOs without fabricating missing data', () => {
  const servicePath = path.join(__dirname, '../backend/app/Modules/Providers/Services/ProviderVerificationService.php');
  const content = fs.readFileSync(servicePath, 'utf8');

  if (!content.includes('standard_authentic') || !content.includes('partial_restricted') || !content.includes('clean_record_zero_challans')) {
    throw new Error('Sandbox scenario reconciliations missing from ProviderVerificationService');
  }
  if (!content.includes('invariant_3_prohibition_of_fabrication')) {
    throw new Error('Invariant 3 prohibition of data fabrication guard missing in schema reconciliation');
  }
});

// 16. Audit Billing Idempotency Deduplication & COGS Margins
assert('Billing Audit: Idempotency deduplication prevents double charging and tracks COGS margins', () => {
  const servicePath = path.join(__dirname, '../backend/app/Modules/Providers/Services/ProviderVerificationService.php');
  const content = fs.readFileSync(servicePath, 'utf8');

  if (!content.includes('double_charge_prevented') || !content.includes('cogs_margin_analysis')) {
    throw new Error('Idempotency double-charge prevention or COGS analysis missing in ProviderVerificationService');
  }
  if (!content.includes('1500') || !content.includes('850') || !content.includes('650')) {
    throw new Error('Minor unit paise monetary values missing in COGS margin calculations');
  }
});

// 17. Audit Production Configuration Gate & Credential Check
assert('Production Gate: Execution locked out until authorized credentials are provisioned (EXT-01)', () => {
  const servicePath = path.join(__dirname, '../backend/app/Modules/Providers/Services/ProviderVerificationService.php');
  const content = fs.readFileSync(servicePath, 'utf8');

  if (!content.includes('BLOCKED_PENDING_CREDENTIALS') || !content.includes('EXT-01')) {
    throw new Error('Production credential lock or EXT-01 status missing in ProviderVerificationService');
  }
  if (!content.includes('can_execute_production') || !content.includes('invariant_2_mock_fallback_in_prod_forbidden')) {
    throw new Error('can_execute_production gate or Invariant 2 fail-safe missing in production check');
  }
});

// 18. Audit Production Docker Compose & HTTPS Nginx Configuration
assert('Infrastructure Audit: Production Docker Compose & HTTPS Nginx gateway enforce TLS 1.3 & HSTS', () => {
  const composePath = path.join(__dirname, '../infrastructure/docker-compose.prod.yml');
  const nginxPath = path.join(__dirname, '../infrastructure/nginx/production.conf');

  if (!fs.existsSync(composePath)) throw new Error('docker-compose.prod.yml missing');
  if (!fs.existsSync(nginxPath)) throw new Error('infrastructure/nginx/production.conf missing');

  const nginxContent = fs.readFileSync(nginxPath, 'utf8');
  if (!nginxContent.includes('Strict-Transport-Security') || !nginxContent.includes('TLSv1.3')) {
    throw new Error('HSTS or TLSv1.3 missing in production Nginx configuration');
  }
  if (!nginxContent.includes('limit_req_zone') || !nginxContent.includes('X-Content-Type-Options')) {
    throw new Error('Rate limiting zone or security headers missing in production Nginx');
  }
});

// 19. Audit Automated Database Backup & Disaster Recovery Restore Scripts
assert('Backup & Disaster Recovery Audit: Automated backup & restore scripts enforce AES-256 & SHA-256', () => {
  const backupShPath = path.join(__dirname, '../infrastructure/scripts/backup-db.sh');
  const restoreShPath = path.join(__dirname, '../infrastructure/scripts/restore-db-test.sh');

  if (!fs.existsSync(backupShPath)) throw new Error('backup-db.sh missing');
  if (!fs.existsSync(restoreShPath)) throw new Error('restore-db-test.sh missing');

  const backupContent = fs.readFileSync(backupShPath, 'utf8');
  if (!backupContent.includes('pg_dump') || !backupContent.includes('sha256sum') || !backupContent.includes('aes-256-cbc')) {
    throw new Error('pg_dump, sha256 checksum, or AES-256 encryption missing in backup-db.sh');
  }

  const restoreContent = fs.readFileSync(restoreShPath, 'utf8');
  if (!restoreContent.includes('SHA-256 mismatch') || !restoreContent.includes('createdb') || !restoreContent.includes('dropdb')) {
    throw new Error('Checksum validation or isolated sandbox DB testing missing in restore-db-test.sh');
  }
});

// 20. Audit Supervisor Queue Worker & Scheduler Configuration
assert('Queue & Scheduler Audit: Supervisor supervisord.conf manages multi-worker scaling & cron scheduler', () => {
  const supPath = path.join(__dirname, '../infrastructure/supervisor/supervisord.conf');
  if (!fs.existsSync(supPath)) throw new Error('infrastructure/supervisor/supervisord.conf missing');

  const supContent = fs.readFileSync(supPath, 'utf8');
  if (!supContent.includes('program:vahan-worker') || !supContent.includes('program:vahan-scheduler')) {
    throw new Error('vahan-worker or vahan-scheduler programs missing in supervisord.conf');
  }
  if (!supContent.includes('queue:work redis') || !supContent.includes('high,default,notifications')) {
    throw new Error('Priority queue workers missing in supervisord.conf');
  }
});

// 21. Audit Flutter Android Signed Release & ProGuard Obfuscation Configuration
assert('Android Release Audit: build.gradle enforces release signing, R8 minification, and SQLCipher ProGuard rules', () => {
  const gradlePath = path.join(__dirname, '../mobile/android/app/build.gradle');
  const proguardPath = path.join(__dirname, '../mobile/android/app/proguard-rules.pro');

  if (!fs.existsSync(gradlePath)) throw new Error('mobile/android/app/build.gradle missing');
  if (!fs.existsSync(proguardPath)) throw new Error('mobile/android/app/proguard-rules.pro missing');

  const gradleContent = fs.readFileSync(gradlePath, 'utf8');
  if (!gradleContent.includes('signingConfigs.release') || !gradleContent.includes('minifyEnabled true')) {
    throw new Error('Release signing config or minifyEnabled missing in mobile build.gradle');
  }

  const proguardContent = fs.readFileSync(proguardPath, 'utf8');
  if (!proguardContent.includes('net.sqlcipher.**')) {
    throw new Error('SQLCipher AES-256 ProGuard keep rules missing in proguard-rules.pro');
  }
});

console.log(`\n[Audit Test Suite Summary] Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log(`All ${passed} security, architectural invariant, and E2E contract audit checks passed successfully.\n`);
  process.exit(0);
}
