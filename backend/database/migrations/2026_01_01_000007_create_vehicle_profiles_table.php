<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehicle_profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('registration_number', 20)->unique();
            $table->string('chassis_number', 50);
            $table->string('engine_number', 50);
            $table->string('maker_model');
            $table->string('maker_name', 100);
            $table->string('model_name', 100);
            $table->string('variant_name', 100)->nullable();
            $table->string('vehicle_class', 100);
            $table->string('body_type', 100)->nullable();
            $table->string('fuel_type', 50);
            $table->string('color', 50)->nullable();
            $table->string('emission_norms', 50)->nullable(); // BS-IV, BS-VI
            $table->integer('seating_capacity')->nullable();
            $table->integer('cubic_capacity')->nullable();
            $table->integer('unladen_weight_kg')->nullable();
            $table->integer('gross_vehicle_weight_kg')->nullable();
            $table->integer('number_of_cylinders')->nullable();
            $table->integer('wheelbase_mm')->nullable();
            $table->date('registration_date')->nullable();
            $table->date('manufacturing_date')->nullable();
            $table->string('rto_code', 10);
            $table->string('rto_name', 100);
            $table->string('state_code', 5);
            $table->string('rc_status', 50)->default('ACTIVE'); // ACTIVE, EXPIRED, CANCELLED, SUSPENDED
            $table->integer('ownership_sequence')->default(1);
            $table->string('owner_name_masked'); // DPDP Act Compliance: S**** K****
            $table->boolean('hypothecated')->default(false);
            $table->string('financier_name')->nullable();
            $table->string('insurance_company')->nullable();
            $table->string('insurance_policy_number', 100)->nullable();
            $table->date('insurance_valid_until')->nullable();
            $table->date('fitness_valid_until')->nullable();
            $table->date('tax_valid_until')->nullable();
            $table->date('pucc_valid_until')->nullable();
            $table->string('national_permit_number', 100)->nullable();
            $table->date('national_permit_valid_until')->nullable();
            $table->string('blacklist_status', 50)->default('CLEAN'); // CLEAN, BLACKLISTED
            $table->text('blacklist_details')->nullable();
            $table->string('provider_source', 50); // apisathi_rc_v1, mock_gateway, manual
            $table->boolean('is_mock_data')->default(false);
            $table->jsonb('raw_response')->nullable();
            $table->jsonb('provenance_metadata')->default('{}');
            $table->timestamp('last_fetched_at')->useCurrent();
            $table->timestamps();

            $table->index('registration_number');
            $table->index('chassis_number');
            $table->index('rc_status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehicle_profiles');
    }
};
