<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Credit Wallets
        Schema::create('credit_wallets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->unique()->constrained('organizations')->cascadeOnDelete();
            $table->integer('balance_credits')->default(0);
            $table->integer('low_balance_threshold')->default(50);
            $table->boolean('auto_recharge_enabled')->default(false);
            $table->timestamps();
        });

        // Double-Entry Ledger Transactions
        Schema::create('wallet_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('credit_wallet_id')->constrained('credit_wallets')->cascadeOnDelete();
            $table->string('transaction_type', 50); // CREDIT_TOPUP, RC_LOOKUP_DEDUCTION, CHALLAN_LOOKUP_DEDUCTION, INSPECTION_DEDUCTION, REFUND
            $table->integer('credits_amount');
            $table->integer('balance_after');
            $table->string('idempotency_key', 100)->unique();
            $table->string('reference_type', 50)->nullable();
            $table->uuid('reference_id')->nullable();
            $table->text('description');
            $table->timestamp('created_at')->useCurrent();

            $table->index('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transactions');
        Schema::dropIfExists('credit_wallets');
    }
};
