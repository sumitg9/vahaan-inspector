<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('challans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vehicle_profile_id')->constrained('vehicle_profiles')->cascadeOnDelete();
            $table->string('challan_number', 100)->unique();
            $table->text('offence_details');
            $table->timestamp('offence_date_time');
            $table->bigInteger('fine_amount_paise')->default(0); // Monetary precision: minor units (paise)
            $table->string('state_code', 5);
            $table->string('rto_name', 100)->nullable();
            $table->string('challan_status', 50); // PENDING, DISPOSED, COURT_TRANSFERRED, CONTESTED
            $table->string('court_name')->nullable();
            $table->timestamp('payment_date')->nullable();
            $table->string('receipt_number', 100)->nullable();
            $table->text('parivahan_url')->default('https://echallan.parivahan.gov.in/');
            $table->string('provider_source', 50);
            $table->boolean('is_mock_data')->default(false);
            $table->jsonb('raw_response')->nullable();
            $table->timestamps();

            $table->index('vehicle_profile_id');
            $table->index('challan_status');
            $table->index('offence_date_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('challans');
    }
};
