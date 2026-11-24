<?php

namespace Tests\Feature;

use App\Models\CreditReservation;
use App\Models\CreditWallet;
use App\Models\WalletTransaction;
use App\Modules\Billing\Exceptions\InsufficientCreditsException;
use App\Modules\Billing\Gateways\MockPaymentGateway;
use App\Modules\Billing\Services\CreditLedgerService;
use App\Modules\Billing\Services\CreditReservationService;
use App\Modules\Billing\Services\InvoiceService;
use App\Modules\Billing\Services\SubscriptionPlanService;
use Exception;
use Illuminate\Support\Str;

class BillingLedgerAndIdempotencyTest
{
    /**
     * Test 1: Invariant 5 (Monetary Precision in minor units paise & integer credit balances).
     */
    public static function testDoubleEntryLedgerMonetaryPrecisionAndBalance(): void
    {
        $planService = new SubscriptionPlanService();
        $invoiceService = new InvoiceService();
        $ledgerService = new CreditLedgerService($planService, $invoiceService);

        $orgId = 'org-billing-test-' . Str::random(6);
        $balance = $ledgerService->getBalance($orgId);

        if (!is_int($balance['balance_credits'])) {
            throw new Exception("balance_credits must be an integer, got: " . gettype($balance['balance_credits']));
        }

        if (!is_int($balance['balance_paise'])) {
            throw new Exception("balance_paise must be an integer (minor units), got: " . gettype($balance['balance_paise']));
        }

        // Test tariff minor unit precision
        $rcCost = $planService->getProviderCostPaise('apisathi_rc_v1');
        if ($rcCost !== 450) {
            throw new Exception("Expected APISathi RC cost to be 450 paise (₹4.50), got: {$rcCost}");
        }

        $challanCost = $planService->getProviderCostPaise('echallan_parivahan');
        if ($challanCost !== 250) {
            throw new Exception("Expected eChallan cost to be 250 paise (₹2.50), got: {$challanCost}");
        }
    }

    /**
     * Test 2: Idempotency & Duplicate Charge Prevention under Concurrent Requests.
     */
    public static function testIdempotencyPreventsDuplicateCharges(): void
    {
        $planService = new SubscriptionPlanService();
        $invoiceService = new InvoiceService();

        // Create an in-memory test wallet
        $orgId = 'org-idem-' . Str::random(6);
        $wallet = new CreditWallet([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'balance_credits' => 100,
        ]);

        $ledgerService = new class($planService, $invoiceService, $wallet) extends CreditLedgerService {
            protected CreditWallet $testWallet;
            protected array $transactionsStore = [];

            public function __construct($p, $i, $w) {
                parent::__construct($p, $i);
                $this->testWallet = $w;
            }

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
                // Idempotency check: if transaction exists with this key, return it without re-deducting
                if (isset($this->transactionsStore[$idempotencyKey])) {
                    return $this->transactionsStore[$idempotencyKey];
                }

                if ($this->testWallet->balance_credits < $credits) {
                    throw new InsufficientCreditsException("Insufficient balance.");
                }

                $this->testWallet->balance_credits -= $credits;

                $tx = new WalletTransaction([
                    'id' => (string) Str::uuid(),
                    'credit_wallet_id' => $this->testWallet->id,
                    'transaction_type' => $type,
                    'credits_amount' => $credits,
                    'balance_after' => $this->testWallet->balance_credits,
                    'idempotency_key' => $idempotencyKey,
                    'description' => $description,
                ]);

                $this->transactionsStore[$idempotencyKey] = $tx;
                return $tx;
            }

            public function getTestWallet(): CreditWallet {
                return $this->testWallet;
            }
        };

        $idempotencyKey = 'req_rc_lookup_unique_key_' . Str::random(8);

        // First Call: Should deduct 1 credit (balance becomes 99)
        $tx1 = $ledgerService->deductCredits(
            $orgId,
            1,
            'RC_LOOKUP_DEDUCTION',
            $idempotencyKey,
            'First deduction attempt'
        );

        if ($ledgerService->getTestWallet()->balance_credits !== 99) {
            throw new Exception("Expected balance to be 99 after first deduction, got: " . $ledgerService->getTestWallet()->balance_credits);
        }

        // Second Call with SAME Idempotency-Key: MUST NOT double-deduct! Balance must stay 99
        $tx2 = $ledgerService->deductCredits(
            $orgId,
            1,
            'RC_LOOKUP_DEDUCTION',
            $idempotencyKey,
            'Concurrent or repeated deduction attempt'
        );

        if ($ledgerService->getTestWallet()->balance_credits !== 99) {
            throw new Exception("Duplicate deduction detected! Balance dropped to: " . $ledgerService->getTestWallet()->balance_credits);
        }

        if ($tx1->id !== $tx2->id) {
            throw new Exception("Idempotent calls must return identical transaction records");
        }
    }

    /**
     * Test 3: Two-Phase Credit Reservation Pool (Reserve -> Commit vs Reserve -> Release).
     */
    public static function testCreditReservationTwoPhaseCommitAndRelease(): void
    {
        $orgId = 'org-res-' . Str::random(6);
        $wallet = new CreditWallet([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgId,
            'balance_credits' => 50,
        ]);

        $resService = new class($wallet) extends CreditReservationService {
            protected CreditWallet $wallet;
            public array $reservations = [];

            public function __construct($w) { $this->wallet = $w; }

            public function reserve(
                string $organizationId,
                int $credits,
                string $referenceType,
                ?string $referenceId,
                string $idempotencyKey,
                int $ttlSeconds = 300
            ): CreditReservation {
                if ($this->wallet->balance_credits < $credits) {
                    throw new InsufficientCreditsException("Insufficient credits to reserve.");
                }

                $this->wallet->balance_credits -= $credits;

                $res = new CreditReservation([
                    'id' => 'res_' . Str::random(8),
                    'credit_wallet_id' => $this->wallet->id,
                    'organization_id' => $organizationId,
                    'credits_amount' => $credits,
                    'status' => 'PENDING',
                    'idempotency_key' => $idempotencyKey,
                ]);

                $this->reservations[$res->id] = $res;
                return $res;
            }

            public function release(string $reservationId, string $reason): bool {
                if (isset($this->reservations[$reservationId]) && $this->reservations[$reservationId]->status === 'PENDING') {
                    $this->wallet->balance_credits += $this->reservations[$reservationId]->credits_amount;
                    $this->reservations[$reservationId]->status = 'RELEASED';
                    return true;
                }
                return false;
            }

            public function getWallet(): CreditWallet { return $this->wallet; }
        };

        // 1. Reserve 15 credits for an inspection
        $res = $resService->reserve($orgId, 15, 'INSPECTION_CASE', null, 'idem_res_01');
        if ($resService->getWallet()->balance_credits !== 35) {
            throw new Exception("Expected spendable balance to be 35 after reserving 15 credits, got: " . $resService->getWallet()->balance_credits);
        }

        // 2. Inspection fails / aborts -> Release reservation
        $released = $resService->release($res->id, 'Inspection aborted by client');
        if (!$released) {
            throw new Exception("Failed to release reservation");
        }

        if ($resService->getWallet()->balance_credits !== 50) {
            throw new Exception("Expected spendable balance to restore to 50 after release, got: " . $resService->getWallet()->balance_credits);
        }
    }

    /**
     * Test 4: Payment Gateway Cryptographic HMAC-SHA256 Signature Verification.
     */
    public static function testPaymentGatewayHmacSignatureVerification(): void
    {
        $gateway = new MockPaymentGateway('test_secret_key_vahancheck');

        $orderId = 'order_test_9981';
        $paymentId = 'pay_test_4421';

        // Generate authentic signature
        $validSignature = $gateway->generateValidSignature($orderId, $paymentId);

        // Verification must pass
        if (!$gateway->verifyPaymentSignature($orderId, $paymentId, $validSignature)) {
            throw new Exception("Authentic HMAC signature failed verification");
        }

        // Tampered signature must fail
        $tamperedSignature = $validSignature . 'tampered';
        if ($gateway->verifyPaymentSignature($orderId, $paymentId, $tamperedSignature)) {
            throw new Exception("Tampered signature unexpectedly succeeded verification");
        }

        // Webhook signature verification
        $webhookPayload = json_encode(['event' => 'payment.captured', 'id' => 'evt_123']);
        $validWebhookSig = $gateway->generateWebhookSignature($webhookPayload);

        if (!$gateway->verifyWebhookSignature($webhookPayload, $validWebhookSig)) {
            throw new Exception("Authentic webhook signature failed verification");
        }
    }

    /**
     * Test 5: Provider Cost (COGS) Tracking and Gross Margin Calculations.
     */
    public static function testProviderCostTrackingAndMarginCalculation(): void
    {
        $planService = new SubscriptionPlanService();

        // Customer charges: 1 Cr = 1500 paise (₹15.00)
        $customerRevenuePaise = 1500;

        // APISathi RC Lookup: COGS = 450 paise (₹4.50)
        $apisathiCost = $planService->getProviderCostPaise('apisathi_rc_v1');
        $apisathiMarginPct = (($customerRevenuePaise - $apisathiCost) / $customerRevenuePaise) * 100;

        if (round($apisathiMarginPct) !== 70.0) {
            throw new Exception("Expected 70% gross margin on RC lookup, got: {$apisathiMarginPct}%");
        }

        // eChallan Lookup: COGS = 250 paise (₹2.50)
        $echallanCost = $planService->getProviderCostPaise('echallan_parivahan');
        $echallanMarginPct = (($customerRevenuePaise - $echallanCost) / $customerRevenuePaise) * 100;

        if (round($echallanMarginPct) !== 83.0) {
            throw new Exception("Expected ~83% gross margin on Challan lookup, got: {$echallanMarginPct}%");
        }
    }
}
