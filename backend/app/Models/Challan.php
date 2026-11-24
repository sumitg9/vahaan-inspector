<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Challan extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'vehicle_profile_id',
        'challan_number',
        'offence_details',
        'offence_date_time',
        'fine_amount_paise',
        'state_code',
        'rto_name',
        'challan_status',
        'court_name',
        'payment_date',
        'receipt_number',
        'parivahan_url',
        'provider_source',
        'is_mock_data',
        'raw_response',
    ];

    protected $casts = [
        'offence_date_time' => 'datetime',
        'payment_date' => 'datetime',
        'fine_amount_paise' => 'integer',
        'is_mock_data' => 'boolean',
        'raw_response' => 'array',
    ];

    public function vehicleProfile(): BelongsTo
    {
        return $this->belongsTo(VehicleProfile::class);
    }

    /**
     * Get formatted fine in INR rupees.
     */
    public function getFineAmountInrAttribute(): float
    {
        return $this->fine_amount_paise / 100;
    }
}
