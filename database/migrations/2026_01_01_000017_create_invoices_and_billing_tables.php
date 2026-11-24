<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // GST Tax Invoices
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('invoice_number', 50)->unique();
            $table->string('status', 30)->default('PAID'); // DRAFT, PAID, VOID, REFUNDED
            $table->bigInteger('subtotal_paise');
            $table->bigInteger('tax_paise');
            $table->bigInteger('total_paise');
            $table->integer('credits_purchased');
            $table->string('payment_gateway', 50)->default('RAZORPAY');
            $table->string('payment_id', 100)->nullable();
            $table->json('billing_details')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['organization_id', 'created_at']);
        });

        // Two-Phase Credit Reservations
        Schema::create('credit_reservations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('credit_wallet_id')->constrained('credit_wallets')->cascadeOnDelete();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->integer('credits_amount');
            $table->string('status', 30)->default('PENDING'); // PENDING, COMMITTED, RELEASED, EXPIRED
            $table->string('reference_type', 50);
            $table->uuid('reference_id')->nullable();
            $table->string('idempotency_key', 100)->unique();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['credit_wallet_id', 'status']);
        });

        // Tenant Subscription Plans
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->unique()->constrained('organizations')->cascadeOnDelete();
            $table->string('plan_code', 50)->default('ENTERPRISE'); // STARTER, PROFESSIONAL, ENTERPRISE
            $table->string('status', 30)->default('ACTIVE');
            $table->integer('monthly_included_lookups')->default(500);
            $table->integer('used_lookups_this_cycle')->default(0);
            $table->integer('credit_rate_paise')->default(1500); // ₹15.00
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('credit_reservations');
        Schema::dropIfExists('invoices');
    }
};
