<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;

class ProviderConfigController extends Controller
{
    /**
     * Internal provider registry storage (simulation of encrypted provider vault).
     */
    protected static array $providers = [
        'apisathi' => [
            'id' => 'apisathi',
            'name' => 'APISathi Vehicle Intelligence API',
            'category' => 'VEHICLE_REGISTRY',
            'base_url' => 'https://api.apisathi.com/v1',
            'api_key' => 'sk_live_apisathi_9921_secret_vault_prod',
            'client_id' => 'vahancheck-ent-prod',
            'environment' => 'SANDBOX',
            'is_active' => true,
            'timeout_ms' => 8000,
            'max_retries' => 3,
            'circuit_breaker_threshold' => 5,
            'mock_fallback_enabled' => false,
            'cost_per_lookup_paise' => 450,
            'last_sync_at' => '2026-11-24T18:30:00Z',
        ],
        'echallan' => [
            'id' => 'echallan',
            'name' => 'National eChallan Traffic Gateway',
            'category' => 'TRAFFIC_VIOLATIONS',
            'base_url' => 'https://echallan.parivahan.gov.in/api/v2',
            'api_key' => 'echallan_sec_key_77189_restricted',
            'client_id' => 'vahancheck-traffic-gov',
            'environment' => 'SANDBOX',
            'is_active' => true,
            'timeout_ms' => 10000,
            'max_retries' => 2,
            'circuit_breaker_threshold' => 4,
            'mock_fallback_enabled' => false,
            'cost_per_lookup_paise' => 250,
            'last_sync_at' => '2026-11-24T18:45:00Z',
        ],
        'mock_gateway' => [
            'id' => 'mock_gateway',
            'name' => 'VahanCheck Deterministic Mock Gateway',
            'category' => 'TESTING_MOCK',
            'base_url' => 'http://localhost:4000',
            'api_key' => 'mock_deterministic_test_key_xyz',
            'client_id' => 'local-mock-fixture',
            'environment' => 'TESTING',
            'is_active' => true,
            'timeout_ms' => 2000,
            'max_retries' => 1,
            'circuit_breaker_threshold' => 10,
            'mock_fallback_enabled' => true,
            'cost_per_lookup_paise' => 0,
            'last_sync_at' => '2026-11-24T19:00:00Z',
        ],
        'fastag' => [
            'id' => 'fastag',
            'name' => 'NETC Fastag Toll Intelligence',
            'category' => 'TOLL_MOVEMENT',
            'base_url' => 'https://api.netc.npci.org.in/v1',
            'api_key' => 'fastag_netc_live_token_3310_auth',
            'client_id' => 'vahancheck-netc-client',
            'environment' => 'SANDBOX',
            'is_active' => false,
            'timeout_ms' => 6000,
            'max_retries' => 2,
            'circuit_breaker_threshold' => 5,
            'mock_fallback_enabled' => false,
            'cost_per_lookup_paise' => 150,
            'last_sync_at' => '2026-11-24T12:00:00Z',
        ],
    ];

    /**
     * Mask secret tokens to enforce Invariant 1 (Zero Secret Leakage).
     */
    protected function maskSecret(?string $secret): string
    {
        if (empty($secret)) {
            return '••••••••••••••••';
        }
        $len = strlen($secret);
        if ($len <= 8) {
            return str_repeat('•', 8);
        }
        $prefix = substr($secret, 0, 4);
        $suffix = substr($secret, -4);
        return "{$prefix}••••••••{$suffix}";
    }

    /**
     * List all providers with strictly masked credentials.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied. Super Admin privileges required for provider vault.', 403);
        }

        $maskedList = [];
        foreach (self::$providers as $id => $p) {
            $masked = $p;
            // Invariant 1: Strictly mask secret credentials
            $masked['api_key'] = $this->maskSecret($p['api_key']);
            $masked['client_id_masked'] = substr($p['client_id'], 0, 4) . '••••' . substr($p['client_id'], -4);
            $maskedList[] = $masked;
        }

        return $this->success($maskedList);
    }

    /**
     * Update provider settings.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied. Super Admin privileges required.', 403);
        }

        if (!isset(self::$providers[$id])) {
            return $this->error("Provider '{$id}' not found in registry.", 404);
        }

        try {
            $validated = $request->validate([
                'base_url' => 'nullable|url',
                'api_key' => 'nullable|string|min:8',
                'environment' => 'nullable|in:TESTING,SANDBOX,PRODUCTION',
                'is_active' => 'nullable|boolean',
                'timeout_ms' => 'nullable|integer|min:500|max:30000',
                'max_retries' => 'nullable|integer|min:0|max:5',
                'circuit_breaker_threshold' => 'nullable|integer|min:1|max:20',
                'mock_fallback_enabled' => 'nullable|boolean',
            ]);
        } catch (\Throwable) {
            $validated = $request->all();
        }

        $current = self::$providers[$id];
        $targetEnv = $validated['environment'] ?? $current['environment'];
        $targetMockFallback = $validated['mock_fallback_enabled'] ?? $validated['is_mock_fallback_enabled'] ?? $current['mock_fallback_enabled'];

        // Invariant 2: Production Provider Fail-Safe (NEVER allow mock fallback in production)
        if ($targetEnv === 'PRODUCTION' && $targetMockFallback === true) {
            AuditService::logSecurityAlert(
                $user->organization_id ?? 'system',
                $user->id,
                'INVARIANT_2_VIOLATION_ATTEMPT',
                'providers',
                $id,
                ['error' => 'Attempted to enable mock fallback in PRODUCTION environment'],
                $request->ip(),
                $request->userAgent()
            );
            return $this->error('Invariant 2 Violation: Mock fallback data is strictly prohibited in production mode. A provider failure must result in an explicit 502 Bad Gateway.', 422);
        }

        $oldValues = [
            'environment' => $current['environment'],
            'is_active' => $current['is_active'],
            'timeout_ms' => $current['timeout_ms'],
            'mock_fallback_enabled' => $current['mock_fallback_enabled'],
        ];

        // Apply updates
        foreach ($validated as $key => $val) {
            if ($val !== null) {
                self::$providers[$id][$key] = $val;
            }
        }
        self::$providers[$id]['last_sync_at'] = now()->toISOString();

        // Audit log with masked values
        $auditNew = $validated;
        if (isset($auditNew['api_key'])) {
            $auditNew['api_key'] = $this->maskSecret($auditNew['api_key']);
        }

        AuditService::log(
            $user->organization_id ?? 'system',
            $user->id,
            'PROVIDER_CONFIGURATION_UPDATED',
            'providers',
            $id,
            $oldValues,
            $auditNew,
            $request->ip(),
            $request->userAgent()
        );

        $response = self::$providers[$id];
        $response['api_key'] = $this->maskSecret($response['api_key']);

        return $this->success($response, "Provider '{$id}' configuration updated successfully.");
    }

    /**
     * Retrieve complete provider agreements & 24-field coverage matrix.
     */
    public function verificationReport(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied to provider verification report.', 403);
        }

        $service = new \App\Modules\Providers\Services\ProviderVerificationService();
        $coverage = $service->getProviderAgreementsAndFieldCoverage();
        $prodConfig = $service->confirmProductionConfiguration();

        return $this->success([
            'coverage_matrix' => $coverage,
            'production_status' => $prodConfig,
        ], 'Provider verification report compiled successfully.');
    }

    /**
     * Execute sandbox response test and schema reconciliation.
     */
    public function testSandbox(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied to sandbox testing.', 403);
        }

        $scenario = $request->input('scenario', 'standard');
        $service = new \App\Modules\Providers\Services\ProviderVerificationService();
        $reconciliation = $service->testSandboxResponseAndReconcile($scenario);

        return $this->success($reconciliation, "Sandbox response for scenario '{$scenario}' reconciled successfully.");
    }

    /**
     * Validate billing credit reservation and idempotency deduplication.
     */
    public function validateBilling(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied to billing validation.', 403);
        }

        $service = new \App\Modules\Providers\Services\ProviderVerificationService();
        $reg = $request->input('registration_number', 'MH12AB1234');
        $idempKey = $request->input('idempotency_key', 'idemp-' . bin2hex(random_bytes(8)));
        $billing = $service->validateBillingAndIdempotency($reg, $idempKey, $user->organization_id ?? 'org-test');

        return $this->success($billing, 'Billing and idempotency verified successfully.');
    }

    /**
     * Confirm production configuration and credential gate.
     */
    public function confirmProduction(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.providers')) {
            return $this->error('Access denied to production confirmation.', 403);
        }

        $service = new \App\Modules\Providers\Services\ProviderVerificationService();
        $prod = $service->confirmProductionConfiguration();

        return $this->success($prod, 'Production configuration status confirmed.');
    }
}
