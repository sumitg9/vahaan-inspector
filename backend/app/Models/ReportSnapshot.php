<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportSnapshot extends Model
{
    use HasUuids, HasFactory;

    protected $fillable = [
        'inspection_case_id',
        'version',
        'verification_token',
        'snapshot_data',
        'sha256_checksum',
        'pdf_s3_key',
        'pdf_size_bytes',
        'page_count',
        'is_mock_watermarked',
        'rendered_at',
    ];

    protected $casts = [
        'snapshot_data' => 'array',
        'is_mock_watermarked' => 'boolean',
        'rendered_at' => 'datetime',
    ];

    public function inspectionCase(): BelongsTo
    {
        return $this->belongsTo(InspectionCase::class);
    }

    /**
     * Public QR verification URL.
     */
    public function getVerificationUrlAttribute(): string
    {
        return 'https://app.vahancheck.com/verify-report/' . $this->verification_token;
    }
}
