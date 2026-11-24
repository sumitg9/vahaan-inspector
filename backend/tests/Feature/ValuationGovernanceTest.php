<?php

namespace Tests\Feature;

use App\Modules\Valuation\Exceptions\UnauthorizedValuerException;
use App\Modules\Valuation\Exceptions\ValuationException;
use App\Modules\Valuation\Exceptions\ValuationNotApprovedException;
use App\Modules\Valuation\Exceptions\ValuationOverrideJustificationException;
use App\Modules\Valuation\Services\ValuationCalculatorService;
use App\Modules\Valuation\Services\ValuationGovernanceService;
use InvalidArgumentException;

class ValuationGovernanceTest
{
    /**
     * Test 1: Algorithmic Estimate Calculation, AC-VAL-01 Separation & Monetary Precision
     */
    public static function testAlgorithmicEstimateCalculationAndSeparation(): void
    {
        $calculator = new ValuationCalculatorService();
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $inputs = [
            'vehicle_category' => 'COMMERCIAL_HEAVY',
            'ex_showroom_price_paise' => 400000000, // ₹40,00,000 in paise
            'age_in_months' => 36, // 36 months = 30% depreciation
            'odometer_reading_km' => 200000, // Expected 180,000 km -> 20,000 excess km
            'body_score' => 8, // 2 points below 10 -> 4% deduction
            'mechanical_score' => 8, // 2 points below 10 -> 5% deduction
            'electrical_score' => 9, // 1 point below 10 -> 1.5% deduction
            'repair_estimates_paise' => 5000000, // ₹50,000 repair
            'tyre_refurbishment_paise' => 4000000, // ₹40,000 tyre refurbishment
        ];

        $estimate = $calculator->calculateAlgorithmicValuation($inputs, $orgId);

        // 1. Invariant AC-VAL-01: Explicit labeling as 'Proposed Algorithmic Estimate' and not certified
        if ($estimate['valuation_type'] !== 'Proposed Algorithmic Estimate') {
            throw new \Exception("Invariant AC-VAL-01 violated: Uncertified valuation must be labeled 'Proposed Algorithmic Estimate', got: " . $estimate['valuation_type']);
        }
        if ($estimate['is_certified'] !== false) {
            throw new \Exception("Invariant AC-VAL-01 violated: Algorithmic valuation must have is_certified = false");
        }

        // 2. Invariant 5: Monetary precision in 64-bit integer paise (minor units)
        $paiseKeys = [
            'ex_showroom_price_paise',
            'base_depreciated_value_paise',
            'odometer_adjustment_paise',
            'condition_deduction_paise',
            'estimated_repair_refurbishment_paise',
            'proposed_fair_market_value_paise',
            'proposed_distress_value_paise',
        ];
        foreach ($paiseKeys as $key) {
            if (!isset($estimate[$key]) || !is_int($estimate[$key])) {
                throw new \Exception("Invariant 5 violated: {$key} must be an integer paise minor unit, got " . gettype($estimate[$key] ?? null));
            }
        }

        // 3. Verify Depreciation Curve: 36 months = 30%
        if ($estimate['age_depreciation_pct'] !== 30.0) {
            throw new \Exception("Expected 30.0% age depreciation for 36 months, got: " . $estimate['age_depreciation_pct']);
        }
        // Base depreciated: ₹40L * 70% = ₹28L (280000000 paise)
        if ($estimate['base_depreciated_value_paise'] !== 280000000) {
            throw new \Exception("Expected base depreciated value 280,000,000 paise, got: " . $estimate['base_depreciated_value_paise']);
        }

        // 4. Verify Distress Value Haircut: 15% discount from FMV
        $expectedDistress = (int) round($estimate['proposed_fair_market_value_paise'] * 0.85);
        if ($estimate['proposed_distress_value_paise'] !== $expectedDistress) {
            throw new \Exception("Expected distress value {$expectedDistress} paise (15% haircut), got: " . $estimate['proposed_distress_value_paise']);
        }

        // 5. Verify Scrap Value Floor (15% of ex-showroom = 60,000,000 paise)
        $floorInputs = array_merge($inputs, [
            'age_in_months' => 120, // 10 years -> high depreciation
            'odometer_reading_km' => 1000000,
            'body_score' => 1,
            'mechanical_score' => 1,
            'electrical_score' => 1,
            'repair_estimates_paise' => 500000000,
        ]);
        $floorEstimate = $calculator->calculateAlgorithmicValuation($floorInputs, $orgId);
        $expectedFloorPaise = (int) round(400000000 * 0.15); // 60,000,000 paise
        if ($floorEstimate['proposed_fair_market_value_paise'] < $expectedFloorPaise) {
            throw new \Exception("Scrap value floor violated: FMV ({$floorEstimate['proposed_fair_market_value_paise']}) fell below 15% floor ({$expectedFloorPaise})");
        }

        // 6. Verify Methodology and Regulatory Assumptions
        if (empty($estimate['valuation_methodology']) || empty($estimate['assumptions'])) {
            throw new \Exception("Missing regulatory valuation methodology or actuarial assumptions");
        }
    }

    /**
     * Test 2: Invariant AC-VAL-02 Mandatory Written Justification for Override (min 30 chars)
     */
    public static function testMandatoryOverrideJustificationValidation(): void
    {
        $governance = new ValuationGovernanceService();
        $caseId = 'case-override-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $valuerId = 'usr-valuer-01';

        $baseData = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 180000000,
            'proposed_distress_value_paise' => 153000000,
            'certified_valuer_remarks' => 'Powertrain and chassis inspected thoroughly; vehicle in roadworthy state.',
            'valuer_override_applied' => true,
            'override_fair_market_value_paise' => 195000000,
            'override_distress_value_paise' => 165750000,
        ];

        // 1. Rejects missing / empty override justification
        $emptyCaught = false;
        try {
            $data = $baseData;
            $data['override_justification'] = '';
            $governance->approveAndCertifyValuation($caseId, $data, $valuerId, 'VALUER', $orgId);
        } catch (ValuationOverrideJustificationException $e) {
            $emptyCaught = true;
            if ($e->getCode() !== 422 || $e->getErrorCode() !== 'ERR_VAL_OVERRIDE_JUSTIFICATION_TOO_SHORT') {
                throw new \Exception("Expected code 422 and ERR_VAL_OVERRIDE_JUSTIFICATION_TOO_SHORT, got: {$e->getCode()} / {$e->getErrorCode()}");
            }
        }
        if (!$emptyCaught) {
            throw new \Exception("Invariant AC-VAL-02 violated: Allowed empty override justification without exception");
        }

        // 2. Rejects override justification shorter than 30 characters
        $shortCaught = false;
        try {
            $data = $baseData;
            $data['override_justification'] = 'Market demand high.'; // 19 chars < 30 chars
            $governance->approveAndCertifyValuation($caseId, $data, $valuerId, 'VALUER', $orgId);
        } catch (ValuationOverrideJustificationException $e) {
            $shortCaught = true;
        }
        if (!$shortCaught) {
            throw new \Exception("Invariant AC-VAL-02 violated: Allowed short override justification (< 30 chars) without exception");
        }

        // 3. Accepts valid override justification (>= 30 characters)
        $validJustification = 'Local secondary mining transport demand and recently rebuilt engine justify 8% premium above algorithmic estimate.';
        $data = $baseData;
        $data['override_justification'] = $validJustification;

        $approved = $governance->approveAndCertifyValuation($caseId, $data, $valuerId, 'VALUER', $orgId);

        if (!$approved['is_certified']) {
            throw new \Exception("Expected approved valuation to be certified");
        }
        if ($approved['valuation_type'] !== 'Certified Valuation Dossier') {
            throw new \Exception("Expected valuation_type 'Certified Valuation Dossier', got: " . $approved['valuation_type']);
        }
        if ($approved['final_fair_market_value_paise'] !== 195000000) {
            throw new \Exception("Expected final FMV to match override 195,000,000 paise, got: " . $approved['final_fair_market_value_paise']);
        }
        if ($approved['override_justification'] !== $validJustification) {
            throw new \Exception("Override justification mismatch");
        }
    }

    /**
     * Test 3: Professional Remarks Mandatory Validation (min 10 characters)
     */
    public static function testProfessionalRemarksValidation(): void
    {
        $governance = new ValuationGovernanceService();
        $caseId = 'case-remarks-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $valuerId = 'usr-valuer-01';

        $data = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_PASSENGER',
            'proposed_fair_market_value_paise' => 85000000,
            'proposed_distress_value_paise' => 72250000,
            'valuer_override_applied' => false,
            'certified_valuer_remarks' => 'Good car', // 8 chars < 10 chars
        ];

        $caught = false;
        try {
            $governance->approveAndCertifyValuation($caseId, $data, $valuerId, 'VALUER', $orgId);
        } catch (InvalidArgumentException $e) {
            $caught = true;
        }
        if (!$caught) {
            throw new \Exception("Expected InvalidArgumentException for professional remarks < 10 characters");
        }
    }

    /**
     * Test 4: Role-Based Authorization for Valuation Approval
     */
    public static function testUnauthorizedValuerRoleRejection(): void
    {
        $governance = new ValuationGovernanceService();
        $caseId = 'case-rbac-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $userId = 'usr-inspector-01';

        $data = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 150000000,
            'proposed_distress_value_paise' => 127500000,
            'certified_valuer_remarks' => 'Complete physical and powertrain inspection conducted.',
            'valuer_override_applied' => false,
        ];

        // 1. Unauthorized roles (INSPECTOR, CLIENT_VIEWER, OFFICE_STAFF)
        $unauthorizedRoles = ['INSPECTOR', 'CLIENT_VIEWER', 'OFFICE_STAFF'];
        foreach ($unauthorizedRoles as $role) {
            $caught = false;
            try {
                $governance->approveAndCertifyValuation($caseId, $data, $userId, $role, $orgId);
            } catch (UnauthorizedValuerException $e) {
                $caught = true;
                if ($e->getCode() !== 403 || $e->getErrorCode() !== 'ERR_VAL_UNAUTHORIZED_ROLE') {
                    throw new \Exception("Expected HTTP 403 and ERR_VAL_UNAUTHORIZED_ROLE for role {$role}");
                }
            }
            if (!$caught) {
                throw new \Exception("Unauthorized role {$role} was allowed to certify valuation");
            }
        }

        // 2. Authorized roles (VALUER, MANAGER, ORG_ADMIN, SUPER_ADMIN)
        $authorizedRoles = ['VALUER', 'MANAGER', 'ORG_ADMIN', 'SUPER_ADMIN'];
        foreach ($authorizedRoles as $role) {
            $approved = $governance->approveAndCertifyValuation("case-rbac-{$role}", $data, $userId, $role, $orgId);
            if (!$approved['is_certified']) {
                throw new \Exception("Expected role {$role} to be authorized to certify valuation");
            }
        }
    }

    /**
     * Test 5: Historical Version Snapshot Preservation
     */
    public static function testHistoricalVersionSnapshotPreservation(): void
    {
        $governance = new ValuationGovernanceService();
        $caseId = 'case-versioning-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $valuerId = 'usr-valuer-01';

        // 1. Initial Approval: Version 1
        $dataV1 = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 180000000,
            'proposed_distress_value_paise' => 153000000,
            'certified_valuer_remarks' => 'Initial inspection and valuation completed per market norms.',
            'valuer_override_applied' => false,
        ];
        $approvedV1 = $governance->approveAndCertifyValuation($caseId, $dataV1, $valuerId, 'VALUER', $orgId);

        if (count($approvedV1['version_history']) !== 0) {
            throw new \Exception("First approval should have empty version_history");
        }

        // 2. Second Approval (Revision): Version 2 - Should archive V1 into version_history
        $dataV2 = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 180000000,
            'proposed_distress_value_paise' => 153000000,
            'certified_valuer_remarks' => 'Revised appraisal with updated market comps following fleet re-assessment.',
            'valuer_override_applied' => true,
            'override_fair_market_value_paise' => 192000000,
            'override_distress_value_paise' => 163200000,
            'override_justification' => 'Secondary market quotes indicate 6.7% premium due to immediate local deployment.',
        ];
        $approvedV2 = $governance->approveAndCertifyValuation($caseId, $dataV2, $valuerId, 'VALUER', $orgId);

        if (count($approvedV2['version_history']) !== 1) {
            throw new \Exception("Expected 1 historical version snapshot in version_history, got: " . count($approvedV2['version_history']));
        }

        $v1Snapshot = $approvedV2['version_history'][0];
        if ($v1Snapshot['version'] !== 1) {
            throw new \Exception("Expected archived version 1, got: " . $v1Snapshot['version']);
        }
        if ($v1Snapshot['fair_market_value_paise'] !== 180000000) {
            throw new \Exception("Archived V1 FMV mismatch: expected 180000000, got: " . $v1Snapshot['fair_market_value_paise']);
        }
        if ($approvedV2['final_fair_market_value_paise'] !== 192000000) {
            throw new \Exception("Current V2 FMV mismatch: expected 192000000, got: " . $approvedV2['final_fair_market_value_paise']);
        }
    }

    /**
     * Test 6: Report Generation Approval Gate Pre-Condition
     */
    public static function testReportGenerationApprovalGate(): void
    {
        $governance = new ValuationGovernanceService();
        $caseIdUnapproved = 'case-gate-unapproved-001';
        $caseIdApproved = 'case-gate-approved-001';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';
        $valuerId = 'usr-valuer-01';

        // 1. Unapproved case throws ValuationNotApprovedException
        $blockedCaught = false;
        try {
            $governance->verifyApprovalBeforeReportGeneration($caseIdUnapproved, $orgId);
        } catch (ValuationNotApprovedException $e) {
            $blockedCaught = true;
            if ($e->getCode() !== 422 || $e->getErrorCode() !== 'ERR_VAL_REPORT_GATE_UNAPPROVED') {
                throw new \Exception("Expected code 422 and ERR_VAL_REPORT_GATE_UNAPPROVED, got: {$e->getCode()} / {$e->getErrorCode()}");
            }
        }
        if (!$blockedCaught) {
            throw new \Exception("Report generation gate violated: Allowed unapproved valuation without exception");
        }

        // 2. Approved and certified case passes gate
        $data = [
            'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE_COMMERCIAL',
            'proposed_fair_market_value_paise' => 165000000,
            'proposed_distress_value_paise' => 140250000,
            'certified_valuer_remarks' => 'Dossier approved for institutional underwriting report generation.',
            'valuer_override_applied' => false,
        ];
        $governance->approveAndCertifyValuation($caseIdApproved, $data, $valuerId, 'VALUER', $orgId);

        $passed = $governance->verifyApprovalBeforeReportGeneration($caseIdApproved, $orgId);
        if ($passed !== true) {
            throw new \Exception("Expected approved valuation to pass report generation gate");
        }
    }
}
