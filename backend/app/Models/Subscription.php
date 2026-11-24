<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'plan_code',
        'status',
        'monthly_included_lookups',
        'used_lookups_this_cycle',
        'credit_rate_paise',
        'current_period_start',
        'current_period_end',
    ];

    protected $casts = [
        'monthly_included_lookups' => 'integer',
        'used_lookups_this_cycle' => 'integer',
        'credit_rate_paise' => 'integer',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
