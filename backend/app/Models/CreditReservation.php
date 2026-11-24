<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CreditReservation extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'credit_wallet_id',
        'organization_id',
        'credits_amount',
        'status',
        'reference_type',
        'reference_id',
        'idempotency_key',
        'expires_at',
    ];

    protected $casts = [
        'credits_amount' => 'integer',
        'expires_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'credit_wallet_id');
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
