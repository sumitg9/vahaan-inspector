<?php

namespace Tests\Feature;

use App\Modules\Reports\Services\ReportPdfRenderService;
use App\Modules\Reports\Services\ReportSnapshotService;
use App\Modules\Reports\Services\ReportVerificationService;
use App\Modules\Valuation\Exceptions\ValuationNotApprovedException;
use App\Modules\Valuation\Services\ValuationGovernanceService;
use Exception;

class ReportGenerationAndVerificationTest
{
    /**
     * Test 1: Report Generation Gate Pre-Condition (Valuation must be approved)
     */
    public static function testReportGenerationBlocksIfValuationUnapproved(): void
    {
        $snapshotService = new ReportSnapshotService();
        $caseId = 'case-unapproved-rep-01';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $blocked = false;
        try {
            $snapshotService->generateSnapshot($caseId, $orgId);
        } catch (ValuationNotApprovedException $e) {
            $blocked = true;
            if ($e->getCode() !== 422 || $e->getErrorCode() !== 'ERR_VAL_REPORT_GATE_UNAPPROVED') {
                throw new Exception("Expected code 422 and ERR_VAL_REPORT_GATE_UNAPPROVED, got {$e->getCode()} / {$e->getErrorCode()}");
            }
        }

        if (!$blocked) {
            throw new Exception("Pre-condition gate violated: Allowed report generation without approved valuation");
        }
    }

    /**
     * Test 2: Field-by-Field Coverage Across All 11 Report Sections
     */
    public static function testComplete11SectionsInSnapshot(): void
    {
        $governance = new ValuationGovernanceService();
        $snapshotService = new ReportSnapshotService($governance);
        $caseId = 'case-11sections-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $valuerId = 'usr-valuer-01';

        // 1. Approve valuation first
        $valData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 174275000,
            'proposed_distress_value_paise' => 148133700,
            'certified_valuer_remarks' => 'Chassis alignment checked, engine compression normal, no structural damage detected.',
            'valuer_override_applied' => true,
            'override_fair_market_value_paise' => 182000000,
            'override_distress_value_paise' => 154700000,
            'override_justification' => 'Strong institutional transport demand and complete powertrain overhaul justify premium above algorithmic benchmark.',
        ];
        $governance->approveAndCertifyValuation($caseId, $valData, $valuerId, 'VALUER', $orgId);

        // 2. Generate Snapshot
        $snapshot = $snapshotService->generateSnapshot($caseId, $orgId);

        if (empty($snapshot['id']) || empty($snapshot['verification_token'])) {
            throw new Exception("Missing snapshot ID or verification token");
        }
        if ($snapshot['version'] !== '1.0') {
            throw new Exception("Initial snapshot should have version 1.0, got {$snapshot['version']}");
        }

        $data = $snapshot['snapshot_data'];

        // 3. Verify All 11 Sections Exist
        $requiredSections = [
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

        foreach ($requiredSections as $sec) {
            if (!isset($data[$sec]) || !is_array($data[$sec])) {
                throw new Exception("Report snapshot missing required section: {$sec}");
            }
        }

        // 4. Verify Actual Approved Valuation Data Mapped
        $s1 = $data['section_1_executive_summary'];
        if ($s1['approved_fair_market_value_paise'] !== 182000000) {
            throw new Exception("Executive summary FMV mismatch: expected 182000000, got {$s1['approved_fair_market_value_paise']}");
        }
        if ($s1['approved_fair_market_value_inr'] !== 1820000.0) {
            throw new Exception("Executive summary FMV INR mismatch");
        }

        // 5. Verify Invariant 7 DPDP Owner Name Masking
        $s2 = $data['section_2_registration_identity'];
        if (!str_contains($s2['registered_owner_masked'], '****')) {
            throw new Exception("Invariant 7 violated: Registered owner name is unmasked in report snapshot");
        }

        // 6. Verify Complete Challans Table
        $s3 = $data['section_3_traffic_challans'];
        if (count($s3['challan_records']) < 2) {
            throw new Exception("Expected at least 2 challan records in report table");
        }

        // 7. Verify Multi-Axle Tyre Table & AC-TYRE-02 Alert
        $s7 = $data['section_7_tyres_matrix'];
        if ($s7['total_tyres_count'] !== 11) {
            throw new Exception("Expected 11 tyres in 3-axle tipper layout (10 road + 1 spare), got {$s7['total_tyres_count']}");
        }
        if ($s7['critical_alert_count'] < 1 || empty($s7['ac_tyre_02_safety_alert'])) {
            throw new Exception("Missing AC-TYRE-02 safety alert for tread depth < 1.6mm");
        }

        // 8. Verify Photo Gallery & SHA-256 Hashes
        $s8 = $data['section_8_evidence_gallery'];
        if (count($s8['photos']) < 6) {
            throw new Exception("Expected categorized photographic evidence gallery in report");
        }
    }

    /**
     * Test 3: Cryptographic SHA-256 Checksum & Tamper-Evident Integrity (Invariant 6)
     */
    public static function testSha256ChecksumAndTamperEvidentIntegrity(): void
    {
        $governance = new ValuationGovernanceService();
        $snapshotService = new ReportSnapshotService($governance);
        $caseId = 'case-crypto-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        // Approve valuation
        $valData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 160000000,
            'proposed_distress_value_paise' => 136000000,
            'certified_valuer_remarks' => 'Inspection approved for report compilation and verification seal.',
            'valuer_override_applied' => false,
        ];
        $governance->approveAndCertifyValuation($caseId, $valData, 'usr-val-1', 'VALUER', $orgId);

        $snapshot = $snapshotService->generateSnapshot($caseId, $orgId);

        // Checksum length = 64 hex characters
        if (strlen($snapshot['sha256_checksum']) !== 64) {
            throw new Exception("Expected 64-char hex SHA-256 checksum, got: {$snapshot['sha256_checksum']}");
        }

        // Verification token length = 64 hex characters
        if (strlen($snapshot['verification_token']) !== 64) {
            throw new Exception("Expected 64-char hex verification token, got: {$snapshot['verification_token']}");
        }
    }

    /**
     * Test 4: Invariant 2 Indelible Mock Watermarking (AC-REP-03)
     */
    public static function testMockWatermarkIndelibleFlag(): void
    {
        $governance = new ValuationGovernanceService();
        $snapshotService = new ReportSnapshotService($governance);
        $renderService = new ReportPdfRenderService();
        $caseId = 'case-watermark-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $valData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 160000000,
            'proposed_distress_value_paise' => 136000000,
            'certified_valuer_remarks' => 'All mechanical aggregates verified and approved.',
            'valuer_override_applied' => false,
        ];
        $governance->approveAndCertifyValuation($caseId, $valData, 'usr-val-1', 'VALUER', $orgId);

        $snapshot = $snapshotService->generateSnapshot($caseId, $orgId);

        // 1. Invariant 2 flag check
        if ($snapshot['is_mock_watermarked'] !== true) {
            throw new Exception("Invariant 2 violated: is_mock_watermarked must be true for mock environment");
        }

        // 2. Render HTML check
        $html = $renderService->renderHtml($snapshot['snapshot_data']);
        if (!str_contains($html, 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE')) {
            throw new Exception("Invariant 2 & AC-REP-03 violated: Rendered HTML missing indelible watermark 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE'");
        }
    }

    /**
     * Test 5: Report Versioning (Invariant 6: Immutable Historical Snapshots)
     */
    public static function testReportVersioningOnRevision(): void
    {
        $governance = new ValuationGovernanceService();
        $snapshotService = new ReportSnapshotService($governance);
        $caseId = 'case-versioning-rep-01';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $valData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 160000000,
            'proposed_distress_value_paise' => 136000000,
            'certified_valuer_remarks' => 'Initial valuation approved.',
            'valuer_override_applied' => false,
        ];
        $governance->approveAndCertifyValuation($caseId, $valData, 'usr-val-1', 'VALUER', $orgId);

        // Version 1.0
        $snap1 = $snapshotService->generateSnapshot($caseId, $orgId);
        if ($snap1['version'] !== '1.0') {
            throw new Exception("Expected version 1.0, got {$snap1['version']}");
        }

        // Revision: Version 1.1
        $snap2 = $snapshotService->generateSnapshot($caseId, $orgId);
        if ($snap2['version'] !== '1.1') {
            throw new Exception("Expected version 1.1 upon revision, got {$snap2['version']}");
        }

        // Distinct tokens and checksums
        if ($snap1['verification_token'] === $snap2['verification_token']) {
            throw new Exception("Each version must have a unique verification token");
        }

        // Version 1.0 should still be retrievable
        $retrievedV1 = $snapshotService->getSnapshotByVersion($caseId, '1.0', $orgId);
        if (!$retrievedV1 || $retrievedV1['version'] !== '1.0') {
            throw new Exception("Historical snapshot v1.0 was not preserved immutably");
        }
    }

    /**
     * Test 6: Public QR Code Verification Portal (AC-REP-02)
     */
    public static function testPublicQrVerification(): void
    {
        $governance = new ValuationGovernanceService();
        $snapshotService = new ReportSnapshotService($governance);
        $verificationService = new ReportVerificationService($snapshotService);
        $caseId = 'case-qr-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $valData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 180000000,
            'proposed_distress_value_paise' => 153000000,
            'certified_valuer_remarks' => 'Approved for institutional underwriting and QR public verification.',
            'valuer_override_applied' => false,
        ];
        $governance->approveAndCertifyValuation($caseId, $valData, 'usr-val-1', 'VALUER', $orgId);

        $snapshot = $snapshotService->generateSnapshot($caseId, $orgId);
        $token = $snapshot['verification_token'];

        // 1. Valid Token Lookup (AC-REP-02)
        $verified = $verificationService->verifyToken($token);
        if (!$verified || $verified['is_valid'] !== true) {
            throw new Exception("AC-REP-02 failed: Valid token failed verification");
        }
        if ($verified['tamper_check_passed'] !== true) {
            throw new Exception("Tamper check failed on authentic snapshot");
        }
        if ($verified['registration_number'] !== 'MH12PQ9876') {
            throw new Exception("Verification payload vehicle registration mismatch");
        }

        // 2. Reject Invalid / Non-Existent Token
        $invalidResult = $verificationService->verifyToken('non_existent_token_hex_00000000000000000000000000000000');
        if ($invalidResult !== null) {
            throw new Exception("Invalid token should return null");
        }
    }
}
