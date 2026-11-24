<?php

namespace App\Modules\Billing\Services;

use App\Models\Invoice;
use App\Models\Organization;
use Illuminate\Support\Str;

class InvoiceService
{
    /**
     * Generate a GST-compliant tax invoice for credit pack purchases or subscriptions.
     * Enforces Invariant 5 (Monetary Precision in minor units paise).
     */
    public function generateInvoice(
        string $organizationId,
        int $creditsPurchased,
        int $subtotalPaise,
        string $paymentGateway = 'RAZORPAY',
        ?string $paymentId = null,
        ?array $billingDetails = null
    ): Invoice {
        $org = Organization::find($organizationId);

        // 18% Indian GST (9% CGST + 9% SGST)
        $taxPaise = (int) round(($subtotalPaise * 18) / 100);
        $totalPaise = $subtotalPaise + $taxPaise;

        $invoiceNumber = 'INV-' . date('Y') . '-' . strtoupper(Str::random(6));

        $defaultBilling = [
            'legal_name' => $org?->legal_name ?? ($org?->name ?? 'Valuation Enterprise Client'),
            'gst_number' => $org?->gst_number ?? '27AABCS1429B1Z8',
            'pan_number' => $org?->pan_number ?? 'AABCS1429B',
            'state' => 'Maharashtra',
            'state_code' => '27',
            'tax_breakdown' => [
                'cgst_rate_pct' => 9.0,
                'cgst_amount_paise' => (int) ($taxPaise / 2),
                'sgst_rate_pct' => 9.0,
                'sgst_amount_paise' => (int) ($taxPaise / 2),
                'igst_rate_pct' => 0.0,
                'igst_amount_paise' => 0,
            ],
            'rate_per_credit_paise' => $creditsPurchased > 0 ? (int) round($subtotalPaise / $creditsPurchased) : 1500,
        ];

        return Invoice::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $organizationId,
            'invoice_number' => $invoiceNumber,
            'status' => 'PAID',
            'subtotal_paise' => $subtotalPaise,
            'tax_paise' => $taxPaise,
            'total_paise' => $totalPaise,
            'credits_purchased' => $creditsPurchased,
            'payment_gateway' => $paymentGateway,
            'payment_id' => $paymentId,
            'billing_details' => array_merge($defaultBilling, $billingDetails ?? []),
            'paid_at' => now(),
        ]);
    }
}
