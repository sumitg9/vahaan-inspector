<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehicleProfile extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'registration_number',
        'chassis_number',
        'engine_number',
        'maker_model',
        'maker_name',
        'model_name',
        'variant_name',
        'vehicle_class',
        'body_type',
        'fuel_type',
        'color',
        'emission_norms',
        'seating_capacity',
        'cubic_capacity',
        'unladen_weight_kg',
        'gross_vehicle_weight_kg',
        'number_of_cylinders',
        'wheelbase_mm',
        'registration_date',
        'manufacturing_date',
        'rto_code',
        'rto_name',
        'state_code',
        'rc_status',
        'ownership_sequence',
        'owner_name_masked',
        'hypothecated',
        'financier_name',
        'insurance_company',
        'insurance_policy_number',
        'insurance_valid_until',
        'fitness_valid_until',
        'tax_valid_until',
        'pucc_valid_until',
        'national_permit_number',
        'national_permit_valid_until',
        'blacklist_status',
        'blacklist_details',
        'provider_source',
        'is_mock_data',
        'raw_response',
        'provenance_metadata',
        'last_fetched_at',
    ];

    protected $casts = [
        'registration_date' => 'date',
        'manufacturing_date' => 'date',
        'insurance_valid_until' => 'date',
        'fitness_valid_until' => 'date',
        'tax_valid_until' => 'date',
        'pucc_valid_until' => 'date',
        'national_permit_valid_until' => 'date',
        'hypothecated' => 'boolean',
        'is_mock_data' => 'boolean',
        'raw_response' => 'array',
        'provenance_metadata' => 'array',
        'last_fetched_at' => 'datetime',
    ];

    public function challans(): HasMany
    {
        return $this->hasMany(Challan::class);
    }

    public function inspectionCases(): HasMany
    {
        return $this->hasMany(InspectionCase::class);
    }
}
