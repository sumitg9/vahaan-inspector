<?php

namespace App\Modules\Auditing\Services;

use App\Models\AuditLog;
use Illuminate\Support\Str;

class AuditService
{
    /**
     * Record a system audit trail log.
     */
    public static function log(
        ?string $organizationId,
        ?string $userId,
        string $action,
        string $entityType,
        ?string $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): ?AuditLog {
        try {
            return AuditLog::create([
                'id' => (string) Str::uuid(),
                'organization_id' => $organizationId,
                'user_id' => $userId,
                'action' => $action,
                'entity_type' => $entityType,
                'entity_id' => $entityId,
                'old_values' => $oldValues,
                'new_values' => $newValues,
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // Failsafe: log to error log so audit table issues don't crash core user transaction
            if (function_exists('logger')) {
                logger()->error('Failed to write audit log: ' . $e->getMessage(), [
                    'action' => $action,
                    'entity' => $entityType,
                ]);
            }
            return null;
        }
    }

    /**
     * Record a security alert (e.g. cross tenant attempt or privilege escalation).
     */
    public static function logSecurityAlert(
        ?string $organizationId,
        ?string $userId,
        string $alertType,
        string $targetResource,
        ?string $resourceId,
        array $details,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): ?AuditLog {
        return self::log(
            $organizationId,
            $userId,
            $alertType,
            $targetResource,
            $resourceId,
            null,
            $details,
            $ipAddress,
            $userAgent
        );
    }
}
