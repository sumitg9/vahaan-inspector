<?php

namespace Tests\Feature;

use App\Modules\Admin\Controllers\AuditLogController;
use App\Modules\Admin\Controllers\ProviderConfigController;
use App\Modules\Admin\Controllers\UserController;
use App\Modules\Permissions\PermissionMatrix;
use Exception;
use Illuminate\Http\Request;

class AdminGovernanceAndSecurityTest
{
    /**
     * Test 1: Verify Granular Admin Capabilities & Role Invariants in PermissionMatrix.
     */
    public static function testAdminCapabilitiesInPermissionMatrix(): void
    {
        $requiredPerms = [
            PermissionMatrix::ADMIN_DASHBOARD,
            PermissionMatrix::ADMIN_ORGS,
            PermissionMatrix::ADMIN_PROVIDERS,
            PermissionMatrix::ADMIN_FEATURE_FLAGS,
            PermissionMatrix::ADMIN_REPORT_SETTINGS,
            PermissionMatrix::ADMIN_ANALYTICS,
            PermissionMatrix::ADMIN_AUDIT,
        ];

        foreach ($requiredPerms as $perm) {
            if (!PermissionMatrix::roleHasPermission('SUPER_ADMIN', $perm)) {
                throw new Exception("SUPER_ADMIN must possess capability: {$perm}");
            }
            if (PermissionMatrix::roleHasPermission('INSPECTOR', $perm)) {
                throw new Exception("INSPECTOR must NOT possess administrative capability: {$perm}");
            }
            if (PermissionMatrix::roleHasPermission('CLIENT_VIEWER', $perm)) {
                throw new Exception("CLIENT_VIEWER must NOT possess administrative capability: {$perm}");
            }
        }
    }

    /**
     * Test 2: Invariant 1 (Zero Secret Leakage) - API keys and credentials must be masked.
     */
    public static function testZeroSecretLeakageInProviderConfig(): void
    {
        $controller = new ProviderConfigController();
        $reflection = new \ReflectionClass($controller);
        $maskMethod = $reflection->getMethod('maskSecret');
        $maskMethod->setAccessible(true);

        $secret = 'sk_live_apisathi_9921_secret_vault_prod';
        $masked = $maskMethod->invoke($controller, $secret);

        if (str_contains($masked, 'secret_vault_prod')) {
            throw new Exception("Secret token was not masked properly: {$masked}");
        }

        if (!str_contains($masked, '••••••••')) {
            throw new Exception("Masked secret did not contain bullet masking: {$masked}");
        }

        if (strlen($masked) !== 16 && substr($masked, 0, 4) !== 'sk_l') {
            throw new Exception("Masked prefix does not match expected format: {$masked}");
        }
    }

    /**
     * Test 3: Invariant 2 (Provider Fail-Safe) - Mock data cannot be enabled in PRODUCTION mode.
     */
    public static function testInvariant2ProductionFailSafeBlocksMockFallback(): void
    {
        // Mock a user that is SUPER_ADMIN
        $superAdminUser = new class {
            public string $id = 'admin-uuid-1';
            public ?string $organization_id = null;
            public string $role = 'SUPER_ADMIN';
            public function isSuperAdmin(): bool { return true; }
            public function hasPermission(string $p): bool { return true; }
        };

        // Create a simulated request trying to set environment=PRODUCTION and mock_fallback_enabled=true
        $controller = new ProviderConfigController();
        $request = Request::create('/api/v1/admin/providers/apisathi', 'PATCH', [
            'environment' => 'PRODUCTION',
            'mock_fallback_enabled' => true,
        ]);
        $request->setUserResolver(function () use ($superAdminUser) {
            return $superAdminUser;
        });

        $response = $controller->update($request, 'apisathi');
        $data = json_decode($response->getContent(), true);

        if ($response->getStatusCode() !== 422) {
            throw new Exception("Expected HTTP 422 Unprocessable Entity when enabling mock fallback in PRODUCTION, got: " . $response->getStatusCode());
        }

        if (!str_contains($data['message'] ?? '', 'Invariant 2 Violation')) {
            throw new Exception("Expected Invariant 2 violation error message, got: " . ($data['message'] ?? ''));
        }
    }

    /**
     * Test 4: Privilege Escalation Guard - Non-Super Admin cannot create or promote to SUPER_ADMIN.
     */
    public static function testPrivilegeEscalationProhibitedOnUserCreation(): void
    {
        // Mock an ORG_ADMIN user
        $orgAdminUser = new class {
            public string $id = 'org-admin-uuid-2';
            public string $organization_id = 'org-uuid-123';
            public string $role = 'ORG_ADMIN';
            public function isSuperAdmin(): bool { return false; }
            public function hasPermission(string $p): bool { return true; }
        };

        $controller = new UserController();
        $request = Request::create('/api/v1/users', 'POST', [
            'name' => 'Malicious Actor',
            'email' => 'malicious@example.com',
            'role' => 'SUPER_ADMIN',
        ]);
        $request->setUserResolver(function () use ($orgAdminUser) {
            return $orgAdminUser;
        });

        $response = $controller->store($request);
        $data = json_decode($response->getContent(), true);

        if ($response->getStatusCode() !== 403) {
            throw new Exception("Expected HTTP 403 Forbidden on privilege escalation attempt, got: " . $response->getStatusCode());
        }

        if (!str_contains($data['message'] ?? '', 'Privilege escalation prohibited')) {
            throw new Exception("Expected privilege escalation rejection message, got: " . ($data['message'] ?? ''));
        }
    }

    /**
     * Test 5: Prohibition of Unrestricted Sensitive-Data Access (DPDP Act 2023) in Audit Logs.
     */
    public static function testAuditLogAppliesDpdpRedactionOnSensitivePii(): void
    {
        $controller = new AuditLogController();
        $reflection = new \ReflectionClass($controller);
        $redactMethod = $reflection->getMethod('redactSensitiveData');
        $redactMethod->setAccessible(true);

        $sensitivePayload = [
            'owner_name' => 'Mukesh Ambani Logistics',
            'phone' => '+91 98200 12345',
            'pan_number' => 'ABCDE1234F',
            'aadhaar_number' => '123456789012',
            'api_key' => 'secret_live_api_token_value',
            'inspection_notes' => 'Cabin and chassis visually intact.',
        ];

        $redacted = $redactMethod->invoke($controller, $sensitivePayload);

        // Verify owner name is masked
        if ($redacted['owner_name'] === 'Mukesh Ambani Logistics') {
            throw new Exception("Citizen owner name was not masked per DPDP Act: " . $redacted['owner_name']);
        }
        if (!str_contains($redacted['owner_name'], 'M****')) {
            throw new Exception("Citizen owner name masking format mismatch: " . $redacted['owner_name']);
        }

        // Verify phone is masked
        if ($redacted['phone'] === '+91 98200 12345' || !str_contains($redacted['phone'], '••••')) {
            throw new Exception("Phone number was not masked: " . $redacted['phone']);
        }

        // Verify PAN is masked
        if ($redacted['pan_number'] === 'ABCDE1234F' || !str_contains($redacted['pan_number'], '••••')) {
            throw new Exception("PAN number was not masked: " . $redacted['pan_number']);
        }

        // Verify Aadhaar is masked
        if ($redacted['aadhaar_number'] === '123456789012' || !str_contains($redacted['aadhaar_number'], '••••••••')) {
            throw new Exception("Aadhaar was not masked: " . $redacted['aadhaar_number']);
        }

        // Verify API secret is masked
        if ($redacted['api_key'] === 'secret_live_api_token_value') {
            throw new Exception("API key was not masked: " . $redacted['api_key']);
        }

        // Non-sensitive payload preserved
        if ($redacted['inspection_notes'] !== 'Cabin and chassis visually intact.') {
            throw new Exception("Non-sensitive fields were corrupted: " . $redacted['inspection_notes']);
        }
    }
}
