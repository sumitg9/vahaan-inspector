<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionTyre extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'inspection_case_id',
        'axle_number',
        'position',
        'brand',
        'size_spec',
        'tread_depth_mm',
        'remaining_life_pct',
        'condition',
        'evidence_id',
        'remarks',
    ];

    protected $casts = [
        'axle_number' => 'integer',
        'tread_depth_mm' => 'float',
        'remaining_life_pct' => 'integer',
    ];

    public function inspectionCase(): BelongsTo
    {
        return $this->belongsTo(InspectionCase::class);
    }

    public function evidence(): BelongsTo
    {
        return $this->belongsTo(InspectionEvidence::class, 'evidence_id');
    }
}
