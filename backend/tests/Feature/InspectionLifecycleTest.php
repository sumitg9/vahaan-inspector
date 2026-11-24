<?php

namespace Tests\Feature;

use App\Modules\Clients\Services\ClientService;
use App\Modules\Inspections\Exceptions\InspectionException;
use App\Modules\Inspections\Exceptions\InvalidStateTransitionException;
use App\Modules\Inspections\Exceptions\MandatoryCorrectionNotesMissingException;
use App\Modules\Inspections\Exceptions\UnauthorizedTransitionException;
use App\Modules\Inspections\Exceptions\UntestedCheckpointDefaultException;
use App\Modules\Inspections\Services\InspectionCaseStateMachine;
use App\Modules\Inspections\Services\InspectionService;
use App\Modules\Permissions\PermissionMatrix;

class InspectionLifecycleTest
{
    /**
     * Test 1: Full Valid State Machine Lifecycle Transition Sequence
     * DRAFT -> ASSIGNED -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> APPROVED
     */
    public static function testValidLifecycleTransitions(): void
    {
        // 1. DRAFT -> ASSIGNED (Role: MANAGER or ORG_ADMIN)
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_DRAFT,
            InspectionCaseStateMachine::STATUS_ASSIGNED,
            'MANAGER'
        );

        // 2. ASSIGNED -> IN_PROGRESS (Role: INSPECTOR)
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_ASSIGNED,
            InspectionCaseStateMachine::STATUS_IN_PROGRESS,
            'INSPECTOR'
        );

        // 3. IN_PROGRESS -> SUBMITTED (Role: INSPECTOR)
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_IN_PROGRESS,
            InspectionCaseStateMachine::STATUS_SUBMITTED,
            'INSPECTOR'
        );

        // 4. SUBMITTED -> UNDER_REVIEW (Role: VALUER or MANAGER)
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_SUBMITTED,
            InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
            'VALUER'
        );

        // 5. UNDER_REVIEW -> APPROVED (Role: VALUER)
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
            InspectionCaseStateMachine::STATUS_APPROVED,
            'VALUER'
        );

        // Check allowed transitions helper
        $allowedForValuer = InspectionCaseStateMachine::getAllowedTransitions(
            InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
            'VALUER'
        );
        if (!in_array(InspectionCaseStateMachine::STATUS_APPROVED, $allowedForValuer, true)) {
            throw new \Exception("Valuer must be allowed to transition UNDER_REVIEW -> APPROVED");
        }
        if (!in_array(InspectionCaseStateMachine::STATUS_CORRECTION_REQUESTED, $allowedForValuer, true)) {
            throw new \Exception("Valuer must be allowed to transition UNDER_REVIEW -> CORRECTION_REQUESTED");
        }
    }

    /**
     * Test 2: Invalid State Machine Transitions (Skipping States)
     * e.g., DRAFT -> APPROVED or SUBMITTED -> IN_PROGRESS directly
     */
    public static function testInvalidStateTransitions(): void
    {
        $caught = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_DRAFT,
                InspectionCaseStateMachine::STATUS_APPROVED,
                'SUPER_ADMIN'
            );
        } catch (InvalidStateTransitionException $e) {
            $caught = true;
        }

        if (!$caught) {
            throw new \Exception("Expected InvalidStateTransitionException when leaping DRAFT -> APPROVED");
        }

        // Terminal State Lock: APPROVED cannot transition back to IN_PROGRESS
        $caughtTerminal = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_APPROVED,
                InspectionCaseStateMachine::STATUS_IN_PROGRESS,
                'SUPER_ADMIN'
            );
        } catch (InvalidStateTransitionException $e) {
            $caughtTerminal = true;
        }

        if (!$caughtTerminal) {
            throw new \Exception("Expected InvalidStateTransitionException when transitioning from terminal APPROVED state");
        }
    }

    /**
     * Test 3: Role Authorization Boundaries on State Machine Transitions
     */
    public static function testRoleTransitionAuthorization(): void
    {
        // INSPECTOR cannot approve a case
        $inspectorApproveBlocked = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
                InspectionCaseStateMachine::STATUS_APPROVED,
                'INSPECTOR'
            );
        } catch (UnauthorizedTransitionException $e) {
            $inspectorApproveBlocked = true;
        }

        if (!$inspectorApproveBlocked) {
            throw new \Exception("INSPECTOR role must be blocked from approving cases");
        }

        // VALUER cannot submit a case as a field surveyor
        $valuerSubmitBlocked = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_IN_PROGRESS,
                InspectionCaseStateMachine::STATUS_SUBMITTED,
                'VALUER'
            );
        } catch (UnauthorizedTransitionException $e) {
            $valuerSubmitBlocked = true;
        }

        if (!$valuerSubmitBlocked) {
            throw new \Exception("VALUER role must be blocked from submitting cases as field inspector");
        }

        // CLIENT_VIEWER is strictly read-only and cannot trigger any state change
        $viewerBlocked = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_DRAFT,
                InspectionCaseStateMachine::STATUS_ASSIGNED,
                'CLIENT_VIEWER'
            );
        } catch (UnauthorizedTransitionException $e) {
            $viewerBlocked = true;
        }

        if (!$viewerBlocked) {
            throw new \Exception("CLIENT_VIEWER role must be blocked from all state transitions");
        }
    }

    /**
     * Test 4: Architectural Invariant 3 (Prohibition of Data Fabrication)
     * Checkpoints must default strictly to 'not_checked'. Unverified items cannot be submitted as pass/fail.
     */
    public static function testUntestedCheckpointsDefaultToNotChecked(): void
    {
        $service = new InspectionService();
        $caseId = 'case-test-fabrication';
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $draftResponses = [
            [
                'section_key' => 'exterior',
                'item_key' => 'cabin_structure',
                'rating' => 'pass',
                'verified_physically' => true, // Verified physically on-site
                'remarks' => 'Cabin mountings intact',
            ],
            [
                'section_key' => 'exterior',
                'item_key' => 'windshield_glass',
                'rating' => 'pass',
                'verified_physically' => false, // UNVERIFIED! Must be forced to not_checked
                'remarks' => 'Untested, attempted fabrication',
            ],
            [
                'section_key' => 'powertrain',
                'item_key' => 'engine_smoke',
                'rating' => 'invalid_rating_value',
                'verified_physically' => false,
                'remarks' => null,
            ],
        ];

        $result = $service->saveDraftCheckpoints($caseId, $draftResponses, $orgId);

        $saved = $result['checkpoints'];
        if ($saved[0]['rating'] !== 'pass') {
            throw new \Exception("Physically verified item should preserve rating 'pass'");
        }
        if ($saved[1]['rating'] !== InspectionService::RATING_NOT_CHECKED) {
            throw new \Exception("Prohibition of Data Fabrication violated: unverified item must be forced to 'not_checked'");
        }
        if ($saved[2]['rating'] !== InspectionService::RATING_NOT_CHECKED) {
            throw new \Exception("Invalid rating value must default to 'not_checked'");
        }
    }

    /**
     * Test 5: Quality Control Invariant: Correction Request Mandatory Remarks
     * Rejection / Correction requests MUST have non-empty mandatory remarks.
     */
    public static function testMandatoryCorrectionRemarks(): void
    {
        // 1. Missing remarks (null)
        $caughtNull = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
                InspectionCaseStateMachine::STATUS_CORRECTION_REQUESTED,
                'VALUER',
                null
            );
        } catch (MandatoryCorrectionNotesMissingException $e) {
            $caughtNull = true;
        }

        if (!$caughtNull) {
            throw new \Exception("Expected MandatoryCorrectionNotesMissingException when remarks are null");
        }

        // 2. Empty string remarks
        $caughtEmpty = false;
        try {
            InspectionCaseStateMachine::applyTransition(
                InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
                InspectionCaseStateMachine::STATUS_CORRECTION_REQUESTED,
                'VALUER',
                '   '
            );
        } catch (MandatoryCorrectionNotesMissingException $e) {
            $caughtEmpty = true;
        }

        if (!$caughtEmpty) {
            throw new \Exception("Expected MandatoryCorrectionNotesMissingException when remarks are whitespace");
        }

        // 3. Valid non-empty remarks succeed
        InspectionCaseStateMachine::applyTransition(
            InspectionCaseStateMachine::STATUS_UNDER_REVIEW,
            InspectionCaseStateMachine::STATUS_CORRECTION_REQUESTED,
            'VALUER',
            'Odometer snapshot is blurry; please recapture clear odometer photo.'
        );
    }

    /**
     * Test 6: Multi-Tenant Scoping and Isolation for Client and Bank Records
     */
    public static function testClientAndBankBranchMultiTenancy(): void
    {
        $clientService = new ClientService();
        $orgA = 'org-11111111-1111-1111-1111-111111111111';
        $orgB = 'org-22222222-2222-2222-2222-222222222222';

        // Create client under Org A
        $clientA = $clientService->createClient([
            'name' => 'State Bank of India',
            'client_type' => 'BANK',
            'contact_person' => 'Ramesh Verma',
            'email' => 'ramesh.verma@sbi.example.com',
            'phone' => '+91 98200 88888',
        ], $orgA);

        if ($clientA['organization_id'] !== $orgA) {
            throw new \Exception("Client organization_id mismatch");
        }

        // Org B must NOT be able to view Org A's client
        $crossTenantAccess = $clientService->getClient($clientA['id'], $orgB);
        if ($crossTenantAccess !== null) {
            throw new \Exception("Cross-tenant isolation leak: Org B accessed Org A's client");
        }

        // Create bank branch under Client A
        $branch = $clientService->createBankBranch($clientA['id'], [
            'branch_name' => 'SBI Corporate Centre Mumbai',
            'branch_code' => 'SBIN0000001',
            'city' => 'Mumbai',
            'state' => 'Maharashtra',
        ], $orgA);

        if ($branch['client_id'] !== $clientA['id']) {
            throw new \Exception("Bank branch client_id mismatch");
        }

        // Org B cannot add branch to Org A's client
        $caughtCrossBranch = false;
        try {
            $clientService->createBankBranch($clientA['id'], [
                'branch_name' => 'Illegal Branch',
                'branch_code' => 'ILLEGAL01',
                'city' => 'Delhi',
                'state' => 'Delhi',
            ], $orgB);
        } catch (\InvalidArgumentException $e) {
            $caughtCrossBranch = true;
        }

        if (!$caughtCrossBranch) {
            throw new \Exception("Cross-tenant leak: Org B added branch to Org A's client");
        }
    }

    /**
     * Test 7: Inspection Case Creation and Scoped Querying
     */
    public static function testInspectionCaseCreationAndScoping(): void
    {
        $inspectionService = new InspectionService();
        $orgId = 'org-11111111-1111-1111-1111-111111111111';

        $case = $inspectionService->createCase([
            'registration_number' => 'MH12AB1234',
            'vehicle_model' => 'Tata Prima 2830.K',
            'vehicle_category' => 'COMMERCIAL_HEAVY',
            'priority' => 'URGENT',
            'loan_reference_number' => 'LN-2026-TATA-01',
        ], $orgId);

        if ($case['organization_id'] !== $orgId) {
            throw new \Exception("Inspection case organization_id mismatch");
        }
        if (!str_starts_with($case['case_number'], 'INS-')) {
            throw new \Exception("Generated case number must follow INS-YYYY-XXXXXX format");
        }
        if ($case['status'] !== InspectionCaseStateMachine::STATUS_DRAFT) {
            throw new \Exception("Unassigned case should initialize in DRAFT status");
        }

        // Query cases scoped to tenant
        $casesResult = $inspectionService->getCases($orgId, ['status' => 'ALL']);
        if (!isset($casesResult['data']) || count($casesResult['data']) === 0) {
            throw new \Exception("Expected non-empty cases list for organization");
        }
    }
}
