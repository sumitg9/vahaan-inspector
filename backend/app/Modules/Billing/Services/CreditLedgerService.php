<?php

namespace App\Modules\Billing\Services;

use App\Models\CreditWallet;
use App\Models\WalletTransaction;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Billing\Exceptions\InsufficientCreditsException;
use App\Modules\Billing\Exceptions\InvalidIdempotencyKeyException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CreditLedgerService
{
    protected SubscriptionPlanService $planService;
    protected InvoiceService $invoiceService;

    public function __construct(
        SubscriptionPlanService $planService,
        InvoiceService $invoiceService
    ) {
        $this->planService = $planService;
        $this->invoiceService = $invoiceService;
    }

    /**
     * Get real-time spendable wallet balance and telemetry for an organization.
     */
    public function getBalance(string $organizationId): array
    {
        $wallet = CreditWallet::where('organization_id', $organizationId)->first();
        $balance = $wallet?->balance_credits ?? 950;
        $paiseValue = $balance * 1500; // ₹15.00 per credit

        return [
            'organization_id' => $organizationId,
            'wallet_id' => $wallet?->id ?? 'mock-wallet-uuid',
            'balance_credits' => $balance,
            'balance_paise' => $paiseValue,
            'balance_formatted_inr' => '₹' . number_format($paiseValue / 100, 2),
            'low_balance_threshold' => $wallet?->low_balance_threshold ?? 50,
            'auto_recharge_enabled' => (bool) ($wallet?->auto_recharge_enabled ?? false),
        ];
    }

    /**
     * Deduct credits atomically with row-level locks, idempotency, and provider COGS cost tracking.
     * Prevents race conditions and duplicate deductions under concurrent load.
     *
     * @throws InsufficientCreditsException
     * @throws InvalidIdempotencyKeyException
     */
    public function deductCredits(
        string $organizationId,
        int $credits,
        string $type,
        string $idempotencyKey,
        string $description,
        ?string $referenceType = null,
        ?string $referenceId = null,
        array $metadata = []
    ): WalletTransaction {
        if (empty(trim($idempotencyKey))) {
            throw new InvalidIdempotencyKeyException('Idempotency-Key must not be empty.');
        }

        // 1. Idempotency Check: Return existing transaction without duplicate charge
        $existing = WalletTransaction::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        // 2. Atomic Transaction with Row-Level Lock (prevent concurrent double-spending)
        return DB::transaction(function () use (
            $organizationId,
            $credits,
            $type,
            $idempotencyKey,
            $description,
            $referenceType,
            $referenceId,
            $metadata
        ) {
            // Re-check idempotency inside transaction lock
            $existing = WalletTransaction::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }

            // Lock wallet row for update
            $wallet = CreditWallet::where('organization_id', $organizationId)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = CreditWallet::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $organizationId,
                    'balance_credits' => 950,
                    'low_balance_threshold' => 50,
                    'auto_recharge_enabled' => false,
                ]);
            }

            // Enforce sufficient balance
            if ($wallet->balance_credits < $credits) {
                throw new InsufficientCreditsException(
                    "Insufficient credits: required {$credits} Cr, available {$wallet->balance_credits} Cr."
                );
            }

            // 3. Provider Cost Tracking (COGS) & Gross Margin Calculation
            $providerCostPaise = 0;
            if ($type === 'RC_LOOKUP_DEDUCTION') {
                $providerCostPaise = $this->planService->getProviderCostPaise('apisathi_rc_v1'); // 450 paise
            } elseif ($type === 'CHALLAN_LOOKUP_DEDUCTION') {
                $providerCostPaise = $this->planService->getProviderCostPaise('echallan_parivahan'); // 250 paise
            } elseif ($type === 'FASTAG_LOOKUP_DEDUCTION') {
                $providerCostPaise = $this->planService->getProviderCostPaise('fastag_toll_intel'); // 150 paise
            }

            $customerRevenuePaise = $credits * 1500; // Customer paid ~₹15/credit
            $grossMarginPaise = max(0, $customerRevenuePaise - $providerCostPaise);

            // 4. Update wallet balance
            $newBalance = $wallet->balance_credits - $credits;
            $wallet->balance_credits = $newBalance;
            $wallet->save();

            // 5. Append immutable transaction to ledger (Invariant 5)
            $transaction = WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $wallet->id,
                'transaction_type' => $type,
                'credits_amount' => $credits,
                'balance_after' => $newBalance,
                'idempotency_key' => $idempotencyKey,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'description' => $description,
                'created_at' => now(),
            ]);

            AuditService::log(
                $organizationId,
                null,
                'CREDIT_DEDUCTION_COMPLETED',
                'wallet_transactions',
                $transaction->id,
                null,
                [
                    'credits' => $credits,
                    'balance_after' => $newBalance,
                    'type' => $type,
                    'provider_cost_paise' => $providerCostPaise,
                    'gross_margin_paise' => $grossMarginPaise,
                    'idempotency_key' => $idempotencyKey,
                ]
            );

            return $transaction;
        });
    }

    /**
     * Top-up credit wallet atomically with idempotency and issue tax invoice.
     */
    public function topupCredits(
        string $organizationId,
        int $credits,
        int $amountPaidPaise,
        string $paymentId,
        string $idempotencyKey,
        string $description,
        array $metadata = []
    ): WalletTransaction {
        if (empty(trim($idempotencyKey))) {
            throw new InvalidIdempotencyKeyException('Idempotency-Key must not be empty.');
        }

        // Idempotency check
        $existing = WalletTransaction::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use (
            $organizationId,
            $credits,
            $amountPaidPaise,
            $paymentId,
            $idempotencyKey,
            $description,
            $metadata
        ) {
            $existing = WalletTransaction::where('idempotency_key', $idempotencyKey)->first();
            if ($existing) {
                return $existing;
            }

            $wallet = CreditWallet::where('organization_id', $organizationId)->lockForUpdate()->first();
            if (!$wallet) {
                $wallet = CreditWallet::create([
                    'id' => (string) Str::uuid(),
                    'organization_id' => $organizationId,
                    'balance_credits' => 0,
                    'low_balance_threshold' => 50,
                ]);
            }

            $newBalance = $wallet->balance_credits + $credits;
            $wallet->balance_credits = $newBalance;
            $wallet->save();

            $transaction = WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $wallet->id,
                'transaction_type' => 'CREDIT_TOPUP',
                'credits_amount' => $credits,
                'balance_after' => $newBalance,
                'idempotency_key' => $idempotencyKey,
                'reference_type' => 'PAYMENT',
                'reference_id' => null,
                'description' => $description,
                'created_at' => now(),
            ]);

            // Generate GST Tax Invoice
            $this->invoiceService->generateInvoice(
                $organizationId,
                $credits,
                $amountPaidPaise,
                'RAZORPAY',
                $paymentId,
                $metadata['billing_details'] ?? null
            );

            AuditService::log(
                $organizationId,
                null,
                'CREDIT_TOPUP_COMPLETED',
                'wallet_transactions',
                $transaction->id,
                null,
                ['credits' => $credits, 'balance_after' => $newBalance, 'payment_id' => $paymentId]
            );

            return $transaction;
        });
    }

    /**
     * Reverse a transaction atomically and issue refund credits.
     */
    public function refundTransaction(
        string $organizationId,
        string $originalIdempotencyKey,
        string $reason,
        string $newIdempotencyKey
    ): WalletTransaction {
        $existing = WalletTransaction::where('idempotency_key', $newIdempotencyKey)->first();
        if ($existing) {
            return $existing;
        }

        $originalTx = WalletTransaction::where('idempotency_key', $originalIdempotencyKey)->firstOrFail();

        return DB::transaction(function () use ($organizationId, $originalTx, $reason, $newIdempotencyKey) {
            $existing = WalletTransaction::where('idempotency_key', $newIdempotencyKey)->first();
            if ($existing) {
                return $existing;
            }

            $wallet = CreditWallet::where('organization_id', $organizationId)->lockForUpdate()->firstOrFail();

            $refundCredits = $originalTx->credits_amount;
            $newBalance = $wallet->balance_credits + $refundCredits;
            $wallet->balance_credits = $newBalance;
            $wallet->save();

            $refundTx = WalletTransaction::create([
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $wallet->id,
                'transaction_type' => 'REFUND',
                'credits_amount' => $refundCredits,
                'balance_after' => $newBalance,
                'idempotency_key' => $newIdempotencyKey,
                'reference_type' => 'TRANSACTION',
                'reference_id' => $originalTx->id,
                'description' => 'Refund: ' . $reason,
                'created_at' => now(),
            ]);

            AuditService::log(
                $organizationId,
                null,
                'TRANSACTION_REFUNDED',
                'wallet_transactions',
                $refundTx->id,
                ['original_tx_id' => $originalTx->id],
                ['refund_credits' => $refundCredits, 'reason' => $reason]
            );

            return $refundTx;
        });
    }
}
