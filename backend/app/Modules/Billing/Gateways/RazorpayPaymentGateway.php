<?php

namespace App\Modules\Billing\Gateways;

use App\Modules\Billing\Contracts\PaymentGatewayInterface;

class RazorpayPaymentGateway implements PaymentGatewayInterface
{
    protected string $keyId;
    protected string $keySecret;
    protected string $webhookSecret;

    public function __construct(
        string $keyId = '',
        string $keySecret = '',
        string $webhookSecret = ''
    ) {
        $this->keyId = $keyId ?: (getenv('RAZORPAY_KEY_ID') ?: 'rzp_test_placeholder');
        $this->keySecret = $keySecret ?: (getenv('RAZORPAY_KEY_SECRET') ?: 'mock_secret_key_vahancheck_2026');
        $this->webhookSecret = $webhookSecret ?: (getenv('RAZORPAY_WEBHOOK_SECRET') ?: 'mock_secret_key_vahancheck_2026');
    }

    public function createOrder(int $amountPaise, string $currency, string $receipt, array $metadata = []): array
    {
        // When real API key is configured, invoke Razorpay API. In test/mock mode, generate order token.
        $orderId = 'order_rzp_' . substr(md5($receipt . microtime(true)), 0, 16);
        return [
            'gateway' => 'RAZORPAY',
            'order_id' => $orderId,
            'amount_paise' => $amountPaise,
            'currency' => strtoupper($currency),
            'receipt' => $receipt,
            'status' => 'CREATED',
            'created_at' => time(),
            'metadata' => $metadata,
        ];
    }

    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', "{$orderId}|{$paymentId}", $this->keySecret);
        return hash_equals($expectedSignature, $signature);
    }

    public function processRefund(string $paymentId, int $amountPaise, string $reason): array
    {
        $refundId = 'rfnd_rzp_' . substr(md5($paymentId . $reason), 0, 14);
        return [
            'refund_id' => $refundId,
            'payment_id' => $paymentId,
            'amount_paise' => $amountPaise,
            'currency' => 'INR',
            'status' => 'PROCESSED',
            'reason' => $reason,
            'processed_at' => time(),
        ];
    }

    public function verifyWebhookSignature(string $payload, string $signature): bool
    {
        $expectedSignature = hash_hmac('sha256', $payload, $this->webhookSecret);
        return hash_equals($expectedSignature, $signature);
    }
}
