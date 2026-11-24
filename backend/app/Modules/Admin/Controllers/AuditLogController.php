<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Redact sensitive citizen PII according to India's DPDP Act 2023 (Prohibit Unrestricted Sensitive Data Access).
     */
    protected function redactSensitiveData(?array $data): ?array
    {
        if ($data === null) {
            return null;
        }

        $redacted = [];
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $redacted[$key] = $this->redactSensitiveData($value);
            } elseif (is_string($value)) {
                $lowerKey = strtolower($key);
                if (in_array($lowerKey, ['owner_name', 'registered_owner', 'customer_name', 'name'])) {
                    // Mask citizen name: M**** S****
                    $words = explode(' ', trim($value));
                    $maskedWords = array_map(function ($w) {
                        return strlen($w) > 1 ? $w[0] . str_repeat('*', min(4, strlen($w) - 1)) : $w;
                    }, $words);
                    $redacted[$key] = implode(' ', $maskedWords);
                } elseif (in_array($lowerKey, ['phone', 'mobile'])) {
                    $redacted[$key] = strlen($value) >= 8 ? substr($value, 0, 3) . '••••' . substr($value, -2) : '••••••••';
                } elseif (in_array($lowerKey, ['pan', 'pan_number'])) {
                    $redacted[$key] = strlen($value) >= 10 ? substr($value, 0, 5) . '••••' . substr($value, -1) : '••••••••';
                } elseif (in_array($lowerKey, ['aadhaar', 'aadhaar_number'])) {
                    $redacted[$key] = '••••••••' . substr($value, -4);
                } elseif (in_array($lowerKey, ['api_key', 'token', 'secret', 'password_hash'])) {
                    $redacted[$key] = '••••••••••••••••';
                } else {
                    $redacted[$key] = $value;
                }
            } else {
                $redacted[$key] = $value;
            }
        }
        return $redacted;
    }

    /**
     * List audit trail logs with DPDP redactions and multi-tenant scoping.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('audit.view') && !$user->hasPermission('admin.audit')) {
            return $this->error('Access denied to audit logs.', 403);
        }

        $query = AuditLog::with(['organization', 'user']);

        // Multi-tenant scoping (Invariant 4)
        if (!$user->isSuperAdmin()) {
            $query->where('organization_id', $user->organization_id);
        } elseif ($request->has('organization_id')) {
            $query->where('organization_id', $request->query('organization_id'));
        }

        if ($request->has('action')) {
            $query->where('action', $request->query('action'));
        }

        if ($request->has('entity_type')) {
            $query->where('entity_type', $request->query('entity_type'));
        }

        $logs = $query->orderBy('created_at', 'desc')->limit(100)->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'action' => $log->action,
                'entity_type' => $log->entity_type,
                'entity_id' => $log->entity_id,
                'organization_id' => $log->organization_id,
                'organization_name' => $log->organization?->name ?? 'System',
                'user_id' => $log->user_id,
                'user_name' => $log->user?->name ?? 'System Process',
                'user_role' => $log->user?->role ?? 'SYSTEM',
                // Prohibit unrestricted sensitive-data access: Enforce DPDP redactions
                'old_values' => $this->redactSensitiveData($log->old_values),
                'new_values' => $this->redactSensitiveData($log->new_values),
                'ip_address' => $log->ip_address ?? '127.0.0.1',
                'user_agent' => $log->user_agent ? substr($log->user_agent, 0, 50) . '...' : null,
                'created_at' => $log->created_at ? $log->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return $this->success($logs);
    }

    /**
     * List critical security alerts (Privilege Escalation, Cross-Tenant Violations, Invariant Breaches).
     */
    public function securityAlerts(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('audit.view')) {
            return $this->error('Access denied to security alerts.', 403);
        }

        $securityActions = [
            'PRIVILEGE_ESCALATION_ATTEMPT',
            'CROSS_TENANT_ACCESS_ATTEMPT',
            'INVARIANT_2_VIOLATION_ATTEMPT',
            'UNAUTHORIZED_ACCESS_ATTEMPT',
        ];

        $query = AuditLog::with(['organization', 'user'])->whereIn('action', $securityActions);

        if (!$user->isSuperAdmin()) {
            $query->where('organization_id', $user->organization_id);
        }

        $alerts = $query->orderBy('created_at', 'desc')->limit(50)->get()->map(function ($alert) {
            return [
                'id' => $alert->id,
                'alert_type' => $alert->action,
                'severity' => 'HIGH',
                'target_resource' => $alert->entity_type,
                'resource_id' => $alert->entity_id,
                'details' => $alert->new_values,
                'actor_user' => $alert->user?->name ?? 'Unauthenticated / Token User',
                'actor_role' => $alert->user?->role ?? 'UNKNOWN',
                'actor_ip' => $alert->ip_address,
                'organization_name' => $alert->organization?->name ?? 'External',
                'timestamp' => $alert->created_at ? $alert->created_at->toISOString() : now()->toISOString(),
            ];
        });

        return $this->success($alerts);
    }
}
