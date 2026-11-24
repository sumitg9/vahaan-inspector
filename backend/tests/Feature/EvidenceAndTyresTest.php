<?php

namespace Tests\Feature;

use App\Modules\Evidence\Services\DocumentComparisonService;
use App\Modules\Evidence\Services\DocumentOcrServiceInterface;
use App\Modules\Evidence\Services\EvidenceStorageService;
use App\Modules\Evidence\Services\MockDocumentOcrService;
use App\Modules\Tyres\Services\AxleLayoutService;
use App\Modules\Tyres\Services\TyreInspectionService;
use InvalidArgumentException;

class EvidenceAndTyresTest
{
    /**
     * Test 1: Evidence Upload Validation and Pre-signed S3 Partitioning
     */
    public static function testEvidenceUploadValidationAndPresigning(): void
    {
        $service = new EvidenceStorageService();
        $caseId = 'case-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $validHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

        // 1. Valid Presigned URL generation
        $presigned = $service->generatePresignedUpload(
            $caseId,
            'FRONT_45',
            'image/webp',
            1450280,
            $validHash,
            $orgId
        );

        if (!str_contains($presigned['s3_key'], "{$orgId}/inspections/{$caseId}/FRONT_45_")) {
            throw new \Exception("Multi-tenant invariant 4 violated: S3 key not partitioned under organization and case");
        }
        if ($presigned['category'] !== 'FRONT_45') {
            throw new \Exception("Mismatch category in presigned response");
        }
        if ($presigned['expires_in_seconds'] !== 900) {
            throw new \Exception("Pre-signed URL expiration should be 900 seconds (15 mins)");
        }

        // 2. Reject Invalid Category
        $invalidCatCaught = false;
        try {
            $service->generatePresignedUpload($caseId, 'ILLEGAL_CAT', 'image/webp', 1000, $validHash, $orgId);
        } catch (InvalidArgumentException $e) {
            $invalidCatCaught = true;
        }
        if (!$invalidCatCaught) {
            throw new \Exception("Expected InvalidArgumentException for unsupported category");
        }

        // 3. Reject Unsupported MIME type (e.g. video/mp4, application/exe)
        $invalidMimeCaught = false;
        try {
            $service->generatePresignedUpload($caseId, 'FRONT_45', 'application/x-msdownload', 1000, $validHash, $orgId);
        } catch (InvalidArgumentException $e) {
            $invalidMimeCaught = true;
        }
        if (!$invalidMimeCaught) {
            throw new \Exception("Expected InvalidArgumentException for unsupported MIME type");
        }

        // 4. Reject Oversized File (> 15 MB)
        $oversizedCaught = false;
        try {
            $service->generatePresignedUpload($caseId, 'FRONT_45', 'image/webp', 20 * 1024 * 1024, $validHash, $orgId);
        } catch (InvalidArgumentException $e) {
            $oversizedCaught = true;
        }
        if (!$oversizedCaught) {
            throw new \Exception("Expected InvalidArgumentException for file size exceeding 15MB");
        }

        // 5. Reject Invalid SHA-256 Hash
        $invalidHashCaught = false;
        try {
            $service->generatePresignedUpload($caseId, 'FRONT_45', 'image/webp', 1000, 'short_hash', $orgId);
        } catch (InvalidArgumentException $e) {
            $invalidHashCaught = true;
        }
        if (!$invalidHashCaught) {
            throw new \Exception("Expected InvalidArgumentException for malformed SHA-256 hash");
        }
    }

    /**
     * Test 2: Evidence Artifact Storage & EXIF GPS Coordinate Validation
     */
    public static function testEvidenceStorageAndExifGpsMetadata(): void
    {
        $service = new EvidenceStorageService();
        $caseId = 'case-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $validHash = 'c1c2c3c4c5c6c7c8c9c0d1d2d3d4d5d6d7d8d9d0e1e2e3e4e5e6e7e8e9e0f1f2';

        $stored = $service->storeEvidence([
            'inspection_case_id' => $caseId,
            'category' => 'DAMAGE',
            's3_key' => "{$orgId}/inspections/{$caseId}/DAMAGE_20261124_11223344.webp",
            'file_size_bytes' => 1120000,
            'mime_type' => 'image/webp',
            'sha256_hash' => $validHash,
            'latitude' => 18.5204,
            'longitude' => 73.8567,
            'is_damage_proof' => true,
            'caption' => 'Tailgate dent with paint scratch',
        ], $orgId);

        if ($stored['category'] !== 'DAMAGE') {
            throw new \Exception("Stored category mismatch");
        }
        if ($stored['latitude'] !== 18.5204 || $stored['longitude'] !== 73.8567) {
            throw new \Exception("EXIF GPS coordinates not stored correctly");
        }
        if ($stored['is_damage_proof'] !== true) {
            throw new \Exception("Damage proof flag not preserved");
        }

        // Cross-Tenant S3 Key Protection
        $crossTenantCaught = false;
        try {
            $service->storeEvidence([
                'inspection_case_id' => $caseId,
                'category' => 'ODOMETER',
                's3_key' => "other-org-9999/inspections/{$caseId}/ODOMETER.webp",
                'file_size_bytes' => 500000,
                'mime_type' => 'image/webp',
                'sha256_hash' => $validHash,
            ], $orgId);
        } catch (InvalidArgumentException $e) {
            $crossTenantCaught = true;
        }
        if (!$crossTenantCaught) {
            throw new \Exception("Tenant security failure: Allowed S3 key from outside organization path");
        }
    }

    /**
     * Test 3: Document OCR Abstraction & VAHAN Registry Comparison Discrepancy Detection
     */
    public static function testDocumentOcrAndRegistryComparison(): void
    {
        $ocrService = new MockDocumentOcrService();
        $comparisonService = new DocumentComparisonService();

        $canonical = [
            'registration_number' => 'MH12AB1234',
            'chassis_number' => 'MAT621045K8Z12345',
            'vin_masked' => 'MAT621045K8Z12345',
            'engine_number' => '497TC92XYZ56789',
            'engine_number_masked' => '497TC92XYZ56789',
            'owner_name' => 'M/S LOGISTICS INDIA PRIVATE LIMITED',
        ];

        // 1. Standard Authentic Document Scenario -> 100% Match
        $authDoc = $ocrService->extractDocumentData('RC_SMART_CARD', 'dummy_s3_key', ['scenario' => 'standard']);
        $matchResult = $comparisonService->compareDocumentWithRegistry($authDoc['extracted_fields'], $canonical);

        if ($matchResult['status'] !== 'MATCH') {
            throw new \Exception("Expected MATCH status for authentic RC document, got: {$matchResult['status']}");
        }
        if ($matchResult['overall_match_percentage'] < 90) {
            throw new \Exception("Match score should be >= 90% for authentic RC, got: {$matchResult['overall_match_percentage']}%");
        }
        if (!empty($matchResult['discrepancies'])) {
            throw new \Exception("Authentic document should have zero discrepancies");
        }

        // 2. Tampered Chassis VIN Discrepancy Scenario -> DISCREPANCY_DETECTED
        $discrepantDoc = $ocrService->extractDocumentData('RC_SMART_CARD', 'dummy_s3_key', ['scenario' => 'discrepancy']);
        $discrepancyResult = $comparisonService->compareDocumentWithRegistry($discrepantDoc['extracted_fields'], $canonical);

        if ($discrepancyResult['status'] !== 'DISCREPANCY_DETECTED') {
            throw new \Exception("Expected DISCREPANCY_DETECTED status for tampered chassis, got: {$discrepancyResult['status']}");
        }
        if (empty($discrepancyResult['discrepancies'])) {
            throw new \Exception("Expected discrepancies list to flag chassis suffix divergence");
        }

        // 3. Expired Insurance Policy -> Flags EXPIRED
        $expiredDoc = $ocrService->extractDocumentData('INSURANCE_POLICY', 'dummy_s3_key', ['scenario' => 'expired']);
        $expiredResult = $comparisonService->compareDocumentWithRegistry($expiredDoc['extracted_fields'], $canonical);

        if ($expiredResult['field_comparisons']['validity']['status'] !== 'EXPIRED') {
            throw new \Exception("Expected validity status to be EXPIRED");
        }
    }

    /**
     * Test 4: Configurable Axle Layout Catalog (2-Axle, 3-Axle 10-Wheeler, 4-Axle)
     */
    public static function testConfigurableAxleLayouts(): void
    {
        $layoutService = new AxleLayoutService();

        $allLayouts = $layoutService->getConfigurations();
        if (count($allLayouts) < 4) {
            throw new \Exception("Expected at least 4 standard axle configurations");
        }

        // Test 3-Axle 10-Wheeler Tipper Layout (AC-TYRE-01)
        $tipperLayout = $layoutService->getConfiguration('3_AXLE_10W');
        if (!$tipperLayout) {
            throw new \Exception("Missing 3_AXLE_10W configuration");
        }
        if ($tipperLayout['axles_count'] !== 3) {
            throw new \Exception("3_AXLE_10W must specify 3 axles");
        }
        if ($tipperLayout['road_wheels_count'] !== 10) {
            throw new \Exception("3_AXLE_10W must have exactly 10 road wheels");
        }
        if ($tipperLayout['total_wheels_count'] !== 11) {
            throw new \Exception("3_AXLE_10W must have 11 total wheels (10 road + 1 spare)");
        }

        // Auto-detect HCV Tipper
        $detected = $layoutService->detectLayoutForCategory('COMMERCIAL_HEAVY', 3);
        if ($detected['code'] !== '3_AXLE_10W') {
            throw new \Exception("Failed to detect 3_AXLE_10W for COMMERCIAL_HEAVY vehicle");
        }
    }

    /**
     * Test 5: Position-Accurate Tyre Assessment (AC-TYRE-01) & Tread Depth Safety Invariant (AC-TYRE-02)
     */
    public static function testTyreAssessmentAndTreadDepthSafetyValidation(): void
    {
        $service = new TyreInspectionService();
        $caseId = 'case-tyre-test';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        // 11 Wheels for 3-Axle Commercial Tipper (AC-TYRE-01)
        $testTyres = [
            ['axle_number' => 1, 'position' => 'FRONT_LEFT', 'brand' => 'MRF', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 12.0, 'condition' => 'GOOD'],
            ['axle_number' => 1, 'position' => 'FRONT_RIGHT', 'brand' => 'MRF', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 11.5, 'condition' => 'GOOD'],
            ['axle_number' => 2, 'position' => 'AXLE2_LEFT_OUTER', 'brand' => 'APOLLO', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 9.0, 'condition' => 'GOOD'],
            ['axle_number' => 2, 'position' => 'AXLE2_LEFT_INNER', 'brand' => 'APOLLO', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 8.5, 'condition' => 'GOOD'],
            ['axle_number' => 2, 'position' => 'AXLE2_RIGHT_INNER', 'brand' => 'APOLLO', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 9.2, 'condition' => 'GOOD'],
            ['axle_number' => 2, 'position' => 'AXLE2_RIGHT_OUTER', 'brand' => 'APOLLO', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 8.8, 'condition' => 'GOOD'],
            ['axle_number' => 3, 'position' => 'AXLE3_LEFT_OUTER', 'brand' => 'JK TYRE', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 5.0, 'condition' => 'AVERAGE'],
            ['axle_number' => 3, 'position' => 'AXLE3_LEFT_INNER', 'brand' => 'JK TYRE', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 4.8, 'condition' => 'AVERAGE'],
            // AC-TYRE-02 Test: Inspector logs 1.2 mm (< 1.6 mm legal limit) with condition "GOOD"
            ['axle_number' => 3, 'position' => 'AXLE3_RIGHT_INNER', 'brand' => 'JK TYRE', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 1.2, 'condition' => 'GOOD'],
            ['axle_number' => 3, 'position' => 'AXLE3_RIGHT_OUTER', 'brand' => 'JK TYRE', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 4.5, 'condition' => 'AVERAGE'],
            ['axle_number' => 0, 'position' => 'SPARE', 'brand' => 'MRF', 'size_spec' => '295/90 R20', 'tread_depth_mm' => 14.0, 'condition' => 'EXCELLENT'],
        ];

        $result = $service->recordTyreAssessment($caseId, $testTyres, $orgId);

        if ($result['recorded_count'] !== 11) {
            throw new \Exception("AC-TYRE-01 failed: Expected exactly 11 wheels recorded, got {$result['recorded_count']}");
        }

        // AC-TYRE-02 Validation:
        // Position AXLE3_RIGHT_INNER had tread 1.2 mm and was passed as "GOOD".
        // The system MUST have strictly forced condition to WORN_OUT.
        $wornTyre = null;
        foreach ($result['tyres'] as $t) {
            if ($t['position'] === 'AXLE3_RIGHT_INNER') {
                $wornTyre = $t;
                break;
            }
        }

        if (!$wornTyre) {
            throw new \Exception("Could not find tyre at position AXLE3_RIGHT_INNER");
        }
        if ($wornTyre['condition'] !== 'WORN_OUT') {
            throw new \Exception("AC-TYRE-02 violated: Tyre with tread depth 1.2mm (< 1.6mm) was NOT forced to WORN_OUT. Current condition: {$wornTyre['condition']}");
        }
        if ($wornTyre['remaining_life_pct'] > 15) {
            throw new \Exception("AC-TYRE-02 violated: Remaining life percentage for sub-1.6mm tyre must be <= 15%");
        }

        // Check Metrics and Refurbishment Cost
        $metrics = $result['metrics'];
        if ($metrics['worn_out_count'] !== 1) {
            throw new \Exception("Expected exactly 1 worn out tyre, found {$metrics['worn_out_count']}");
        }
        if ($metrics['critical_safety_alert'] !== true) {
            throw new \Exception("Expected critical safety alert to be true due to sub-1.6mm tread");
        }
        if ($metrics['estimated_refurbishment_cost_inr'] !== 26500) {
            throw new \Exception("Expected refurbishment cost ₹26,500, got ₹{$metrics['estimated_refurbishment_cost_inr']}");
        }
    }
}
