<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class InspectionCase extends Model
{
    use HasUuids, HasFactory, SoftDeletes, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'branch_id',
        'client_id',
        'bank_branch_id',
        'loan_reference_number',
        'vehicle_profile_id',
        'assigned_inspector_id',
        'template_id',
        'status',
        'priority',
        'scheduled_at',
        'inspection_address',
        'inspection_latitude',
        'inspection_longitude',
        'odometer_reading_km',
        'engine_started',
        'road_tested',
        'summary_condition_rating',
        'qc_remarks',
        'submitted_at',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'inspection_latitude' => 'float',
        'inspection_longitude' => 'float',
        'odometer_reading_km' => 'integer',
        'engine_started' => 'boolean',
        'road_tested' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function vehicleProfile(): BelongsTo
    {
        return $this->belongsTo(VehicleProfile::class);
    }

    public function assignedInspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_inspector_id');
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(InspectionTemplate::class, 'template_id');
    }

    public function itemResults(): HasMany
    {
        return $this->hasMany(InspectionItemResult::class);
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(InspectionEvidence::class);
    }

    public function tyres(): HasMany
    {
        return $this->hasMany(InspectionTyre::class);
    }

    public function valuation(): HasOne
    {
        return $this->hasOne(Valuation::class);
    }

    public function reportSnapshots(): HasMany
    {
        return $this->hasMany(ReportSnapshot::class);
    }
}
