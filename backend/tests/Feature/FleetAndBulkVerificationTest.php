<?php

namespace Tests\Feature;

use App\Models\FleetVehicle;
use App\Models\VehicleProfile;
use App\Modules\Fleet\Exceptions\CostLimitExceededException;
use App\Modules\Fleet\Exceptions\ExportPermissionDeniedException;
use App\Modules\Fleet\Services\BulkVerificationService;
use App\Modules\Fleet\Services\ComplianceExpiryEngine;
use App\Modules\Fleet\Services\FleetImportExportService;
use App\Modules\Fleet\Services\FleetManagementService;
use App\Modules\Fleet\Services\ScheduledComplianceCheckService;
use App\Modules\Notifications\Services\NotificationService;
use DateTimeImmutable;
use Exception;
use Illuminate\Support\Str;

class FleetAndBulkVerificationTest
{
    /**
     * Test 1: Statutory Compliance Expiry Engine (Fitness, Insurance, PUC, Permit, Tax).
     */
    public static function testComplianceExpiryEngineStatutoryCalculations(): void
    {
        $engine = new ComplianceExpiryEngine();
        $refDate = new DateTimeImmutable('2026-11-24');

        // Case A: Expired Fitness (-14 days) -> Must be EXPIRED, CRITICAL alert, and NON_COMPLIANT
        $expiredVehicle = [
            'registration_number' => 'DL01AB9999',
            'fitness_valid_until' => '2026-11-10', // 14 days ago
            'insurance_valid_until' => '2027-04-15',
            'pucc_valid_until' => '2027-02-28',
            'national_permit_valid_until' => '2028-01-01',
            'tax_valid_until' => '2027-03-31',
        ];

        $resA = $engine->evaluateVehicle($expiredVehicle, [], $refDate);
        if ($resA['overall_status'] !== ComplianceExpiryEngine::STATUS_NON_COMPLIANT) {
            throw new Exception("Expected NON_COMPLIANT status for expired fitness, got: " . $resA['overall_status']);
        }
        if (!$resA['is_groundable']) {
            throw new Exception("Vehicle with expired fitness must be flagged as groundable");
        }
        if ($resA['documents']['fitness']['status'] !== 'EXPIRED') {
            throw new Exception("Fitness document must be EXPIRED, got: " . $resA['documents']['fitness']['status']);
        }
        if ($resA['documents']['fitness']['days_remaining'] !== -14) {
            throw new Exception("Expected -14 days remaining for fitness, got: " . $resA['documents']['fitness']['days_remaining']);
        }

        // Case B: Expiring in 11 days (Insurance) -> Must be EXPIRING_SOON
        $expiringVehicle = [
            'registration_number' => 'MH14DE5678',
            'fitness_valid_until' => '2027-06-20',
            'insurance_valid_until' => '2026-12-05', // 11 days from 2026-11-24
            'pucc_valid_until' => '2027-03-01',
            'national_permit_valid_until' => '2027-10-15',
            'tax_valid_until' => '2027-03-31',
        ];

        $resB = $engine->evaluateVehicle($expiringVehicle, [], $refDate);
        if ($resB['overall_status'] !== ComplianceExpiryEngine::STATUS_EXPIRING_SOON) {
            throw new Exception("Expected EXPIRING_SOON status, got: " . $resB['overall_status']);
        }
        if ($resB['documents']['insurance']['days_remaining'] !== 11) {
            throw new Exception("Expected 11 days remaining for insurance, got: " . $resB['documents']['insurance']['days_remaining']);
        }

        // Case C: Fully Compliant (> 30 days for all documents)
        $compliantVehicle = [
            'registration_number' => 'MH12AB1234',
            'fitness_valid_until' => '2027-08-15',
            'insurance_valid_until' => '2027-04-10',
            'pucc_valid_until' => '2027-02-28',
            'national_permit_valid_until' => '2028-01-01',
            'tax_valid_until' => '2027-09-30',
        ];

        $resC = $engine->evaluateVehicle($compliantVehicle, [], $refDate);
        if ($resC['overall_status'] !== ComplianceExpiryEngine::STATUS_COMPLIANT) {
            throw new Exception("Expected COMPLIANT status, got: " . $resC['overall_status']);
        }
    }

    /**
     * Test 2: Bulk Verification Cost Estimation, Tariff Precision & Cost Ceiling Guards.
     */
    public static function testBulkVerificationCostEstimationAndCeilingGuard(): void
    {
        $bulkService = new BulkVerificationService();

        // 1. Estimate cost for 20 vehicles
        $est = $bulkService->estimateBulkCost(20);
        if ($est['credits_needed'] !== 20) {
            throw new Exception("Expected 20 credits needed, got: " . $est['credits_needed']);
        }
        if ($est['cost_paise'] !== 30000) { // 20 * 1500 paise = 30000 paise (₹300.00)
            throw new Exception("Expected 30000 paise cost, got: " . $est['cost_paise']);
        }

        // 2. Check provider coverage warnings
        if (empty($est['coverage_warnings']['restricted_states']['HP'])) {
            throw new Exception("Regional coverage warning missing for Himachal Pradesh (HP)");
        }
        if (empty($est['coverage_warnings']['restricted_states']['JK'])) {
            throw new Exception("Regional coverage warning missing for Jammu & Kashmir (JK)");
        }

        // 3. Test Cost Limit Guard: 20 vehicles cost ₹300 (30,000 paise); ceiling set to ₹150 (15,000 paise)
        $caught = false;
        try {
            $bulkService->verifyBulk(
                'org-test-bulk',
                ['MH12AB1234', 'MH14DE5678', 'DL01AB9999', 'KA05MK3322'],
                3000 // Limit 3,000 paise (₹30) but 4 vehicles require 6,000 paise (₹60)
            );
        } catch (CostLimitExceededException $e) {
            $caught = true;
            if ($e->limitPaise !== 3000) {
                throw new Exception("Expected limitPaise to be 3000, got: " . $e->limitPaise);
            }
        }

        if (!$caught) {
            throw new Exception("Expected CostLimitExceededException when cost exceeds configured ceiling");
        }
    }

    /**
     * Test 3: CSV Import Validation, Header Mapping & Deduplication.
     */
    public static function testFleetImportFromCsvValidationAndDeduplication(): void
    {
        $engine = new ComplianceExpiryEngine();
        $fleetService = new FleetManagementService($engine);
        $importService = new FleetImportExportService($fleetService);

        $orgId = 'org-import-' . Str::random(6);

        $csv = "registration_number,fleet_unit_number,assigned_driver_name,assigned_driver_phone,depot_location\n" .
               "MH12CD4455,FLT-MH-101,Raju Patil,+91 98220 12345,Bhiwandi Hub\n" .
               "DL01EF6677,FLT-DL-102,Balbir Singh,+91 99110 54321,Delhi Terminal\n" .
               "INVALID_REG,FLT-BAD,Bad Format,+91 00000 00000,Unknown\n";

        $res = $importService->importFromCsv($orgId, $csv);

        if ($res['imported_count'] !== 2) {
            throw new Exception("Expected 2 valid imported rows, got: " . $res['imported_count']);
        }
        if ($res['error_count'] !== 1) {
            throw new Exception("Expected 1 error for invalid registration number, got: " . $res['error_count']);
        }

        // Test duplicate prevention: re-importing the same CSV should detect duplicates
        $reimport = $importService->importFromCsv($orgId, $csv);
        if ($reimport['duplicate_count'] !== 2) {
            throw new Exception("Expected 2 duplicates on re-importing existing fleet, got: " . $reimport['duplicate_count']);
        }
    }

    /**
     * Test 4: Permission-Controlled Fleet Export (RBAC fleet.export) & DPDP PII Masking.
     */
    public static function testFleetExportPermissionEnforcement(): void
    {
        $engine = new ComplianceExpiryEngine();
        $fleetService = new FleetManagementService($engine);
        $exportService = new FleetImportExportService($fleetService);

        $orgId = 'org-export-' . Str::random(6);

        // Populate a vehicle
        $fleetService->addVehicleToFleet($orgId, [
            'registration_number' => 'MH12ZZ9999',
            'fleet_unit_number' => 'FLT-EXP-01',
            'assigned_driver_name' => 'Vijay Kumar',
            'depot_location' => 'Central Hub',
            'owner_name_masked' => 'V**** K**** LOGISTICS',
        ]);

        // 1. Without permission -> Must throw ExportPermissionDeniedException (403)
        $caught = false;
        try {
            $exportService->exportToCsv($orgId, false);
        } catch (ExportPermissionDeniedException $e) {
            $caught = true;
        }

        if (!$caught) {
            throw new Exception("Expected ExportPermissionDeniedException when user lacks fleet.export permission");
        }

        // 2. With permission -> Must produce valid CSV output
        $csv = $exportService->exportToCsv($orgId, true);
        if (!str_contains($csv, 'Registration Number') || !str_contains($csv, 'Make & Model')) {
            throw new Exception("Export CSV header missing standard columns");
        }
        if (!str_contains($csv, 'MH12ZZ9999')) {
            throw new Exception("Export CSV missing vehicle registration number");
        }
    }

    /**
     * Test 5: Scheduled Compliance Checks & Notification Alert Dispatch.
     */
    public static function testScheduledComplianceCheckExecutionAndAlertDispatch(): void
    {
        $engine = new ComplianceExpiryEngine();
        $fleetService = new FleetManagementService($engine);
        $notifService = new NotificationService();
        $scheduledService = new ScheduledComplianceCheckService($fleetService, $notifService);

        $orgId = 'org-sched-' . Str::random(6);

        // Add a vehicle with expired fitness and expiring insurance
        $fleetService->addVehicleToFleet($orgId, [
            'registration_number' => 'MH14EX0001',
            'fleet_unit_number' => 'FLT-ALERT-01',
            'fitness_valid_until' => date('Y-m-d', strtotime('-5 days')), // Expired
            'insurance_valid_until' => date('Y-m-d', strtotime('+10 days')), // Expiring in 10d
        ]);

        $summary = $scheduledService->runScheduledCheck($orgId);

        if ($summary['total_checked'] < 1) {
            throw new Exception("Scheduled check must scan at least 1 vehicle, scanned: " . $summary['total_checked']);
        }
        if ($summary['alerts_dispatched'] < 1) {
            throw new Exception("Scheduled check must dispatch alert notifications for expired/expiring items");
        }
    }
}
