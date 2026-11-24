<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Client extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'name',
        'client_type',
        'contact_person',
        'email',
        'phone',
        'pan_number',
        'gst_number',
        'billing_address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function bankBranches(): HasMany
    {
        return $this->hasMany(BankBranch::class);
    }

    public function inspectionCases(): HasMany
    {
        return $this->hasMany(InspectionCase::class);
    }
}
