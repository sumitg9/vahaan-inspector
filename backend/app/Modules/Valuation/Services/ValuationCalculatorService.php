<?php

namespace App\Modules\Valuation\Services;

use InvalidArgumentException;

class ValuationCalculatorService
{
    /**
     * Standard Central Motor Tariff age depreciation curve.
     */
    public const DEPRECIATION_CURVE = [
        6 => 5.0,    // <= 6 months: 5%
        12 => 15.0,  // <= 12 months: 15%
        24 => 20.0,  // <= 24 months: 20%
        36 => 30.0,  // <= 36 months: 30%
        48 => 40.0,  // <= 48 months: 40%
        60 => 50.0,  // <= 60 months: 50%
    ];

    public const MAX_DEPRECIATION_PCT = 80.0;
    public const SCRAP_VALUE_FLOOR_PCT = 15.0; // Minimum residual value
    public const DISTRESS_VALUE_HAIRCUT_PCT = 15.0; // 15% liquidation discount

    /**
     * Compute automated proposed algorithmic estimate with full breakdown.
     * Enforces AC-VAL-01: Explicitly tagged as 'Proposed Algorithmic Estimate'.
     */
    public function calculateAlgorithmicValuation(array $inputs, string $organizationId): array
    {
        $exShowroomPaise = (int) ($inputs['ex_showroom_price_paise'] ?? 0);
        if ($exShowroomPaise <= 0) {
            // Default 42 Lakhs paise if unspecified
            $exShowroomPaise = 420000000;
        }

        $ageMonths = (int) ($inputs['age_in_months'] ?? 36);
        if ($ageMonths < 0) {
            $ageMonths = 0;
        }

        $category = strtoupper($inputs['vehicle_category'] ?? 'COMMERCIAL_HEAVY');
        $isCommercial = str_contains($category, 'COMMERCIAL') || str_contains($category, 'HCV') || str_contains($category, 'LCV');

        // 1. Calculate Age Depreciation Percentage
        $depreciationPct = $this->calculateAgeDepreciationPct($ageMonths);

        // 2. Base Depreciated Value in Paise
        $baseDepreciatedPaise = (int) round($exShowroomPaise * (1.0 - ($depreciationPct / 100.0)));

        // 3. Odometer Usage Adjustment
        $odometerKm = (int) ($inputs['odometer_reading_km'] ?? 50000);
        $expectedAnnualKm = $isCommercial ? 60000 : 15000;
        $expectedTotalKm = (int) round(($expectedAnnualKm / 12) * max(1, $ageMonths));
        $excessKm = max(0, $odometerKm - $expectedTotalKm);
        
        // Excess km penalty: 150 paise (₹1.50) per km for commercial, 250 paise (₹2.50) for passenger
        $ratePerKmPaise = $isCommercial ? 150 : 250;
        $odometerAdjustmentPaise = (int) min(
            (int) round($baseDepreciatedPaise * 0.15), // Max 15% odometer penalty
            $excessKm * $ratePerKmPaise
        );

        // 4. Physical Condition Deductions (Body, Mechanical, Electrical)
        $bodyScore = max(1, min(10, (int) ($inputs['body_score'] ?? 8)));
        $mechanicalScore = max(1, min(10, (int) ($inputs['mechanical_score'] ?? 8)));
        $electricalScore = max(1, min(10, (int) ($inputs['electrical_score'] ?? 8)));

        $bodyDeduction = (10 - $bodyScore) * 0.020;       // 2% per point below 10
        $mechDeduction = (10 - $mechanicalScore) * 0.025; // 2.5% per point below 10
        $elecDeduction = (10 - $electricalScore) * 0.015; // 1.5% per point below 10
        $totalConditionDeductionPct = $bodyDeduction + $mechDeduction + $elecDeduction;

        $conditionDeductionPaise = (int) round($baseDepreciatedPaise * $totalConditionDeductionPct);

        // 5. Estimated Repair & Refurbishment Deductions (Damage repairs + Tyre wear)
        $repairEstimatesPaise = (int) ($inputs['repair_estimates_paise'] ?? 0);
        $tyreRefurbishmentPaise = (int) ($inputs['tyre_refurbishment_paise'] ?? 0);
        $totalRepairRefurbishmentPaise = $repairEstimatesPaise + $tyreRefurbishmentPaise;

        // 6. Proposed Fair Market Value (FMV) in Paise with Scrap Value Floor
        $scrapFloorPaise = (int) round($exShowroomPaise * (self::SCRAP_VALUE_FLOOR_PCT / 100.0));
        $netValuePaise = $baseDepreciatedPaise
            - $odometerAdjustmentPaise
            - $conditionDeductionPaise
            - $totalRepairRefurbishmentPaise;

        $proposedFmvPaise = max($scrapFloorPaise, $netValuePaise);

        // 7. Proposed Distress / Liquidation Value in Paise (15% Haircut)
        $proposedDistressPaise = (int) round($proposedFmvPaise * (1.0 - (self::DISTRESS_VALUE_HAIRCUT_PCT / 100.0)));

        $methodology = $isCommercial
            ? 'DEPRECIATED_MARKET_VALUE_COMMERCIAL'
            : 'DEPRECIATED_MARKET_VALUE_PASSENGER';

        $assumptions = [
            'age_depreciation_standard' => 'General Insurance Council Motor Tariff Depreciated Replacement Curve',
            'benchmark_annual_utilization_km' => $expectedAnnualKm,
            'odometer_excess_penalty_rate_paise_per_km' => $ratePerKmPaise,
            'physical_condition_weighting' => 'Mechanical 40%, Body/Chassis 35%, Electrical/Interior 25%',
            'distress_liquidation_haircut_percentage' => self::DISTRESS_VALUE_HAIRCUT_PCT,
            'scrap_value_floor_percentage' => self::SCRAP_VALUE_FLOOR_PCT,
            'market_liquidity_horizon' => 'Fair Market: 60-90 days; Distress: 15-30 days',
        ];

        return [
            // AC-VAL-01 Mandatory Label: Explicitly labeled as Proposed Algorithmic Estimate
            'valuation_type' => 'Proposed Algorithmic Estimate',
            'is_certified' => false,
            'status' => 'PENDING_VALUER_APPROVAL',
            'valuation_methodology' => $methodology,
            'ex_showroom_price_paise' => $exShowroomPaise,
            'age_in_months' => $ageMonths,
            'age_depreciation_pct' => $depreciationPct,
            'base_depreciated_value_paise' => $baseDepreciatedPaise,
            'odometer_adjustment_paise' => $odometerAdjustmentPaise,
            'condition_deduction_paise' => $conditionDeductionPaise,
            'estimated_repair_refurbishment_paise' => $totalRepairRefurbishmentPaise,
            'proposed_fair_market_value_paise' => $proposedFmvPaise,
            'proposed_distress_value_paise' => $proposedDistressPaise,
            // Display amounts in Rupees
            'proposed_fair_market_value_inr' => round($proposedFmvPaise / 100, 2),
            'proposed_distress_value_inr' => round($proposedDistressPaise / 100, 2),
            'scores' => [
                'body_score' => $bodyScore,
                'mechanical_score' => $mechanicalScore,
                'electrical_score' => $electricalScore,
                'tyre_refurbishment_paise' => $tyreRefurbishmentPaise,
                'body_repair_paise' => $repairEstimatesPaise,
            ],
            'assumptions' => $assumptions,
            'calculated_at' => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Compute age depreciation percentage based on standard tariff tables.
     */
    protected function calculateAgeDepreciationPct(int $ageMonths): float
    {
        if ($ageMonths <= 6) return 5.0;
        if ($ageMonths <= 12) return 15.0;
        if ($ageMonths <= 24) return 20.0;
        if ($ageMonths <= 36) return 30.0;
        if ($ageMonths <= 48) return 40.0;
        if ($ageMonths <= 60) return 50.0;

        // Above 5 years: +5% for every additional year up to 80% maximum
        $additionalYears = (int) floor(($ageMonths - 60) / 12);
        return min(self::MAX_DEPRECIATION_PCT, 50.0 + ($additionalYears * 5.0));
    }
}
