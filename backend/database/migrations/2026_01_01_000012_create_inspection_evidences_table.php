<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_evidences', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_case_id')->constrained('inspection_cases')->cascadeOnDelete();
            $table->string('category', 50); // FRONT_45, REAR_45, LEFT_PROFILE, RIGHT_PROFILE, FRONT_PLATE, REAR_PLATE, ODOMETER, ENGINE_BAY, CHASSIS_STAMP, CABIN, TYRE, DAMAGE, DOCUMENT
            $table->text('s3_key');
            $table->integer('file_size_bytes');
            $table->string('mime_type', 50)->default('image/webp');
            $table->string('sha256_hash', 64);
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->timestamp('captured_at');
            $table->foreignUuid('inspector_id')->constrained('users')->restrictOnDelete();
            $table->text('caption')->nullable();
            $table->boolean('is_damage_proof')->default(false);
            $table->timestamps();

            $table->index(['inspection_case_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_evidences');
    }
};
