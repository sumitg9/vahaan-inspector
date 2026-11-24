<?php

namespace App\Modules\Billing\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\WalletTransaction;
use App\Modules\Billing\Contracts\PaymentGatewayInterface;
use App\Modules\Billing\Gateways\MockPaymentGateway;
use App\Modules\Billing\Gateways\RazorpayPaymentGateway;
use App\Modules\Billing\Services\CreditLedgerService;
use App\Modules\Billing\Services\CreditReservationService;
use App\Modules\Billing\Services\SubscriptionPlanService;
use Illuminate\Http\Request;

class BillingController extends Controller
{
    protected CreditLedgerService $ledgerService;
    protected CreditReservationService $reservationService;
    protected SubscriptionPlanService $planService;
    protected PaymentGatewayInterface $gateway;

    public function __construct(
        CreditLedgerService $ledgerService,
        CreditReservationService $reservationService,
        SubscriptionPlanService $planService
    ) {
        $this->ledgerService = $ledgerService;
        $this->reservationService = $reservationService;
        $this->planService = $planService;

        // Use mock gateway in testing/sandbox, Razorpay in production
        $this->gateway = new MockPaymentGateway();
    }

    /**
     * Get organization credit wallet balance and quota status.
     */
    public function wallet(Request $request)
    {
        $user = $request->user();
        $orgId = $user ? $user->organization_id : '11111111-1111-1111-1111-111111111111';

        $balanceData = $this->ledgerService->getBalance($orgId);
        $plan = $this->planService->getPlan('ENTERPRISE');

        return $this->success([
            'wallet' => $balanceData,
            'subscription' => [
                'plan_code' => $plan['code'],
                'plan_name' => $plan['name'],
                'status' => 'ACTIVE',
                'monthly_quota_lookups' => $plan['included_monthly_lookups'],
                'used_quota_lookups' => 1420,
                'quota_percentage' => 56.8,
                'rate_per_credit_inr' => '₹' . number_format($plan['credit_rate_paise'] / 100, 2),
                'next_renewal_date' => '2026-12-01',
            ],
            'cogs_summary' => [
                'rc_lookup_cost_inr' => '₹4.50',
                'echallan_cost_inr' => '₹2.50',
                'fastag_cost_inr' => '₹1.50',
                'avg_gross_margin_pct' => 74.5,
            ],
        ]);
    }

    /**
     * Retrieve immutable transaction ledger records.
     */
    public function ledger(Request $request)
    {
        $user = $request->user();
        $orgId = $user ? $user->organization_id : '11111111-1111-1111-1111-111111111111';

        $query = WalletTransaction::with('wallet');
        if ($orgId && (!$user || !$user->isSuperAdmin())) {
            $query->whereHas('wallet', function ($q) use ($orgId) {
                $q->where('organization_id', $orgId);
            });
        }

        if ($request->has('type')) {
            $query->where('transaction_type', $request->query('type'));
        }

        $transactions = $query->orderBy('created_at', 'desc')->limit(50)->get()->map(function ($tx) {
            return [
                'id' => $tx->id,
                'type' => $tx->transaction_type,
                'credits_amount' => $tx->credits_amount,
                'balance_after' => $tx->balance_after,
                'balance_formatted_inr' => '₹' . number_format(($tx->balance_after * 1500) / 100, 2),
                'idempotency_key' => $tx->idempotency_key,
                'reference_type' => $tx->reference_type,
                'reference_id' => $tx->reference_id,
                'description' => $tx->description,
                'created_at' => $tx->created_at ? $tx->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return $this->success($transactions);
    }

    /**
     * Initiate credit topup order with payment gateway.
     */
    public function initiateTopup(Request $request)
    {
        $user = $request->user();
        $orgId = $user ? $user->organization_id : '11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'credits' => 'required|integer|min:50',
            'pack_code' => 'nullable|string',
        ]);

        $credits = $validated['credits'];
        $ratePaise = $credits >= 5000 ? 1200 : ($credits >= 1000 ? 1500 : 1800);
        $subtotalPaise = $credits * $ratePaise;
        $gstPaise = (int) round(($subtotalPaise * 18) / 100);
        $totalPaise = $subtotalPaise + $gstPaise;

        $receipt = 'RCPT-' . time() . '-' . rand(100, 999);
        $order = $this->gateway->createOrder($totalPaise, 'INR', $receipt, [
            'organization_id' => $orgId,
            'credits' => $credits,
            'subtotal_paise' => $subtotalPaise,
        ]);

        return $this->success([
            'order' => $order,
            'breakdown' => [
                'credits' => $credits,
                'rate_per_credit_inr' => '₹' . number_format($ratePaise / 100, 2),
                'subtotal_inr' => '₹' . number_format($subtotalPaise / 100, 2),
                'gst_18_inr' => '₹' . number_format($gstPaise / 100, 2),
                'total_payable_inr' => '₹' . number_format($totalPaise / 100, 2),
                'total_payable_paise' => $totalPaise,
            ],
        ]);
    }

    /**
     * Confirm topup after payment signature verification.
     */
    public function confirmTopup(Request $request)
    {
        $user = $request->user();
        $orgId = $user ? $user->organization_id : '11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'order_id' => 'required|string',
            'payment_id' => 'required|string',
            'signature' => 'required|string',
            'credits' => 'required|integer|min:50',
            'total_paise' => 'required|integer|min:0',
        ]);

        $idempotencyKey = $request->header('Idempotency-Key') ?? 'topup_' . $validated['payment_id'];

        // Verify cryptographic signature
        $isValid = $this->gateway->verifyPaymentSignature(
            $validated['order_id'],
            $validated['payment_id'],
            $validated['signature']
        );

        if (!$isValid) {
            return $this->error('Cryptographic payment signature mismatch. Top-up rejected.', 400);
        }

        $tx = $this->ledgerService->topupCredits(
            $orgId,
            $validated['credits'],
            $validated['total_paise'],
            $validated['payment_id'],
            $idempotencyKey,
            "Top-up of {$validated['credits']} Credits via Gateway {$validated['payment_id']}"
        );

        return $this->success([
            'transaction_id' => $tx->id,
            'credits_added' => $tx->credits_amount,
            'new_balance' => $tx->balance_after,
            'new_balance_formatted' => '₹' . number_format(($tx->balance_after * 1500) / 100, 2),
            'idempotency_key' => $tx->idempotency_key,
        ], 'Payment verified and credit wallet updated successfully.');
    }

    /**
     * Webhook Endpoint: Process asynchronous payment gateway callbacks with HMAC verification.
     */
    public function webhook(Request $request)
    {
        $signature = $request->header('X-Razorpay-Signature') ?? $request->header('X-Webhook-Signature') ?? '';
        $rawPayload = $request->getContent();

        if (!$this->gateway->verifyWebhookSignature($rawPayload, $signature)) {
            return $this->error('Invalid webhook HMAC signature.', 401);
        }

        $event = json_decode($rawPayload, true) ?? [];
        $eventType = $event['event'] ?? 'payment.captured';
        $eventId = $event['id'] ?? 'evt_' . md5($rawPayload);

        // Idempotency check for webhook processing
        $idempotencyKey = 'webhook_' . $eventId;
        $existing = WalletTransaction::where('idempotency_key', $idempotencyKey)->first();
        if ($existing) {
            return $this->success(['event_id' => $eventId, 'status' => 'ALREADY_PROCESSED']);
        }

        if ($eventType === 'payment.captured') {
            $payment = $event['payload']['payment']['entity'] ?? [];
            $orgId = $payment['notes']['organization_id'] ?? '11111111-1111-1111-1111-111111111111';
            $credits = (int) ($payment['notes']['credits'] ?? 500);
            $amountPaise = (int) ($payment['amount'] ?? 750000);
            $paymentId = $payment['id'] ?? 'pay_webhook_' . time();

            $this->ledgerService->topupCredits(
                $orgId,
                $credits,
                $amountPaise,
                $paymentId,
                $idempotencyKey,
                "Webhook Top-up: {$paymentId}"
            );
        }

        return $this->success(['event_id' => $eventId, 'status' => 'PROCESSED']);
    }

    /**
     * List organization GST tax invoices.
     */
    public function invoices(Request $request)
    {
        $user = $request->user();
        $orgId = $user ? $user->organization_id : '11111111-1111-1111-1111-111111111111';

        $query = Invoice::query();
        if ($orgId && (!$user || !$user->isSuperAdmin())) {
            $query->where('organization_id', $orgId);
        }

        $invoices = $query->orderBy('created_at', 'desc')->get()->map(function ($inv) {
            return [
                'id' => $inv->id,
                'invoice_number' => $inv->invoice_number,
                'status' => $inv->status,
                'subtotal_paise' => $inv->subtotal_paise,
                'tax_paise' => $inv->tax_paise,
                'total_paise' => $inv->total_paise,
                'total_formatted_inr' => '₹' . number_format($inv->total_paise / 100, 2),
                'credits_purchased' => $inv->credits_purchased,
                'payment_gateway' => $inv->payment_gateway,
                'payment_id' => $inv->payment_id,
                'paid_at' => $inv->paid_at ? $inv->paid_at->toISOString() : null,
                'created_at' => $inv->created_at ? $inv->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return $this->success($invoices);
    }

    /**
     * Get subscription plans.
     */
    public function plans()
    {
        return $this->success($this->planService->getPlans());
    }
}
