<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\User;
use App\Modules\Admin\Controllers\AuditLogController;
use App\Modules\Admin\Controllers\ProviderConfigController;
use App\Modules\Admin\Controllers\UserController;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Inspections\Exceptions\UntestedCheckpointDefaultException;
use App\Modules\Permissions\PermissionMatrix;
use App\Modules\Reports\Services\ReportSnapshotService;
use Exception;
use Illuminate\Support\Str;

class SecurityAndComplianceAuditTest
{
    /**
     * Test 1: Cross-Tenant Isolation & Security Alert Trigger.
     */
    public static function testCrossTenantAccessBarrier(): void
    {
        $orgA = 'org-tenant-a-' . Str::random(6);
        $orgB = 'org-tenant-b-' . Str::random(6);

        // User belongs to Tenant A
        $userA = new class($orgA) {
            public string $id = 'user-a-1';
            public string $organization_id;
            public string $role = 'ORG_ADMIN';
            public function __construct($o) { $this->organization_id = $o; }
            public function isSuperAdmin(): bool { return false; }
            public function hasPermission(string $p): bool { return true; }
        };

        // Attempting to query Tenant B's audit logs as User A
        $request = new class($userA, $orgB) extends \Illuminate\Http\Request {
            protected $user;
            public string $targetOrg;
            public function __construct($u, $t) { $this->user = $u; $this->targetOrg = $t; }
            public function user() { return $this->user; }
            public function has(string $k): bool { return $k === 'organization_id'; }
            public function query(?string $k = null, $d = null) { return $k === 'organization_id' ? $this->targetOrg : $d; }
            public function input(string $k, $d = null) { return $d; }
            public function ip(): string { return '192.168.1.100'; }
            public function userAgent(): string { return 'IntruderBrowser/1.0'; }
            public function path(): string { return 'api/v1/admin/audit/logs'; }
        };

        $ctrl = new AuditLogController();
        $response = $ctrl->index($request);

        // Must scope strictly to userA's organization_id ($orgA), ignoring the requested $orgB
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $data = $response->getData(true);
            if (!empty($data['data'])) {
                foreach ($data['data'] as $log) {
                    if ($log['organization_id'] === $orgB) {
                        throw new Exception("Cross-tenant isolation breached: Tenant A user accessed Tenant B logs");
                    }
                }
            }
        }
    }

    /**
     * Test 2: Privilege Escalation Safeguard (Non-super-admin cannot assign SUPER_ADMIN).
     */
    public static function testPrivilegeEscalationSafeguard(): void
    {
        $orgAdmin = new class {
            public string $id = 'admin-user-01';
            public string $organization_id = 'org-esc-test';
            public string $role = 'ORG_ADMIN';
            public function isSuperAdmin(): bool { return false; }
            public function hasPermission(string $p): bool { return true; }
        };

        // Org admin attempting to create a SUPER_ADMIN user
        $request = new class($orgAdmin) extends \Illuminate\Http\Request {
            protected $user;
            public function __construct($u) { $this->user = $u; }
            public function user() { return $this->user; }
            public function ip(): string { return '127.0.0.1'; }
            public function userAgent(): string { return 'AuditRunner/1.0'; }
            public function validate(array $rules): array {
                return [
                    'first_name' => 'Attacker',
                    'last_name' => 'Escalator',
                    'email' => 'hacked@root.com',
                    'password' => 'Secret123!',
                    'role' => 'SUPER_ADMIN', // Attempted escalation
                    'organization_id' => 'org-esc-test',
                ];
            }
            public function all(): array {
                return $this->validate([]);
            }
        };

        $ctrl = new UserController();
        $response = $ctrl->store($request);

        // Controller must reject with HTTP 403 Forbidden
        if ($response->getStatusCode() !== 403) {
            throw new Exception("Privilege escalation test failed: Expected HTTP 403, got {$response->getStatusCode()}");
        }
    }

    /**
     * Test 3: Zero Secret Leakage (Invariant 1).
     */
    public static function testProviderCredentialMasking(): void
    {
        $superAdmin = new class {
            public string $id = 'super-admin-root';
            public string $role = 'SUPER_ADMIN';
            public function isSuperAdmin(): bool { return true; }
            public function hasPermission(string $p): bool { return true; }
        };

        $request = new class($superAdmin) extends \Illuminate\Http\Request {
            protected $user;
            public function __construct($u) { $this->user = $u; }
            public function user() { return $this->user; }
            public function all(): array { return []; }
            public function ip(): string { return '127.0.0.1'; }
            public function userAgent(): string { return 'AuditRunner/1.0'; }
        };

        $ctrl = new ProviderConfigController();
        $response = $ctrl->index($request);

        $data = $response->getData(true);
        $providers = $data['data'] ?? [];

        foreach ($providers as $p) {
            if (!str_contains($p['api_key'], '••••')) {
                throw new Exception("Invariant 1 Leakage: Provider {$p['id']} API key returned without masking: {$p['api_key']}");
            }
            if (isset($p['secret_key']) && !str_contains($p['secret_key'], '••••')) {
                throw new Exception("Invariant 1 Leakage: Provider {$p['id']} secret key returned without masking");
            }
        }
    }

    /**
     * Test 4: Production Mock Fallback Prohibition (Invariant 2).
     */
    public static function testProductionMockFallbackProhibition(): void
    {
        $superAdmin = new class {
            public string $id = 'super-admin-root';
            public string $organization_id = 'org-super-admin';
            public string $role = 'SUPER_ADMIN';
            public function isSuperAdmin(): bool { return true; }
            public function hasPermission(string $p): bool { return true; }
        };

        // Attempting to enable mock fallback in PRODUCTION environment
        $request = new class($superAdmin) extends \Illuminate\Http\Request {
            protected $user;
            public function __construct($u) { $this->user = $u; }
            public function user() { return $this->user; }
            public function validate(array $rules): array {
                return [
                    'environment' => 'PRODUCTION',
                    'mock_fallback_enabled' => true, // Forbidden!
                ];
            }
            public function all(): array {
                return $this->validate([]);
            }
            public function ip(): string { return '127.0.0.1'; }
            public function userAgent(): string { return 'AuditRunner/1.0'; }
        };

        $ctrl = new ProviderConfigController();
        $response = $ctrl->update($request, 'apisathi');

        // Must reject with HTTP 422 Unprocessable Entity
        if ($response->getStatusCode() !== 422) {
            throw new Exception("Invariant 2 Fail-Safe Failed: Expected 422 when enabling mock fallback in PRODUCTION, got: {$response->getStatusCode()}");
        }

        $resData = $response->getData(true);
        if (!str_contains($resData['message'] ?? '', '502 Bad Gateway')) {
            throw new Exception("Invariant 2 Fail-Safe message must specify explicit 502 Bad Gateway");
        }
    }

    /**
     * Test 5: Prohibition of Data Fabrication (Invariant 3).
     */
    public static function testProhibitionOfDataFabrication(): void
    {
        // Untested item verification
        $exception = new UntestedCheckpointDefaultException('Cabin Outer Sheet Metal');
        if (!str_contains($exception->getMessage(), 'Prohibition of Data Fabrication Invariant')) {
            throw new Exception("UntestedCheckpointDefaultException message missing invariant title");
        }
    }

    /**
     * Test 6: DPDP Act 2023 Citizen PII Redaction in Forensic Audit Trail.
     */
    public static function testDpdpActCitizenPiiRedaction(): void
    {
        $ctrl = new AuditLogController();

        $sensitivePayload = [
            'owner_name' => 'Mukesh Ambani Logistics',
            'phone' => '+919820012345',
            'pan' => 'ABCDE1234F',
            'aadhaar' => '123456789012',
            'api_key' => 'secret_live_token_1234567',
        ];

        // Access reflection to test protected redactSensitiveData method
        $reflection = new \ReflectionClass($ctrl);
        $method = $reflection->getMethod('redactSensitiveData');
        $method->setAccessible(true);

        $redacted = $method->invoke($ctrl, $sensitivePayload);

        if ($redacted['owner_name'] === 'Mukesh Ambani Logistics') {
            throw new Exception("DPDP Act Violation: Citizen owner name was not redacted");
        }
        if (!str_contains($redacted['phone'], '••••')) {
            throw new Exception("DPDP Act Violation: Phone number was not masked");
        }
        if (!str_contains($redacted['pan'], '••••')) {
            throw new Exception("DPDP Act Violation: PAN was not masked");
        }
        if (!str_contains($redacted['aadhaar'], '••••')) {
            throw new Exception("DPDP Act Violation: Aadhaar was not masked");
        }
        if ($redacted['api_key'] !== '••••••••••••••••') {
            throw new Exception("Security Leakage: API key was not completely blanked in audit trail");
        }
    }
}
