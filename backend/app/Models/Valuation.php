<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Valuation extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'inspection_case_id',
        'valuation_methodology',
        'ex_showroom_price_paise',
        'base_depreciated_value_paise',
        'age_in_months',
        'age_depreciation_pct',
        'odometer_adjustment_paise',
        'condition_deduction_paise',
        'estimated_repair_refurbishment_paise',
        'proposed_fair_market_value_paise',
        'proposed_distress_value_paise',
        'valuer_override_applied',
        'override_fair_market_value_paise',
        'override_distress_value_paise',
        'override_justification',
        'valuer_id',
        'certified_valuer_remarks',
        'approved_at',
    ];

    protected $casts = [
        'ex_showroom_price_paise' => 'integer',
        'base_depreciated_value_paise' => 'integer',
        'odometer_adjustment_paise' => 'integer',
        'condition_deduction_paise' => 'integer',
        'estimated_repair_refurbishment_paise' => 'integer',
        'proposed_fair_market_value_paise' => 'integer',
        'proposed_distress_value_paise' => 'integer',
        'override_fair_market_value_paise' => 'integer',
        'override_distress_value_paise' => 'integer',
        'valuer_override_applied' => 'boolean',
        'approved_at' => 'datetime',
    ];

    public function inspectionCase(): BelongsTo
    {
        return $this->belongsTo(InspectionCase::class);
    }

    public function valuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'valuer_id');
    }

    /**
     * Helper to return final effective fair market value in rupees.
     */
    public function getEffectiveFairMarketValueInrAttribute(): float
    {
        $amountPaise = $this->valuer_override_applied && $this->override_fair_market_value_paise !== null
            ? $this->override_fair_market_value_paise
            : $this->proposed_fair_market_value_paise;
        return $amountPaise / 100;
    }
}
