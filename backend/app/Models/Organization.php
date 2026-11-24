<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Organization extends Model
{
    use HasUuids, HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'legal_name',
        'slug',
        'email',
        'phone',
        'gst_number',
        'pan_number',
        'logo_url',
        'report_disclaimer',
        'status',
        'settings',
    ];

    protected $casts = [
        'settings' => 'array',
    ];

    public function branches(): HasMany
    {
        return $this->hasMany(Branch::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function wallet(): HasOne
    {
        return $this->hasOne(CreditWallet::class);
    }

    public function inspectionCases(): HasMany
    {
        return $this->hasMany(InspectionCase::class);
    }

    public function clients(): HasMany
    {
        return $this->hasMany(Client::class);
    }
}
