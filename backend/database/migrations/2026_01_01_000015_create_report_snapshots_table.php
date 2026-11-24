<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_snapshots', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_case_id')->constrained('inspection_cases')->cascadeOnDelete();
            $table->string('version', 20)->default('1.0'); // 1.0, 1.1, 2.0
            $table->string('verification_token', 64)->unique();
            $table->jsonb('snapshot_data'); // Immutable frozen JSON representation of all report fields
            $table->string('sha256_checksum', 64);
            $table->text('pdf_s3_key')->nullable();
            $table->integer('pdf_size_bytes')->nullable();
            $table->integer('page_count')->nullable();
            $table->boolean('is_mock_watermarked')->default(false);
            $table->timestamp('rendered_at')->nullable();
            $table->timestamps();

            $table->unique(['inspection_case_id', 'version']);
            $table->index('verification_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_snapshots');
    }
};
