<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InspectionEvidence extends Model
{
    use HasUuids, HasFactory;

    protected $table = 'inspection_evidences';

    protected $fillable = [
        'inspection_case_id',
        'category',
        's3_key',
        'file_size_bytes',
        'mime_type',
        'sha256_hash',
        'latitude',
        'longitude',
        'captured_at',
        'inspector_id',
        'caption',
        'is_damage_proof',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'captured_at' => 'datetime',
        'is_damage_proof' => 'boolean',
    ];

    public function inspectionCase(): BelongsTo
    {
        return $this->belongsTo(InspectionCase::class);
    }

    public function inspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }
}
