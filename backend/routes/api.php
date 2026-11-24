<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Dashboard\Controllers\DashboardController;
use App\Modules\Organizations\Controllers\OrganizationController;
use App\Modules\Organizations\Controllers\BranchController;
use App\Modules\VehicleIntel\Controllers\VehicleLookupController;
use App\Modules\Challans\Controllers\ChallanLookupController;
use App\Modules\Clients\Controllers\ClientController;
use App\Modules\Inspections\Controllers\InspectionController;
use App\Modules\Inspections\Controllers\InspectionTemplateController;
use App\Modules\Evidence\Controllers\EvidenceController;
use App\Modules\Evidence\Controllers\DocumentOcrController;
use App\Modules\Tyres\Controllers\TyreInspectionController;
use App\Modules\Valuation\Controllers\ValuationController;
use App\Modules\Reports\Controllers\ReportController;
use App\Modules\Admin\Controllers\SuperAdminDashboardController;
use App\Modules\Admin\Controllers\AdminOrganizationController;
use App\Modules\Admin\Controllers\UserController;
use App\Modules\Admin\Controllers\ProviderConfigController;
use App\Modules\Admin\Controllers\FeatureFlagController;
use App\Modules\Admin\Controllers\ReportSettingsController;
use App\Modules\Admin\Controllers\AuditLogController;
use App\Modules\Billing\Controllers\BillingController;
use App\Modules\Fleet\Controllers\FleetController;
use App\Http\Middleware\EnsurePermissionMiddleware;
use App\Http\Middleware\TenantContextMiddleware;

/*
|--------------------------------------------------------------------------
| VahanCheck Central REST API Routes
|--------------------------------------------------------------------------
*/

// Diagnostics & Health Endpoints
Route::get('/health', [HealthController::class, 'check']);
Route::get('/ping', [HealthController::class, 'ping']);

Route::prefix('v1')->group(function () {
    Route::get('/health', [HealthController::class, 'check']);
    Route::get('/ping', [HealthController::class, 'ping']);

    // Public / Fallback Dashboard Metrics Endpoint for SaaS UI
    Route::get('/dashboard/metrics', [DashboardController::class, 'metrics']);

    // Public Authentication Routes
    Route::prefix('auth')->group(function () {
        Route::post('/login', [AuthController::class, 'login']);
        Route::post('/mfa/challenge', [AuthController::class, 'mfaChallenge']);
        Route::post('/mfa/verify', [AuthController::class, 'mfaVerify']);
    });

    // Authenticated & Tenant-Scoped Routes
    Route::middleware(['auth:sanctum', TenantContextMiddleware::class])->group(function () {
        Route::prefix('auth')->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });

        Route::prefix('organizations')->group(function () {
            Route::get('/current', [OrganizationController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':org.view');
            Route::patch('/current', [OrganizationController::class, 'update'])
                ->middleware(EnsurePermissionMiddleware::class . ':org.update');
        });

        Route::prefix('branches')->group(function () {
            Route::get('/', [BranchController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':branches.view');
            Route::post('/', [BranchController::class, 'store'])
                ->middleware(EnsurePermissionMiddleware::class . ':branches.create');
            Route::get('/{id}', [BranchController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':branches.view');
            Route::patch('/{id}', [BranchController::class, 'update'])
                ->middleware(EnsurePermissionMiddleware::class . ':branches.update');
            Route::delete('/{id}', [BranchController::class, 'destroy'])
                ->middleware(EnsurePermissionMiddleware::class . ':branches.delete');
        });

        // User Directory & RBAC Governance Routes
        Route::prefix('users')->group(function () {
            Route::get('/', [UserController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':users.view');
            Route::post('/', [UserController::class, 'store'])
                ->middleware(EnsurePermissionMiddleware::class . ':users.create');
            Route::get('/{id}', [UserController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':users.view');
            Route::patch('/{id}', [UserController::class, 'update'])
                ->middleware(EnsurePermissionMiddleware::class . ':users.update');
            Route::delete('/{id}', [UserController::class, 'destroy'])
                ->middleware(EnsurePermissionMiddleware::class . ':users.delete');
        });

        // Vehicle Intelligence & VAHAN Verification Routes
        Route::prefix('vehicles')->group(function () {
            Route::get('/lookup', [VehicleLookupController::class, 'lookup'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::post('/lookup', [VehicleLookupController::class, 'lookup'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::post('/verify-combined', [VehicleLookupController::class, 'verifyCombined'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::get('/check-status', [VehicleLookupController::class, 'checkStatus'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::get('/profiles', [VehicleLookupController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::get('/profiles/{id}', [VehicleLookupController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
            Route::post('/profiles/{id}/refresh', [VehicleLookupController::class, 'refresh'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.lookup');
        });

        // Traffic Challans & Violations Routes
        Route::prefix('challans')->group(function () {
            Route::get('/lookup', [ChallanLookupController::class, 'lookup'])
                ->middleware(EnsurePermissionMiddleware::class . ':challans.view');
            Route::post('/lookup', [ChallanLookupController::class, 'lookup'])
                ->middleware(EnsurePermissionMiddleware::class . ':challans.view');
            Route::post('/refresh', [ChallanLookupController::class, 'refresh'])
                ->middleware(EnsurePermissionMiddleware::class . ':challans.view');
        });

        // Client & Bank Records Routes
        Route::prefix('clients')->group(function () {
            Route::get('/', [ClientController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.view');
            Route::post('/', [ClientController::class, 'store'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.create');
            Route::get('/{id}', [ClientController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.view');
            Route::patch('/{id}', [ClientController::class, 'update'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.update');
            Route::get('/{id}/branches', [ClientController::class, 'branches'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.view');
            Route::post('/{id}/branches', [ClientController::class, 'storeBranch'])
                ->middleware(EnsurePermissionMiddleware::class . ':clients.create');
        });

        // Inspection Templates Routes
        Route::prefix('inspection-templates')->group(function () {
            Route::get('/', [InspectionTemplateController::class, 'index']);
            Route::get('/{id}', [InspectionTemplateController::class, 'show']);
        });

        // Inspection Cases & Lifecycle Workflow Routes
        Route::prefix('inspections')->group(function () {
            Route::get('/', [InspectionController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.view_all');
            Route::post('/', [InspectionController::class, 'store'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.create');
            Route::get('/{id}', [InspectionController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.view_all');
            Route::post('/{id}/assign', [InspectionController::class, 'assign'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.assign');
            Route::post('/{id}/start', [InspectionController::class, 'start'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.start');
            Route::put('/{id}/checkpoints/draft', [InspectionController::class, 'saveDraft'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.update_item');
            Route::post('/{id}/submit', [InspectionController::class, 'submit'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.submit');
            Route::post('/{id}/request-correction', [InspectionController::class, 'requestCorrection'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.review');
            Route::post('/{id}/approve', [InspectionController::class, 'approve'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.approve');
            Route::post('/{id}/cancel', [InspectionController::class, 'cancel'])
                ->middleware(EnsurePermissionMiddleware::class . ':inspections.assign');

            // Evidence & Photographic Proof Routes
            Route::prefix('{id}/evidence')->group(function () {
                Route::get('/', [EvidenceController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.view_all');
                Route::post('/', [EvidenceController::class, 'store'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.upload_evidence');
                Route::post('/presign', [EvidenceController::class, 'presign'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.upload_evidence');
            });

            // Document Management & OCR Verification Routes
            Route::prefix('{id}/documents')->group(function () {
                Route::post('/ocr', [DocumentOcrController::class, 'processOcr'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.upload_evidence');
                Route::post('/compare', [DocumentOcrController::class, 'compare'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.review');
            });

            // Multi-Axle Tyre Inspection Routes
            Route::prefix('{id}/tyres')->group(function () {
                Route::get('/', [TyreInspectionController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.view_all');
                Route::post('/', [TyreInspectionController::class, 'store'])
                    ->middleware(EnsurePermissionMiddleware::class . ':inspections.update_item');
            });

            // Professional Valuation & Override Governance Routes
            Route::prefix('{id}/valuation')->group(function () {
                Route::post('/calculate', [ValuationController::class, 'calculate'])
                    ->middleware(EnsurePermissionMiddleware::class . ':valuation.view');
                Route::get('/', [ValuationController::class, 'show'])
                    ->middleware(EnsurePermissionMiddleware::class . ':valuation.view');
                Route::post('/approve', [ValuationController::class, 'approve'])
                    ->middleware(EnsurePermissionMiddleware::class . ':valuation.approve');
                Route::get('/report-check', [ValuationController::class, 'canGenerateReport'])
                    ->middleware(EnsurePermissionMiddleware::class . ':valuation.view');
            });

            // Inspection Reports & Snapshot Dossier Routes
            Route::prefix('{id}/reports')->group(function () {
                Route::post('/generate', [ReportController::class, 'generate'])
                    ->middleware(EnsurePermissionMiddleware::class . ':reports.generate');
                Route::get('/latest', [ReportController::class, 'latest'])
                    ->middleware(EnsurePermissionMiddleware::class . ':reports.view');
                Route::get('/download', [ReportController::class, 'download'])
                    ->middleware(EnsurePermissionMiddleware::class . ':reports.download');
                Route::get('/{version}', [ReportController::class, 'getVersion'])
                    ->middleware(EnsurePermissionMiddleware::class . ':reports.view');
            });
        });

        // Public Cryptographic QR Verification Route (AC-REP-02)
        Route::get('/verify-report/{token}', [ReportController::class, 'verifyPublic']);

        // Configurable Axle Layout Catalog
        Route::prefix('tyres')->group(function () {
            Route::get('/layouts', [TyreInspectionController::class, 'layouts']);
        });

        // Billing, Credit Wallets & Double-Entry Ledger Routes
        Route::prefix('billing')->group(function () {
            Route::get('/wallet', [BillingController::class, 'wallet'])
                ->middleware(EnsurePermissionMiddleware::class . ':billing.view_wallet');
            Route::get('/ledger', [BillingController::class, 'ledger'])
                ->middleware(EnsurePermissionMiddleware::class . ':billing.view_wallet');
            Route::post('/topup/initiate', [BillingController::class, 'initiateTopup'])
                ->middleware(EnsurePermissionMiddleware::class . ':billing.topup');
            Route::post('/topup/confirm', [BillingController::class, 'confirmTopup'])
                ->middleware(EnsurePermissionMiddleware::class . ':billing.topup');
            Route::get('/invoices', [BillingController::class, 'invoices'])
                ->middleware(EnsurePermissionMiddleware::class . ':billing.view_invoices');
            Route::get('/plans', [BillingController::class, 'plans']);
        });

        // Enterprise Fleet Watch & Compliance Registry
        Route::prefix('fleet')->group(function () {
            Route::get('/', [FleetController::class, 'index'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
            Route::get('/analytics', [FleetController::class, 'analytics'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
            Route::post('/', [FleetController::class, 'store'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.manage');
            Route::get('/{id}', [FleetController::class, 'show'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
            Route::patch('/{id}', [FleetController::class, 'update'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.manage');
            Route::delete('/{id}', [FleetController::class, 'destroy'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.manage');
            Route::post('/bulk/estimate', [FleetController::class, 'estimateBulk'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.bulk_verify');
            Route::post('/bulk/verify', [FleetController::class, 'verifyBulk'])
                ->middleware(EnsurePermissionMiddleware::class . ':vehicles.bulk_verify');
            Route::post('/import', [FleetController::class, 'import'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.manage');
            Route::get('/export/download', [FleetController::class, 'export'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.export');
            Route::get('/schedule/config', [FleetController::class, 'getSchedule'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
            Route::put('/schedule/config', [FleetController::class, 'updateSchedule'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.manage');
            Route::post('/schedule/run', [FleetController::class, 'runScheduledCheck'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.sync');
            Route::get('/notifications/list', [FleetController::class, 'notifications'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
            Route::post('/notifications/{id}/read', [FleetController::class, 'markNotificationRead'])
                ->middleware(EnsurePermissionMiddleware::class . ':fleet.view');
        });

        // Gateway Webhook Route
        Route::post('/billing/webhook', [BillingController::class, 'webhook']);

        // Privileged Super Admin & System Governance Endpoints
        Route::prefix('admin')->group(function () {
            Route::get('/analytics', [SuperAdminDashboardController::class, 'analytics'])
                ->middleware(EnsurePermissionMiddleware::class . ':admin.dashboard');

            // Cross-tenant Organization Management
            Route::prefix('organizations')->group(function () {
                Route::get('/', [AdminOrganizationController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.orgs');
                Route::post('/', [AdminOrganizationController::class, 'store'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.orgs');
                Route::get('/{id}', [AdminOrganizationController::class, 'show'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.orgs');
                Route::patch('/{id}', [AdminOrganizationController::class, 'update'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.orgs');
                Route::post('/{id}/credits', [AdminOrganizationController::class, 'adjustCredits'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.orgs');
            });

            // Provider Configuration & Secret Vault (Zero Secret Leakage & Invariant Gating)
            Route::prefix('providers')->group(function () {
                Route::get('/', [ProviderConfigController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
                Route::get('/verification', [ProviderConfigController::class, 'verificationReport'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
                Route::post('/test-sandbox', [ProviderConfigController::class, 'testSandbox'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
                Route::post('/validate-billing', [ProviderConfigController::class, 'validateBilling'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
                Route::post('/confirm-production', [ProviderConfigController::class, 'confirmProduction'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
                Route::patch('/{id}', [ProviderConfigController::class, 'update'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.providers');
            });

            // Feature Flags Governance
            Route::prefix('feature-flags')->group(function () {
                Route::get('/', [FeatureFlagController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.feature_flags');
                Route::patch('/', [FeatureFlagController::class, 'update'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.feature_flags');
            });

            // Report Settings & Branding
            Route::prefix('report-settings')->group(function () {
                Route::get('/', [ReportSettingsController::class, 'show'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.report_settings');
                Route::patch('/', [ReportSettingsController::class, 'update'])
                    ->middleware(EnsurePermissionMiddleware::class . ':admin.report_settings');
            });

            // Audit Logs & Security Alerts (DPDP PII Redacted)
            Route::prefix('audit')->group(function () {
                Route::get('/logs', [AuditLogController::class, 'index'])
                    ->middleware(EnsurePermissionMiddleware::class . ':audit.view');
                Route::get('/security-alerts', [AuditLogController::class, 'securityAlerts'])
                    ->middleware(EnsurePermissionMiddleware::class . ':audit.view');
            });
        });
    });
});
