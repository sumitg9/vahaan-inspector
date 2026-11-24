<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inspection_templates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('vehicle_category', 50); // COMMERCIAL_HEAVY, COMMERCIAL_LIGHT, BUS, PASSENGER_CAR, TWO_WHEELER, CONSTRUCTION
            $table->integer('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->jsonb('schema_definition'); // Sections, checkpoints, grading rules, mandatory evidence slots
            $table->timestamps();

            $table->unique(['vehicle_category', 'version']);
            $table->index(['vehicle_category', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inspection_templates');
    }
};
