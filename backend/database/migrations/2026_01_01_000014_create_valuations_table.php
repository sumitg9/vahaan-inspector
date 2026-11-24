<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('valuations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('inspection_case_id')->unique()->constrained('inspection_cases')->cascadeOnDelete();
            $table->string('valuation_methodology', 50); // DEPRECIATED_MARKET_VALUE, FAIR_MARKET_VALUE, DISTRESS_VALUE
            
            // Monetary precision: 64-bit integer minor currency units (paise)
            $table->bigInteger('ex_showroom_price_paise');
            $table->bigInteger('base_depreciated_value_paise');
            $table->integer('age_in_months');
            $table->decimal('age_depreciation_pct', 5, 2);
            $table->bigInteger('odometer_adjustment_paise')->default(0);
            $table->bigInteger('condition_deduction_paise')->default(0);
            $table->bigInteger('estimated_repair_refurbishment_paise')->default(0);
            $table->bigInteger('proposed_fair_market_value_paise');
            $table->bigInteger('proposed_distress_value_paise');

            // Certified Valuer Override Controls
            $table->boolean('valuer_override_applied')->default(false);
            $table->bigInteger('override_fair_market_value_paise')->nullable();
            $table->bigInteger('override_distress_value_paise')->nullable();
            $table->text('override_justification')->nullable();
            $table->foreignUuid('valuer_id')->constrained('users')->restrictOnDelete();
            $table->text('certified_valuer_remarks');
            $table->timestamp('approved_at')->useCurrent();
            $table->timestamps();

            $table->index(['inspection_case_id', 'valuer_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('valuations');
    }
};
