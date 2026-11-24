<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WalletTransaction extends Model
{
    use HasUuids, HasFactory;

    public $timestamps = false; // Only created_at is recorded

    protected $fillable = [
        'credit_wallet_id',
        'transaction_type',
        'credits_amount',
        'balance_after',
        'idempotency_key',
        'reference_type',
        'reference_id',
        'description',
        'created_at',
    ];

    protected $casts = [
        'credits_amount' => 'integer',
        'balance_after' => 'integer',
        'created_at' => 'datetime',
    ];

    public function wallet(): BelongsTo
    {
        return $this->belongsTo(CreditWallet::class, 'credit_wallet_id');
    }
}
