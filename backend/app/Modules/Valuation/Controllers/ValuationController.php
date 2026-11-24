<?php

namespace App\Modules\Valuation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Valuation\Exceptions\UnauthorizedValuerException;
use App\Modules\Valuation\Exceptions\ValuationException;
use App\Modules\Valuation\Exceptions\ValuationNotApprovedException;
use App\Modules\Valuation\Exceptions\ValuationOverrideJustificationException;
use App\Modules\Valuation\Services\ValuationCalculatorService;
use App\Modules\Valuation\Services\ValuationGovernanceService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ValuationController extends Controller
{
    protected ValuationCalculatorService $calculatorService;
    protected ValuationGovernanceService $governanceService;

    public function __construct(
        ValuationCalculatorService $calculatorService,
        ValuationGovernanceService $governanceService
    ) {
        $this->calculatorService = $calculatorService;
        $this->governanceService = $governanceService;
    }

    /**
     * Calculate automated proposed algorithmic valuation estimate.
     * Enforces AC-VAL-01: Explicitly labeled as 'Proposed Algorithmic Estimate'.
     */
    public function calculate(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'ex_showroom_price_paise' => 'nullable|integer|min:0',
            'age_in_months' => 'nullable|integer|min:0',
            'vehicle_category' => 'nullable|string',
            'odometer_reading_km' => 'nullable|integer|min:0',
            'body_score' => 'nullable|integer|between:1,10',
            'mechanical_score' => 'nullable|integer|between:1,10',
            'electrical_score' => 'nullable|integer|between:1,10',
            'repair_estimates_paise' => 'nullable|integer|min:0',
            'tyre_refurbishment_paise' => 'nullable|integer|min:0',
        ]);

        $estimate = $this->calculatorService->calculateAlgorithmicValuation($validated, $orgId);

        return $this->success($estimate, 'Proposed algorithmic valuation estimate computed');
    }

    /**
     * Retrieve valuation dossier details, approval state, and historical versions.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $val = $this->governanceService->getValuation($id, $orgId);

        if (!$val) {
            // Compute default estimate for this case if not yet saved
            $val = $this->calculatorService->calculateAlgorithmicValuation([], $orgId);
            $val['inspection_case_id'] = $id;
        }

        return $this->success($val, 'Valuation dossier retrieved');
    }

    /**
     * Certify and approve vehicle valuation with optional valuer override.
     * Enforces AC-VAL-01, AC-VAL-02 (minimum 30 char justification), and role capabilities.
     */
    public function approve(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'VALUER';
        $userId = $user?->id ?? 'user-valuer-default';

        $validated = $request->validate([
            'valuation_methodology' => 'nullable|string',
            'ex_showroom_price_paise' => 'nullable|integer|min:0',
            'base_depreciated_value_paise' => 'nullable|integer|min:0',
            'age_in_months' => 'nullable|integer|min:0',
            'age_depreciation_pct' => 'nullable|numeric|between:0,100',
            'odometer_adjustment_paise' => 'nullable|integer|min:0',
            'condition_deduction_paise' => 'nullable|integer|min:0',
            'estimated_repair_refurbishment_paise' => 'nullable|integer|min:0',
            'proposed_fair_market_value_paise' => 'nullable|integer|min:0',
            'proposed_distress_value_paise' => 'nullable|integer|min:0',
            'valuer_override_applied' => 'nullable|boolean',
            'override_fair_market_value_paise' => 'nullable|integer|min:0',
            'override_distress_value_paise' => 'nullable|integer|min:0',
            'override_justification' => 'nullable|string',
            'certified_valuer_remarks' => 'required|string|min:10',
        ]);

        try {
            $certified = $this->governanceService->approveAndCertifyValuation(
                $id,
                $validated,
                $userId,
                $userRole,
                $orgId
            );

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'VALUATION_APPROVED_AND_CERTIFIED',
                    'valuations',
                    $certified['id'] ?? null,
                    [],
                    [
                        'case_id' => $id,
                        'final_fmv_paise' => $certified['final_fair_market_value_paise'],
                        'override_applied' => $certified['valuer_override_applied'],
                        'valuer_id' => $userId,
                    ],
                    $userId
                );
            }

            return $this->success($certified, 'Valuation dossier certified and approved successfully', 200);
        } catch (ValuationOverrideJustificationException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (UnauthorizedValuerException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Check approval gate before final report generation.
     */
    public function canGenerateReport(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        try {
            $this->governanceService->verifyApprovalBeforeReportGeneration($id, $orgId);
            return $this->success(['allowed' => true], 'Valuation approved. Ready for final report generation.');
        } catch (ValuationNotApprovedException $e) {
            return $this->error($e->getMessage(), 422, ['allowed' => false]);
        }
    }
}
