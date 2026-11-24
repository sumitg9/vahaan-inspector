<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InspectionTemplate extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'name',
        'vehicle_category',
        'version',
        'is_active',
        'schema_definition',
    ];

    protected $casts = [
        'version' => 'integer',
        'is_active' => 'boolean',
        'schema_definition' => 'array',
    ];

    public function inspectionCases(): HasMany
    {
        return $this->hasMany(InspectionCase::class, 'template_id');
    }
}
