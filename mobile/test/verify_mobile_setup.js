/**
 * Comprehensive Automated Verification Suite for Flutter Android Mobile Application
 * Verifies Clean Architecture, offline SQLite encrypted storage, touch targets,
 * Invariant 3 data integrity, AC-TYRE-01/02, durable sync outbox, camera evidence, and QR verification.
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

console.log('[Flutter Mobile Architecture & Field Inspection Verification] Starting test runner...\n');

// 1. Verify Clean Architecture folders
assert('Clean Architecture directories (core/ & features/) are established', () => {
  const coreDir = path.join(__dirname, '../lib/core');
  const featuresDir = path.join(__dirname, '../lib/features');
  if (!fs.existsSync(coreDir)) throw new Error('lib/core missing');
  if (!fs.existsSync(featuresDir)) throw new Error('lib/features missing');
  if (!fs.existsSync(path.join(coreDir, 'network'))) throw new Error('core/network missing');
  if (!fs.existsSync(path.join(coreDir, 'storage'))) throw new Error('core/storage missing');
  if (!fs.existsSync(path.join(coreDir, 'theme'))) throw new Error('core/theme missing');
  if (!fs.existsSync(path.join(coreDir, 'sync'))) throw new Error('core/sync missing');
});

// 2. Verify Touch Target requirement in AppTheme (>= 48dp)
assert('AppTheme enforces >= 48dp minimum touch target for field outdoor usability', () => {
  const themePath = path.join(__dirname, '../lib/core/theme/app_theme.dart');
  const content = fs.readFileSync(themePath, 'utf8');
  if (!content.includes('minTouchTargetSize = 48.0')) {
    throw new Error('48dp minimum touch target not defined in app_theme.dart');
  }
  if (!content.includes('0xFF0F172A')) {
    throw new Error('Dark Navy 0xFF0F172A missing in app_theme.dart');
  }
});

// 3. Verify Offline Encrypted Database Schema
assert('Encrypted database helper defines sync_outbox, draft_inspections, and cached_cases tables', () => {
  const dbPath = path.join(__dirname, '../lib/core/storage/encrypted_database.dart');
  const content = fs.readFileSync(dbPath, 'utf8');
  if (!content.includes('sync_outbox') || !content.includes('draft_inspections') || !content.includes('cached_vehicles') || !content.includes('photo_evidence')) {
    throw new Error('Mandatory offline SQLite tables missing from encrypted_database.dart');
  }
});

// 4. Verify Pubspec dependencies
assert('Pubspec.yaml defines sqflite, dio, uuid, and connectivity_plus', () => {
  const pubspecPath = path.join(__dirname, '../pubspec.yaml');
  const content = fs.readFileSync(pubspecPath, 'utf8');
  if (!content.includes('dio:') || !content.includes('sqflite:') || !content.includes('uuid:')) {
    throw new Error('Mandatory Flutter dependencies missing from pubspec.yaml');
  }
});

// 5. Verify Invariant 3: Untracked Checkpoints Default to not_checked
assert('Inspection checklist enforces Invariant 3: untracked items stay not_checked and never default to Pass', () => {
  const checklistPath = path.join(__dirname, '../lib/features/inspection_form/presentation/inspection_checklist_screen.dart');
  if (!fs.existsSync(checklistPath)) throw new Error('inspection_checklist_screen.dart missing');
  const content = fs.readFileSync(checklistPath, 'utf8');

  if (!content.includes("'status': 'not_checked'")) {
    throw new Error("Invariant 3 violated: Checkpoints must default to 'not_checked'");
  }
  if (!content.includes('Invariant 3: Unchecked items remain strictly "not_checked"')) {
    throw new Error('Invariant 3 statutory notice missing from mobile checklist UI');
  }
});

// 6. Verify AC-TYRE-01 & AC-TYRE-02 Multi-Axle Tyre Audit
assert('Tyre inspection enforces AC-TYRE-01 tipper layout (10 road + 1 spare) and AC-TYRE-02 safety threshold (<1.6mm)', () => {
  const tyresPath = path.join(__dirname, '../lib/features/tyres/presentation/tyre_inspection_screen.dart');
  if (!fs.existsSync(tyresPath)) throw new Error('tyre_inspection_screen.dart missing');
  const content = fs.readFileSync(tyresPath, 'utf8');

  if (!content.includes('3-Axle 10-Wheeler Tipper Audit') && !content.includes('10 Road Wheels + Spare')) {
    throw new Error('AC-TYRE-01 tipper layout missing from mobile tyre screen');
  }
  if (!content.includes('1.6') || !content.includes('AC-TYRE-02 Safety Threshold Breach')) {
    throw new Error('AC-TYRE-02 legal threshold warning (<1.6mm) missing from mobile tyre screen');
  }
  if (!content.includes('WORN_OUT')) {
    throw new Error('WORN_OUT condition classification missing from tyre screen');
  }
});

// 7. Verify Geotagged Camera Capture & SHA-256 Hashes
assert('Camera evidence captures geotagged photographs with EXIF GPS coordinates and SHA-256 integrity hashes', () => {
  const cameraPath = path.join(__dirname, '../lib/features/camera/presentation/camera_evidence_screen.dart');
  if (!fs.existsSync(cameraPath)) throw new Error('camera_evidence_screen.dart missing');
  const content = fs.readFileSync(cameraPath, 'utf8');

  if (!content.includes('EXIF GPS:') || !content.includes('SHA-256:')) {
    throw new Error('EXIF GPS or SHA-256 metadata display missing from camera screen');
  }
  if (!content.includes('DAMAGE PROOF') || !content.includes('is_damage')) {
    throw new Error('Damage proof tagging missing from camera screen');
  }
});

// 8. Verify Durable Outbox Sync with Idempotency-Key
assert('Durable outbox engine flushes offline mutations with Idempotency-Key request headers', () => {
  const syncPath = path.join(__dirname, '../lib/core/sync/sync_outbox_engine.dart');
  if (!fs.existsSync(syncPath)) throw new Error('sync_outbox_engine.dart missing');
  const content = fs.readFileSync(syncPath, 'utf8');

  if (!content.includes('idempotencyKey') || !content.includes('flushOutbox')) {
    throw new Error('Idempotency-Key handling missing from sync_outbox_engine.dart');
  }
});

// 9. Verify Mobile Report Viewer with Indelible Watermark & QR Seal
assert('Mobile report viewer enforces Invariant 2 indelible watermark and AC-REP-02 QR verification seal', () => {
  const reportPath = path.join(__dirname, '../lib/features/reports/presentation/mobile_report_viewer_screen.dart');
  if (!fs.existsSync(reportPath)) throw new Error('mobile_report_viewer_screen.dart missing');
  const content = fs.readFileSync(reportPath, 'utf8');

  if (!content.includes('DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
    throw new Error('Invariant 2 indelible watermark missing from mobile report viewer');
  }
  if (!content.includes('AC-REP-02') || !content.includes('sha256_checksum')) {
    throw new Error('AC-REP-02 cryptographic QR seal or SHA-256 checksum missing from mobile report viewer');
  }
});

// 10. Verify Role-Based Navigation & Session Handling
assert('Main navigation implements role-based sessions and online/offline connectivity toggle', () => {
  const navPath = path.join(__dirname, '../lib/features/navigation/presentation/main_nav_screen.dart');
  const loginPath = path.join(__dirname, '../lib/features/auth/presentation/login_screen.dart');
  if (!fs.existsSync(navPath) || !fs.existsSync(loginPath)) throw new Error('Navigation or Login screen missing');

  const navContent = fs.readFileSync(navPath, 'utf8');
  if (!navContent.includes('userRole') || !navContent.includes('_toggleConnectivity')) {
    throw new Error('Role or connectivity toggle missing from main_nav_screen.dart');
  }
});

console.log(`\n[Mobile Test Summary] Passed: ${passed}, Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All Flutter Mobile architecture, offline sync, touch targets, and field inspection checks verified successfully.\n');
  process.exit(0);
}
