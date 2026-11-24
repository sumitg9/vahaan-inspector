<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fleet_vehicles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('vehicle_profile_id')->constrained('vehicle_profiles')->cascadeOnDelete();
            $table->string('fleet_unit_number', 100)->nullable();
            $table->string('assigned_driver_name')->nullable();
            $table->string('assigned_driver_phone', 20)->nullable();
            $table->string('depot_location')->nullable();
            $table->integer('insurance_alert_days_before')->default(30);
            $table->integer('fitness_alert_days_before')->default(30);
            $table->integer('pucc_alert_days_before')->default(15);
            $table->integer('permit_alert_days_before')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['organization_id', 'vehicle_profile_id']);
            $table->index(['organization_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fleet_vehicles');
    }
};
