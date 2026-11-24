<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduledFleetCheck extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'frequency',
        'hour_utc',
        'is_enabled',
        'max_credits_per_run',
        'auto_reverify_older_than_days',
        'alert_recipients',
        'last_run_at',
        'last_run_summary',
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'max_credits_per_run' => 'integer',
        'auto_reverify_older_than_days' => 'integer',
        'alert_recipients' => 'array',
        'last_run_summary' => 'array',
        'last_run_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
