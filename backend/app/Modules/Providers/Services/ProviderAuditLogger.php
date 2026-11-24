<?php

namespace App\Modules\Providers\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class ProviderAuditLogger
{
    /**
     * Log sanitized provider execution metrics and audit trail.
     * Enforces Zero Secret Leakage and DPDP Act PII Sanitization.
     */
    public static function logQuery(array $data): void
    {
        $orgId = $data['organization_id'] ?? null;
        $userId = $data['user_id'] ?? null;
        $provider = $data['provider'] ?? 'unknown';
        $service = $data['service'] ?? 'UNKNOWN'; // RC_LOOKUP, CHALLAN_LOOKUP
        $registrationNumber = strtoupper($data['registration_number'] ?? 'UNKNOWN');
        $statusCode = $data['status_code'] ?? 200;
        $durationMs = $data['duration_ms'] ?? 0;
        $creditsDeducted = $data['credits_deducted'] ?? 0;
        $costPaise = $data['cost_paise'] ?? 0;
        $idempotencyKey = $data['idempotency_key'] ?? null;
        $rawHash = $data['raw_response_hash'] ?? null;

        // Strictly sanitize any logged payload
        $sanitizedDetails = [
            'provider' => $provider,
            'service' => $service,
            'registration_number' => $registrationNumber,
            'status_code' => $statusCode,
            'duration_ms' => $durationMs,
            'credits_deducted' => $creditsDeducted,
            'cost_paise' => $costPaise,
            'idempotency_key' => $idempotencyKey,
            'raw_response_hash' => $rawHash,
            'is_mock' => $data['is_mock'] ?? false,
        ];

        // 1. Structured Laravel application log (scrubbed of secrets)
        if (class_exists('Illuminate\Support\Facades\Log') && method_exists('Illuminate\Support\Facades\Log', 'info')) {
            Log::info("Provider Query: {$service} via [{$provider}] for {$registrationNumber} - Status {$statusCode} in {$durationMs}ms", $sanitizedDetails);
        }

        // 2. Persistent AuditLog record in database if organization context exists
        if ($orgId && class_exists(AuditLog::class) && method_exists(AuditLog::class, 'create')) {
            try {
                AuditLog::create([
                    'organization_id' => $orgId,
                    'user_id' => $userId,
                    'action' => "PROVIDER_{$service}",
                    'entity_type' => 'VehicleProfile',
                    'entity_id' => $data['entity_id'] ?? null,
                    'payload_before' => null,
                    'payload_after' => $sanitizedDetails,
                    'ip_address' => function_exists('request') ? (request()->ip() ?? '127.0.0.1') : '127.0.0.1',
                    'user_agent' => function_exists('request') ? substr(request()->userAgent() ?? 'VahanCheck-Engine/1.0', 0, 255) : 'VahanCheck-Engine/1.0',
                ]);
            } catch (\Throwable $e) {
                // Non-blocking for audit failure
                if (class_exists('Illuminate\Support\Facades\Log') && method_exists('Illuminate\Support\Facades\Log', 'warning')) {
                    Log::warning("Could not persist provider audit log: {$e->getMessage()}");
                }
            }
        }
    }

    /**
     * Sanitizes raw headers to ensure no API keys or Bearer tokens leak into logs.
     */
    public static function sanitizeHeaders(array $headers): array
    {
        $sensitiveKeys = ['x-api-key', 'x-secret-key', 'authorization', 'cookie', 'token'];
        $clean = [];

        foreach ($headers as $k => $v) {
            $lower = strtolower($k);
            if (in_array($lower, $sensitiveKeys) || str_contains($lower, 'key') || str_contains($lower, 'secret')) {
                $clean[$k] = '[REDACTED]';
            } else {
                $clean[$k] = $v;
            }
        }

        return $clean;
    }
}
