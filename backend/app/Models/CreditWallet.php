<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CreditWallet extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'balance_credits',
        'low_balance_threshold',
        'auto_recharge_enabled',
    ];

    protected $casts = [
        'balance_credits' => 'integer',
        'low_balance_threshold' => 'integer',
        'auto_recharge_enabled' => 'boolean',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(WalletTransaction::class);
    }
}
