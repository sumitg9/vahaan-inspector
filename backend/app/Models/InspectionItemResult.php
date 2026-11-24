<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionItemResult extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'inspection_case_id',
        'section_key',
        'item_key',
        'item_label',
        'rating',
        'score',
        'remarks',
        'verified_physically',
    ];

    protected $casts = [
        'score' => 'integer',
        'verified_physically' => 'boolean',
    ];

    public function inspectionCase(): BelongsTo
    {
        return $this->belongsTo(InspectionCase::class);
    }
}
