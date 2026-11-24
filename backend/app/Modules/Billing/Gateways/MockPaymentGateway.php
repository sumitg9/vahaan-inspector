<?php

namespace App\Modules\Billing\Gateways;

use App\Modules\Billing\Contracts\PaymentGatewayInterface;

class MockPaymentGateway implements PaymentGatewayInterface
{
    protected string $keySecret;

    public function __construct(string $keySecret = 'mock_secret_key_vahancheck_2026')
    {
        $this->keySecret = $keySecret;
    }

    public function createOrder(int $amountPaise, string $currency, string $receipt, array $metadata = []): array
    {
        $orderId = 'order_mock_' . substr(md5($receipt . microtime(true)), 0, 16);
        return [
            'gateway' => 'MOCK_GATEWAY',
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

    public function generateValidSignature(string $orderId, string $paymentId): string
    {
        return hash_hmac('sha256', "{$orderId}|{$paymentId}", $this->keySecret);
    }

    public function processRefund(string $paymentId, int $amountPaise, string $reason): array
    {
        $refundId = 'rfnd_mock_' . substr(md5($paymentId . $reason), 0, 14);
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
        $expectedSignature = hash_hmac('sha256', $payload, $this->keySecret);
        return hash_equals($expectedSignature, $signature);
    }

    public function generateWebhookSignature(string $payload): string
    {
        return hash_hmac('sha256', $payload, $this->keySecret);
    }
}
