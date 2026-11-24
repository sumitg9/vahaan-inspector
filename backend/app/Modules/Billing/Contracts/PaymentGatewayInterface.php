<?php

namespace App\Modules\Billing\Contracts;

interface PaymentGatewayInterface
{
    /**
     * Create a payment order.
     *
     * @param int $amountPaise Amount in minor units (Paise)
     * @param string $currency Currency code (INR)
     * @param string $receipt Unique merchant receipt/order reference
     * @param array $metadata Custom key-value pairs
     * @return array Order payload including order_id, amount, currency, status
     */
    public function createOrder(int $amountPaise, string $currency, string $receipt, array $metadata = []): array;

    /**
     * Verify the cryptographic HMAC signature returned by the checkout gateway.
     *
     * @param string $orderId Gateway order ID
     * @param string $paymentId Gateway payment ID
     * @param string $signature Provided HMAC signature
     * @return bool True if valid, false otherwise
     */
    public function verifyPaymentSignature(string $orderId, string $paymentId, string $signature): bool;

    /**
     * Process a refund for a previously captured payment.
     *
     * @param string $paymentId Gateway payment ID
     * @param int $amountPaise Amount to refund in minor units (Paise)
     * @param string $reason Auditable reason for refund
     * @return array Refund payload with refund_id, status, amount
     */
    public function processRefund(string $paymentId, int $amountPaise, string $reason): array;

    /**
     * Verify incoming webhook payload signature.
     *
     * @param string $payload Raw JSON body
     * @param string $signature Header signature
     * @return bool True if authentic webhook
     */
    public function verifyWebhookSignature(string $payload, string $signature): bool;
}
