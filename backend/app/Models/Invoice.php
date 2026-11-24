<?php

namespace App\Models;

use App\Shared\Traits\TenantModelTrait;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Invoice extends Model
{
    use HasUuids, HasFactory, TenantModelTrait;

    protected $fillable = [
        'organization_id',
        'invoice_number',
        'status',
        'subtotal_paise',
        'tax_paise',
        'total_paise',
        'credits_purchased',
        'payment_gateway',
        'payment_id',
        'billing_details',
        'paid_at',
    ];

    protected $casts = [
        'subtotal_paise' => 'integer',
        'tax_paise' => 'integer',
        'total_paise' => 'integer',
        'credits_purchased' => 'integer',
        'billing_details' => 'array',
        'paid_at' => 'datetime',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}
