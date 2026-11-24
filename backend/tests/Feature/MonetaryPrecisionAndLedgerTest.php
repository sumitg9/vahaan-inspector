<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Challan;
use App\Models\Valuation;
use App\Models\WalletTransaction;

class MonetaryPrecisionAndLedgerTest extends TestCase
{
    /**
     * Test that Challan fine amounts are cast as integer minor currency units (paise).
     */
    public function test_challan_monetary_precision(): void
    {
        $challan = new Challan([
            'fine_amount_paise' => 200000, // ₹2,000.00
        ]);

        $this->assertIsInt($challan->fine_amount_paise);
        $this->assertEquals(200000, $challan->fine_amount_paise);
        $this->assertEquals(2000.00, $challan->fine_amount_inr);
    }

    /**
     * Test that Valuation values are stored in paise and correctly formatted to rupees.
     */
    public function test_valuation_monetary_precision_and_override(): void
    {
        $valuation = new Valuation([
            'ex_showroom_price_paise' => 385000000, // ₹38,50,000.00
            'proposed_fair_market_value_paise' => 174275000, // ₹17,42,750.00
            'valuer_override_applied' => true,
            'override_fair_market_value_paise' => 170000000, // ₹17,00,000.00
        ]);

        $this->assertEquals(385000000, $valuation->ex_showroom_price_paise);
        $this->assertEquals(1700000.00, $valuation->effective_fair_market_value_inr);
    }

    /**
     * Test that WalletTransaction ledger records only record created_at and cannot be mutated.
     */
    public function test_wallet_transaction_ledger_is_immutable(): void
    {
        $transaction = new WalletTransaction([
            'credits_amount' => 1000,
            'balance_after' => 1000,
            'idempotency_key' => 'tx_test_123',
        ]);

        $this->assertFalse($transaction->timestamps, 'WalletTransaction must disable standard updated_at timestamps for immutability.');
    }
}
