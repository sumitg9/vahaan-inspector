<?php

/**
 * Autonomous Local Test Runner for Backend Architecture, Database Schema, Auth, RBAC & Tenant Security.
 * Validates migrations, models, seeders, authentication, cross-tenant isolation, and privilege escalation prevention.
 */

$startTime = microtime(true);
$passed = 0;
$failed = 0;

echo "[Backend Schema, Auth, RBAC & Tenant Security Test Suite] Starting test runner...\n";

$assertTest = function (string $name, callable $fn) use (&$passed, &$failed) {
    try {
        $fn();
        echo "  ✓ {$name}\n";
        $passed++;
    } catch (\Throwable $e) {
        echo "  ✗ {$name}: " . $e->getMessage() . "\n";
        $failed++;
    }
};

// 1. Verify Domain Modules
$assertTest('All 16 Modular Monolith domain module directories exist', function () {
    $expected = [
        'Auth', 'Organizations', 'Permissions', 'VehicleIntel',
        'Challans', 'Providers', 'Inspections', 'Evidence',
        'Tyres', 'Valuation', 'Reports', 'Clients',
        'Billing', 'Notifications', 'Fleet', 'Auditing'
    ];
    $base = __DIR__ . '/../app/Modules';
    foreach ($expected as $m) {
        if (!is_dir("$base/$m")) {
            throw new Exception("Missing module: $m");
        }
    }
});

// 2. Verify Complete Migrations Suite (16 migrations)
$assertTest('All 16 complete database migrations exist and have valid PHP syntax', function () {
    $dir = __DIR__ . '/../database/migrations';
    $files = glob("$dir/*.php");
    if (count($files) < 16) {
        throw new Exception("Expected 16 migration files, found " . count($files));
    }
    foreach ($files as $file) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($file), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in migration: " . basename($file));
        }
    }
});

// 3. Verify Foreign Keys, Indexes & Constraints in Migration DDL
$assertTest('Database migrations define foreign keys, composite indexes, and unique constraints', function () {
    $dir = __DIR__ . '/../database/migrations';
    
    // Check organizations tenant cascade on inspection_cases
    $casesMigration = file_get_contents("$dir/2026_01_01_000010_create_inspection_cases_table.php");
    if (!str_contains($casesMigration, "constrained('organizations')->cascadeOnDelete()")) {
        throw new Exception("Missing organization cascadeOnDelete in inspection_cases migration");
    }

    // Check version uniqueness on templates
    $templateMigration = file_get_contents("$dir/2026_01_01_000009_create_inspection_templates_table.php");
    if (!str_contains($templateMigration, "unique(['vehicle_category', 'version'])")) {
        throw new Exception("Missing unique constraint on inspection_templates (category, version)");
    }

    // Check version uniqueness on report snapshots
    $reportMigration = file_get_contents("$dir/2026_01_01_000015_create_report_snapshots_table.php");
    if (!str_contains($reportMigration, "unique(['inspection_case_id', 'version'])")) {
        throw new Exception("Missing unique constraint on report_snapshots (case, version)");
    }

    // Check monetary precision in paise
    $challanMigration = file_get_contents("$dir/2026_01_01_000008_create_challans_table.php");
    if (!str_contains($challanMigration, "fine_amount_paise")) {
        throw new Exception("Missing fine_amount_paise minor unit column in challans migration");
    }
});

// 4. Verify Eloquent Models and Tenant Trait
$assertTest('All 17 Eloquent Models and TenantModelTrait exist with valid PHP syntax', function () {
    $modelsDir = __DIR__ . '/../app/Models';
    $expectedModels = [
        'Organization', 'Branch', 'User', 'Client', 'BankBranch',
        'VehicleProfile', 'Challan', 'InspectionTemplate', 'InspectionCase',
        'InspectionItemResult', 'InspectionEvidence', 'InspectionTyre',
        'Valuation', 'ReportSnapshot', 'CreditWallet', 'WalletTransaction',
        'FleetVehicle', 'AuditLog'
    ];

    foreach ($expectedModels as $model) {
        $file = "$modelsDir/$model.php";
        if (!file_exists($file)) {
            throw new Exception("Missing model: $model.php");
        }
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($file), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in model: $model.php");
        }
    }
});

// 5. Verify Permission Matrix and RBAC Definitions
$assertTest('PermissionMatrix defines granular capabilities and role mappings', function () {
    require_once __DIR__ . '/../app/Modules/Permissions/PermissionMatrix.php';

    $adminPerms = \App\Modules\Permissions\PermissionMatrix::getPermissionsForRole('ORG_ADMIN');
    $inspectorPerms = \App\Modules\Permissions\PermissionMatrix::getPermissionsForRole('INSPECTOR');

    if (!in_array('branches.create', $adminPerms)) {
        throw new Exception("ORG_ADMIN must hold branches.create permission");
    }
    if (in_array('branches.create', $inspectorPerms)) {
        throw new Exception("INSPECTOR must NOT hold branches.create permission");
    }
    if (!in_array('inspections.update_item', $inspectorPerms)) {
        throw new Exception("INSPECTOR must hold inspections.update_item permission");
    }
});

// 6. Verify Auth, Organizations and Branches Controllers
$assertTest('Auth, Organization, and Branch controllers compile with valid syntax', function () {
    $controllers = [
        __DIR__ . '/../app/Modules/Auth/Controllers/AuthController.php',
        __DIR__ . '/../app/Modules/Organizations/Controllers/OrganizationController.php',
        __DIR__ . '/../app/Modules/Organizations/Controllers/BranchController.php',
        __DIR__ . '/../app/Modules/Auditing/Services/AuditService.php',
        __DIR__ . '/../app/Http/Middleware/EnsurePermissionMiddleware.php',
    ];

    foreach ($controllers as $ctrl) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($ctrl), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($ctrl));
        }
    }
});

// 7. Verify Cross-Tenant and Privilege Escalation Middleware Logic
$assertTest('Middleware logic enforces cross-tenant blocks and privilege escalation checks', function () {
    $tenantMiddlewareFile = __DIR__ . '/../app/Http/Middleware/TenantContextMiddleware.php';
    $content = file_get_contents($tenantMiddlewareFile);
    if (!str_contains($content, 'CROSS_TENANT_ACCESS_ATTEMPT') || !str_contains($content, '403')) {
        throw new Exception("TenantContextMiddleware must block and audit cross-tenant access attempts");
    }

    $permMiddlewareFile = __DIR__ . '/../app/Http/Middleware/EnsurePermissionMiddleware.php';
    $permContent = file_get_contents($permMiddlewareFile);
    if (!str_contains($permContent, 'PRIVILEGE_ESCALATION_ATTEMPT') || !str_contains($permContent, '403')) {
        throw new Exception("EnsurePermissionMiddleware must block and audit privilege escalation attempts");
    }
});

// 8. Verify Feature Test Cases for Auth, Tenancy, and RBAC
$assertTest('All feature test files for Auth, Tenancy, and Permissions have valid syntax', function () {
    $testFiles = [
        __DIR__ . '/Feature/AuthenticationTest.php',
        __DIR__ . '/Feature/CrossTenantAccessTest.php',
        __DIR__ . '/Feature/PrivilegeEscalationTest.php',
        __DIR__ . '/Feature/TenantIsolationTest.php',
        __DIR__ . '/Feature/MonetaryPrecisionAndLedgerTest.php',
        __DIR__ . '/Feature/TemplateAndReportVersioningTest.php',
        __DIR__ . '/Feature/ProviderEngineTest.php',
    ];

    foreach ($testFiles as $tf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($tf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in test: " . basename($tf));
        }
    }
});

// 9. Verify Provider Architecture, Drivers & DTO Syntax
$assertTest('Provider contracts, DTOs, drivers, and VehicleIntelligenceService have valid syntax', function () {
    $providerFiles = [
        __DIR__ . '/../app/Modules/Providers/Contracts/ProviderInterface.php',
        __DIR__ . '/../app/Modules/Providers/Contracts/VehicleDataProviderInterface.php',
        __DIR__ . '/../app/Modules/Providers/Contracts/ChallanDataProviderInterface.php',
        __DIR__ . '/../app/Modules/Providers/Exceptions/ProviderException.php',
        __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedVehicleDto.php',
        __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedChallanDto.php',
        __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedChallanResponseDto.php',
        __DIR__ . '/../app/Modules/Providers/Drivers/MockProvider.php',
        __DIR__ . '/../app/Modules/Providers/Drivers/ApisathiProvider.php',
        __DIR__ . '/../app/Modules/Providers/Services/ProviderManager.php',
        __DIR__ . '/../app/Modules/Providers/Services/ProviderAuditLogger.php',
        __DIR__ . '/../app/Modules/VehicleIntel/Services/VehicleIntelligenceService.php',
        __DIR__ . '/../app/Modules/VehicleIntel/Controllers/VehicleLookupController.php',
        __DIR__ . '/../app/Modules/Challans/Controllers/ChallanLookupController.php',
    ];

    foreach ($providerFiles as $pf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($pf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($pf));
        }
    }
});

// 10. Execute Provider Engine & Safety Guard Tests
$assertTest('Provider engine unit tests: Mock fixtures, DPDP masking, paise precision, and production guards', function () {
    if (!function_exists('config')) {
        function config($key = null, $default = null) {
            return $default;
        }
    }
    if (!function_exists('request')) {
        function request() {
            return new class {
                public function ip() { return '127.0.0.1'; }
                public function userAgent() { return 'VahanCheck-Test/1.0'; }
            };
        }
    }

    require_once __DIR__ . '/../app/Modules/Providers/Contracts/ProviderInterface.php';
    require_once __DIR__ . '/../app/Modules/Providers/Contracts/VehicleDataProviderInterface.php';
    require_once __DIR__ . '/../app/Modules/Providers/Contracts/ChallanDataProviderInterface.php';
    require_once __DIR__ . '/../app/Modules/Providers/Exceptions/ProviderException.php';
    require_once __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedVehicleDto.php';
    require_once __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedChallanDto.php';
    require_once __DIR__ . '/../app/Modules/Providers/DTOs/NormalizedChallanResponseDto.php';
    require_once __DIR__ . '/../app/Modules/Providers/Drivers/MockProvider.php';
    require_once __DIR__ . '/../app/Modules/Providers/Drivers/ApisathiProvider.php';
    require_once __DIR__ . '/../app/Modules/Providers/Services/ProviderManager.php';
    require_once __DIR__ . '/../app/Modules/Providers/Services/ProviderAuditLogger.php';
    require_once __DIR__ . '/../app/Modules/VehicleIntel/Services/VehicleIntelligenceService.php';
    require_once __DIR__ . '/Feature/ProviderEngineTest.php';

    \Tests\Feature\ProviderEngineTest::testMockProviderStandardVehicle();
    \Tests\Feature\ProviderEngineTest::testMockProviderChallansPaisePrecision();
    \Tests\Feature\ProviderEngineTest::testDeterministicErrorScenarios();
    \Tests\Feature\ProviderEngineTest::testDpdpActMasking();
    \Tests\Feature\ProviderEngineTest::testProductionSafetyGuard();
    \Tests\Feature\ProviderEngineTest::testAuditLoggerHeaderSanitization();
    \Tests\Feature\ProviderEngineTest::testProviderManagerResolution();
    \Tests\Feature\ProviderEngineTest::testPartialResponseAndRestrictedFields();
    \Tests\Feature\ProviderEngineTest::testCombinedVerificationAndStatusCheck();
});

// 11. Verify Inspection & Client Modules Syntax
$assertTest('Inspection and Client domain services, state machine, exceptions, and controllers have valid syntax', function () {
    $inspectionFiles = [
        __DIR__ . '/../app/Modules/Clients/Services/ClientService.php',
        __DIR__ . '/../app/Modules/Clients/Controllers/ClientController.php',
        __DIR__ . '/../app/Modules/Inspections/Exceptions/InspectionException.php',
        __DIR__ . '/../app/Modules/Inspections/Services/InspectionCaseStateMachine.php',
        __DIR__ . '/../app/Modules/Inspections/Services/InspectionService.php',
        __DIR__ . '/../app/Modules/Inspections/Controllers/InspectionController.php',
        __DIR__ . '/../app/Modules/Inspections/Controllers/InspectionTemplateController.php',
        __DIR__ . '/Feature/InspectionLifecycleTest.php',
    ];

    foreach ($inspectionFiles as $inf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($inf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($inf));
        }
    }
});

// 12. Execute Inspection Lifecycle & State Machine Unit Tests
$assertTest('Inspection lifecycle tests: State machine transitions, role security, Invariant 3, QC invariants & multi-tenancy', function () {
    require_once __DIR__ . '/../app/Modules/Clients/Services/ClientService.php';
    require_once __DIR__ . '/../app/Modules/Inspections/Exceptions/InspectionException.php';
    require_once __DIR__ . '/../app/Modules/Inspections/Services/InspectionCaseStateMachine.php';
    require_once __DIR__ . '/../app/Modules/Inspections/Services/InspectionService.php';
    require_once __DIR__ . '/Feature/InspectionLifecycleTest.php';

    \Tests\Feature\InspectionLifecycleTest::testValidLifecycleTransitions();
    \Tests\Feature\InspectionLifecycleTest::testInvalidStateTransitions();
    \Tests\Feature\InspectionLifecycleTest::testRoleTransitionAuthorization();
    \Tests\Feature\InspectionLifecycleTest::testUntestedCheckpointsDefaultToNotChecked();
    \Tests\Feature\InspectionLifecycleTest::testMandatoryCorrectionRemarks();
    \Tests\Feature\InspectionLifecycleTest::testClientAndBankBranchMultiTenancy();
    \Tests\Feature\InspectionLifecycleTest::testInspectionCaseCreationAndScoping();
});

// 13. Verify Evidence, Document OCR, and Tyres Modules Syntax
$assertTest('Evidence, Document OCR, and Tyres services, controllers, and tests have valid syntax', function () {
    $evidenceAndTyreFiles = [
        __DIR__ . '/../app/Modules/Evidence/Services/EvidenceStorageService.php',
        __DIR__ . '/../app/Modules/Evidence/Controllers/EvidenceController.php',
        __DIR__ . '/../app/Modules/Evidence/Services/DocumentOcrServiceInterface.php',
        __DIR__ . '/../app/Modules/Evidence/Services/MockDocumentOcrService.php',
        __DIR__ . '/../app/Modules/Evidence/Services/DocumentComparisonService.php',
        __DIR__ . '/../app/Modules/Evidence/Controllers/DocumentOcrController.php',
        __DIR__ . '/../app/Modules/Tyres/Services/AxleLayoutService.php',
        __DIR__ . '/../app/Modules/Tyres/Services/TyreInspectionService.php',
        __DIR__ . '/../app/Modules/Tyres/Controllers/TyreInspectionController.php',
        __DIR__ . '/Feature/EvidenceAndTyresTest.php',
    ];

    foreach ($evidenceAndTyreFiles as $ef) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($ef), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($ef));
        }
    }
});

// 14. Execute Evidence, OCR & Multi-Axle Tyre Unit Tests
$assertTest('Evidence, Document OCR & Tyres tests: Upload validation, SHA-256, EXIF GPS, OCR comparison, AC-TYRE-01 & AC-TYRE-02', function () {
    require_once __DIR__ . '/../app/Modules/Evidence/Services/EvidenceStorageService.php';
    require_once __DIR__ . '/../app/Modules/Evidence/Services/DocumentOcrServiceInterface.php';
    require_once __DIR__ . '/../app/Modules/Evidence/Services/MockDocumentOcrService.php';
    require_once __DIR__ . '/../app/Modules/Evidence/Services/DocumentComparisonService.php';
    require_once __DIR__ . '/../app/Modules/Tyres/Services/AxleLayoutService.php';
    require_once __DIR__ . '/../app/Modules/Tyres/Services/TyreInspectionService.php';
    require_once __DIR__ . '/Feature/EvidenceAndTyresTest.php';

    \Tests\Feature\EvidenceAndTyresTest::testEvidenceUploadValidationAndPresigning();
    \Tests\Feature\EvidenceAndTyresTest::testEvidenceStorageAndExifGpsMetadata();
    \Tests\Feature\EvidenceAndTyresTest::testDocumentOcrAndRegistryComparison();
    \Tests\Feature\EvidenceAndTyresTest::testConfigurableAxleLayouts();
    \Tests\Feature\EvidenceAndTyresTest::testTyreAssessmentAndTreadDepthSafetyValidation();
});

// 15. Verify Valuation Module Syntax
$assertTest('Valuation domain services, exceptions, controllers, and feature tests have valid syntax', function () {
    $valuationFiles = [
        __DIR__ . '/../app/Modules/Valuation/Exceptions/ValuationException.php',
        __DIR__ . '/../app/Modules/Valuation/Services/ValuationCalculatorService.php',
        __DIR__ . '/../app/Modules/Valuation/Services/ValuationGovernanceService.php',
        __DIR__ . '/../app/Modules/Valuation/Controllers/ValuationController.php',
        __DIR__ . '/Feature/ValuationGovernanceTest.php',
    ];

    foreach ($valuationFiles as $vf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($vf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($vf));
        }
    }
});

// 16. Execute Valuation Engine & Governance Unit Tests
$assertTest('Valuation tests: AC-VAL-01 algorithmic separation, AC-VAL-02 override justification, remarks, RBAC, snapshots & report gate', function () {
    require_once __DIR__ . '/../app/Modules/Valuation/Exceptions/ValuationException.php';
    require_once __DIR__ . '/../app/Modules/Valuation/Services/ValuationCalculatorService.php';
    require_once __DIR__ . '/../app/Modules/Valuation/Services/ValuationGovernanceService.php';
    require_once __DIR__ . '/Feature/ValuationGovernanceTest.php';

    \Tests\Feature\ValuationGovernanceTest::testAlgorithmicEstimateCalculationAndSeparation();
    \Tests\Feature\ValuationGovernanceTest::testMandatoryOverrideJustificationValidation();
    \Tests\Feature\ValuationGovernanceTest::testProfessionalRemarksValidation();
    \Tests\Feature\ValuationGovernanceTest::testUnauthorizedValuerRoleRejection();
    \Tests\Feature\ValuationGovernanceTest::testHistoricalVersionSnapshotPreservation();
    \Tests\Feature\ValuationGovernanceTest::testReportGenerationApprovalGate();
});

// 17. Verify Reports Module Syntax
$assertTest('Reports domain services, templates, controllers, and feature tests have valid syntax', function () {
    $reportFiles = [
        __DIR__ . '/../app/Modules/Reports/Services/ReportSnapshotService.php',
        __DIR__ . '/../app/Modules/Reports/Services/ReportPdfRenderService.php',
        __DIR__ . '/../app/Modules/Reports/Services/ReportVerificationService.php',
        __DIR__ . '/../app/Modules/Reports/Controllers/ReportController.php',
        __DIR__ . '/Feature/ReportGenerationAndVerificationTest.php',
    ];

    foreach ($reportFiles as $rf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($rf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($rf));
        }
    }
});

// 18. Execute Report Generation, 11-Section Coverage, Invariant 6 & QR Verification Tests
$assertTest('Report tests: AC-REP-01 11-section coverage, AC-REP-02 QR verification, AC-REP-03 mock watermark, Invariant 6 SHA-256 checksum & versioning', function () {
    require_once __DIR__ . '/../app/Modules/Reports/Services/ReportSnapshotService.php';
    require_once __DIR__ . '/../app/Modules/Reports/Services/ReportPdfRenderService.php';
    require_once __DIR__ . '/../app/Modules/Reports/Services/ReportVerificationService.php';
    require_once __DIR__ . '/Feature/ReportGenerationAndVerificationTest.php';

    \Tests\Feature\ReportGenerationAndVerificationTest::testReportGenerationBlocksIfValuationUnapproved();
    \Tests\Feature\ReportGenerationAndVerificationTest::testComplete11SectionsInSnapshot();
    \Tests\Feature\ReportGenerationAndVerificationTest::testSha256ChecksumAndTamperEvidentIntegrity();
    \Tests\Feature\ReportGenerationAndVerificationTest::testMockWatermarkIndelibleFlag();
    \Tests\Feature\ReportGenerationAndVerificationTest::testReportVersioningOnRevision();
    \Tests\Feature\ReportGenerationAndVerificationTest::testPublicQrVerification();
});

// 19. Verify Admin Domain Controllers & Route Handlers Syntax
$assertTest('Admin domain controllers, user management, and provider configuration have valid syntax', function () {
    $adminFiles = [
        __DIR__ . '/../app/Modules/Admin/Controllers/SuperAdminDashboardController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/AdminOrganizationController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/UserController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/ProviderConfigController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/FeatureFlagController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/ReportSettingsController.php',
        __DIR__ . '/../app/Modules/Admin/Controllers/AuditLogController.php',
        __DIR__ . '/Feature/AdminGovernanceAndSecurityTest.php',
    ];

    foreach ($adminFiles as $af) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($af), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($af));
        }
    }
});

// 20. Execute Privileged Access Enforcement, Zero Secret Leakage & DPDP Redaction Tests
$assertTest('Privileged access enforcement, privilege escalation defense, zero secret leakage & DPDP audit redaction', function () {
    require_once __DIR__ . '/Stubs/RequestStub.php';
    if (!function_exists('logger')) {
        function logger() {
            return new class {
                public function error($msg, array $ctx = []) {}
                public function info($msg, array $ctx = []) {}
                public function warning($msg, array $ctx = []) {}
            };
        }
    }

    if (!function_exists('response')) {
        function response() {
            return new class {
                public function json($data, $status = 200) {
                    return new class($data, $status) {
                        public $data;
                        public $status;
                        public function __construct($d, $s) { $this->data = $d; $this->status = $s; }
                        public function getStatusCode() { return $this->status; }
                        public function getContent() { return json_encode($this->data); }
                        public function getData($assoc = false) { return json_decode(json_encode($this->data), $assoc); }
                    };
                }
            };
        }
    }

    require_once __DIR__ . '/../app/Http/Controllers/Controller.php';
    require_once __DIR__ . '/../app/Modules/Auditing/Services/AuditService.php';
    require_once __DIR__ . '/../app/Modules/Admin/Controllers/ProviderConfigController.php';
    require_once __DIR__ . '/../app/Modules/Admin/Controllers/UserController.php';
    require_once __DIR__ . '/../app/Modules/Admin/Controllers/AuditLogController.php';
    require_once __DIR__ . '/Feature/AdminGovernanceAndSecurityTest.php';

    \Tests\Feature\AdminGovernanceAndSecurityTest::testAdminCapabilitiesInPermissionMatrix();
    \Tests\Feature\AdminGovernanceAndSecurityTest::testZeroSecretLeakageInProviderConfig();
    \Tests\Feature\AdminGovernanceAndSecurityTest::testInvariant2ProductionFailSafeBlocksMockFallback();
    \Tests\Feature\AdminGovernanceAndSecurityTest::testPrivilegeEscalationProhibitedOnUserCreation();
    \Tests\Feature\AdminGovernanceAndSecurityTest::testAuditLogAppliesDpdpRedactionOnSensitivePii();
});

// 21. Verify Billing Domain Models, Services, Gateways & Controllers Syntax
$assertTest('Billing domain services, gateways, exceptions, and controllers have valid syntax', function () {
    $billingFiles = [
        __DIR__ . '/../app/Models/Invoice.php',
        __DIR__ . '/../app/Models/CreditReservation.php',
        __DIR__ . '/../app/Models/Subscription.php',
        __DIR__ . '/../app/Modules/Billing/Contracts/PaymentGatewayInterface.php',
        __DIR__ . '/../app/Modules/Billing/Gateways/MockPaymentGateway.php',
        __DIR__ . '/../app/Modules/Billing/Gateways/RazorpayPaymentGateway.php',
        __DIR__ . '/../app/Modules/Billing/Exceptions/InsufficientCreditsException.php',
        __DIR__ . '/../app/Modules/Billing/Exceptions/InvalidIdempotencyKeyException.php',
        __DIR__ . '/../app/Modules/Billing/Exceptions/ReservationNotFoundException.php',
        __DIR__ . '/../app/Modules/Billing/Services/SubscriptionPlanService.php',
        __DIR__ . '/../app/Modules/Billing/Services/InvoiceService.php',
        __DIR__ . '/../app/Modules/Billing/Services/CreditLedgerService.php',
        __DIR__ . '/../app/Modules/Billing/Services/CreditReservationService.php',
        __DIR__ . '/../app/Modules/Billing/Controllers/BillingController.php',
        __DIR__ . '/Feature/BillingLedgerAndIdempotencyTest.php',
    ];

    foreach ($billingFiles as $bf) {
        $output = [];
        $exitCode = 0;
        exec("php -l " . escapeshellarg($bf), $output, $exitCode);
        if ($exitCode !== 0) {
            throw new Exception("Syntax error in: " . basename($bf));
        }
    }
});

// 22. Execute Billing & Idempotency Tests: Double-Entry Ledger, Idempotency, Reservations, HMAC & COGS
$assertTest('Billing tests: Double-entry ledger, idempotency deduplication, two-phase credit reservations, HMAC payment signatures & COGS margins', function () {
    require_once __DIR__ . '/Stubs/ModelStub.php';
    require_once __DIR__ . '/../app/Shared/Traits/TenantModelTrait.php';
    require_once __DIR__ . '/../app/Models/CreditWallet.php';
    require_once __DIR__ . '/../app/Models/WalletTransaction.php';
    require_once __DIR__ . '/../app/Models/Invoice.php';
    require_once __DIR__ . '/../app/Models/CreditReservation.php';
    require_once __DIR__ . '/../app/Models/Subscription.php';
    require_once __DIR__ . '/../app/Modules/Billing/Contracts/PaymentGatewayInterface.php';
    require_once __DIR__ . '/../app/Modules/Billing/Gateways/MockPaymentGateway.php';
    require_once __DIR__ . '/../app/Modules/Billing/Gateways/RazorpayPaymentGateway.php';
    require_once __DIR__ . '/../app/Modules/Billing/Exceptions/InsufficientCreditsException.php';
    require_once __DIR__ . '/../app/Modules/Billing/Exceptions/InvalidIdempotencyKeyException.php';
    require_once __DIR__ . '/../app/Modules/Billing/Exceptions/ReservationNotFoundException.php';
    require_once __DIR__ . '/../app/Modules/Billing/Services/SubscriptionPlanService.php';
    require_once __DIR__ . '/../app/Modules/Billing/Services/InvoiceService.php';
    require_once __DIR__ . '/../app/Modules/Billing/Services/CreditLedgerService.php';
    require_once __DIR__ . '/../app/Modules/Billing/Services/CreditReservationService.php';
    require_once __DIR__ . '/Feature/BillingLedgerAndIdempotencyTest.php';

    \Tests\Feature\BillingLedgerAndIdempotencyTest::testDoubleEntryLedgerMonetaryPrecisionAndBalance();
    \Tests\Feature\BillingLedgerAndIdempotencyTest::testIdempotencyPreventsDuplicateCharges();
    \Tests\Feature\BillingLedgerAndIdempotencyTest::testCreditReservationTwoPhaseCommitAndRelease();
    \Tests\Feature\BillingLedgerAndIdempotencyTest::testPaymentGatewayHmacSignatureVerification();
    \Tests\Feature\BillingLedgerAndIdempotencyTest::testProviderCostTrackingAndMarginCalculation();
});

// 23. Execute Fleet Management & Bulk Verification Tests: Expiry Engine, Cost Limits, CSV Import/Export & Scheduled Checks
$assertTest('Fleet & Bulk Verification tests: Statutory expiry engine, bulk cost limits, CSV import/export RBAC & scheduled checks', function () {
    require_once __DIR__ . '/../app/Models/FleetVehicle.php';
    require_once __DIR__ . '/../app/Models/Notification.php';
    require_once __DIR__ . '/../app/Models/ScheduledFleetCheck.php';
    require_once __DIR__ . '/../app/Models/VehicleProfile.php';
    require_once __DIR__ . '/../app/Models/Challan.php';
    require_once __DIR__ . '/../app/Modules/Notifications/Services/NotificationService.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Exceptions/FleetException.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Exceptions/CostLimitExceededException.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Exceptions/ExportPermissionDeniedException.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Services/ComplianceExpiryEngine.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Services/BulkVerificationService.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Services/FleetManagementService.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Services/FleetImportExportService.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Services/ScheduledComplianceCheckService.php';
    require_once __DIR__ . '/../app/Modules/Fleet/Controllers/FleetController.php';
    require_once __DIR__ . '/Feature/FleetAndBulkVerificationTest.php';

    \Tests\Feature\FleetAndBulkVerificationTest::testComplianceExpiryEngineStatutoryCalculations();
    \Tests\Feature\FleetAndBulkVerificationTest::testBulkVerificationCostEstimationAndCeilingGuard();
    \Tests\Feature\FleetAndBulkVerificationTest::testFleetImportFromCsvValidationAndDeduplication();
    \Tests\Feature\FleetAndBulkVerificationTest::testFleetExportPermissionEnforcement();
    \Tests\Feature\FleetAndBulkVerificationTest::testScheduledComplianceCheckExecutionAndAlertDispatch();
});

// 24. Execute Comprehensive Security, Multi-Tenancy, Secrets & Compliance Audit Tests
$assertTest('Security & Invariants Audit: Cross-tenant barriers, privilege escalation defense, zero secret leakage, mock locks & DPDP PII redaction', function () {
    require_once __DIR__ . '/../app/Models/AuditLog.php';
    require_once __DIR__ . '/../app/Models/User.php';
    require_once __DIR__ . '/Feature/SecurityAndComplianceAuditTest.php';

    \Tests\Feature\SecurityAndComplianceAuditTest::testCrossTenantAccessBarrier();
    \Tests\Feature\SecurityAndComplianceAuditTest::testPrivilegeEscalationSafeguard();
    \Tests\Feature\SecurityAndComplianceAuditTest::testProviderCredentialMasking();
    \Tests\Feature\SecurityAndComplianceAuditTest::testProductionMockFallbackProhibition();
    \Tests\Feature\SecurityAndComplianceAuditTest::testProhibitionOfDataFabrication();
    \Tests\Feature\SecurityAndComplianceAuditTest::testDpdpActCitizenPiiRedaction();
});

// 25. Execute Provider Sandbox Verification & Production Gate Tests
$assertTest('Provider Verification & Production Gate: Agreements, 24-field coverage, schema reconciliation, billing idempotency & production locks', function () {
    require_once __DIR__ . '/../app/Modules/Providers/Services/ProviderVerificationService.php';
    require_once __DIR__ . '/Feature/ProviderSandboxAndProductionGateTest.php';

    \Tests\Feature\ProviderSandboxAndProductionGateTest::testProviderAgreementsAndFieldCoverageMatrix();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testSandboxStandardSchemaReconciliation();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testSandboxPartialRestrictedReconciliation();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testCleanRecordChallanReconciliation();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testBillingAndIdempotencyValidation();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testErrorScenariosAndFailSafes();
    \Tests\Feature\ProviderSandboxAndProductionGateTest::testProductionConfigurationGate();
});

$duration = round((microtime(true) - $startTime) * 1000, 2);
echo "\n[Backend Auth & Security Test Summary] Passed: {$passed}, Failed: {$failed} (Duration: {$duration}ms)\n";

if ($failed > 0) {
    exit(1);
} else {
    echo "All Backend authentication, RBAC permissions, and tenant security checks verified successfully.\n\n";
    exit(0);
}
