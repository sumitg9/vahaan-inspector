<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_tyres', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_case_id')->constrained('inspection_cases')->cascadeOnDelete();
            $table->integer('axle_number')->default(1);
            $table->string('position', 50); // FRONT_LEFT, FRONT_RIGHT, REAR_LEFT_OUTER, REAR_LEFT_INNER, REAR_RIGHT_OUTER, REAR_RIGHT_INNER, AXLE3_LO, AXLE3_LI, AXLE3_RO, AXLE3_RI, SPARE
            $table->string('brand', 100);
            $table->string('size_spec', 50); // e.g. 295/90 R20, 195/65 R15
            $table->decimal('tread_depth_mm', 4, 2);
            $table->integer('remaining_life_pct'); // 0 to 100
            $table->string('condition', 50); // EXCELLENT, GOOD, AVERAGE, WORN_OUT, RETREADED, DAMAGED_CUT
            $table->foreignUuid('evidence_id')->nullable()->constrained('inspection_evidences')->nullOnDelete();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['inspection_case_id', 'position']);
            $table->index(['inspection_case_id', 'condition']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_tyres');
    }
};
