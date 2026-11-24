<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FleetVehicle extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'vehicle_profile_id',
        'fleet_unit_number',
        'assigned_driver_name',
        'assigned_driver_phone',
        'depot_location',
        'insurance_alert_days_before',
        'fitness_alert_days_before',
        'pucc_alert_days_before',
        'permit_alert_days_before',
        'is_active',
    ];

    protected $casts = [
        'insurance_alert_days_before' => 'integer',
        'fitness_alert_days_before' => 'integer',
        'pucc_alert_days_before' => 'integer',
        'permit_alert_days_before' => 'integer',
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicleProfile(): BelongsTo
    {
        return $this->belongsTo(VehicleProfile::class);
    }
}
