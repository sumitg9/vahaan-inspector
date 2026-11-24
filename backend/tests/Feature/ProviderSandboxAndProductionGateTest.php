<?php

namespace Tests\Feature;

use App\Modules\Providers\Services\ProviderVerificationService;
use Exception;

class ProviderSandboxAndProductionGateTest
{
    /**
     * Test 1: Verify Provider Agreements & 24-Field Coverage Matrix.
     */
    public static function testProviderAgreementsAndFieldCoverageMatrix(): void
    {
        $service = new ProviderVerificationService();
        $coverage = $service->getProviderAgreementsAndFieldCoverage();

        if (($coverage['total_fields_mapped'] ?? 0) !== 24) {
            throw new Exception("Expected exactly 24 fields in coverage matrix, found: " . ($coverage['total_fields_mapped'] ?? 0));
        }
        if (($coverage['coverage_completeness_pct'] ?? 0) !== 100.0) {
            throw new Exception("Coverage matrix completeness must be 100%");
        }

        $agreements = $coverage['provider_agreements'] ?? [];
        if (!isset($agreements['apisathi_rc_v1']) || !isset($agreements['apisathi_rc_challan'])) {
            throw new Exception("Missing APISathi RC v1 or RC Challan agreement specifications");
        }
        if ($agreements['apisathi_rc_v1']['uptime_sla_pct'] < 99.0) {
            throw new Exception("APISathi RC v1 SLA below 99.0%");
        }

        $caveats = $coverage['regional_caveats'] ?? [];
        if (!isset($caveats['HP']) || !isset($caveats['JK']) || !isset($caveats['NE'])) {
            throw new Exception("Missing regional transport caveats for HP, JK, or North-East");
        }
    }

    /**
     * Test 2: Verify Sandbox Standard Response & Schema Reconciliation.
     */
    public static function testSandboxStandardSchemaReconciliation(): void
    {
        $service = new ProviderVerificationService();
        $res = $service->testSandboxResponseAndReconcile('standard');

        if ($res['registration_number'] !== 'MH12AB1234') {
            throw new Exception("Unexpected registration number: {$res['registration_number']}");
        }

        $rc = $res['schema_reconciliation']['rc_reconciliation'] ?? [];
        if (!$rc['is_reconciled']) {
            throw new Exception("RC schema failed reconciliation");
        }
        if ($rc['fields_mapped_count'] !== 24) {
            throw new Exception("RC reconciliation did not map all 24 fields");
        }
        if (strlen($rc['sha256_hash']) !== 64) {
            throw new Exception("Invalid SHA-256 hash in reconciliation");
        }

        $challans = $res['schema_reconciliation']['challan_reconciliation'] ?? [];
        if (!$challans['is_reconciled']) {
            throw new Exception("Challan schema failed reconciliation");
        }
        if ($challans['total_challans'] !== 2 || $challans['pending_count'] !== 1) {
            throw new Exception("Mismatch in challan counts: {$challans['total_challans']}");
        }
        // Invariant 5: 200,000 paise (₹2,000)
        if ($challans['total_pending_paise'] !== 200000) {
            throw new Exception("Pending fine monetary precision failed: {$challans['total_pending_paise']}");
        }
    }

    /**
     * Test 3: Verify Partial Restricted Response & Invariant 3 (No Data Fabrication).
     */
    public static function testSandboxPartialRestrictedReconciliation(): void
    {
        $service = new ProviderVerificationService();
        $res = $service->testSandboxResponseAndReconcile('partial_restricted');

        $recon = $res['schema_reconciliation'] ?? [];
        if ($recon['fitness_valid_until'] !== null) {
            throw new Exception("Invariant 3 Breach: Restricted fitness was fabricated: {$recon['fitness_valid_until']}");
        }
        if ($recon['fitness_provenance'] !== 'restricted') {
            throw new Exception("Fitness validity must be tagged with 'restricted' provenance");
        }
        if ($recon['financier_name'] !== null) {
            throw new Exception("Invariant 3 Breach: Restricted financier was fabricated");
        }
        if ($recon['financier_provenance'] !== 'restricted') {
            throw new Exception("Financier must be tagged with 'restricted' provenance");
        }
    }

    /**
     * Test 4: Verify Clean Record (0 Challans) Without False Positives.
     */
    public static function testCleanRecordChallanReconciliation(): void
    {
        $service = new ProviderVerificationService();
        $res = $service->testSandboxResponseAndReconcile('clean_vehicle');

        $recon = $res['schema_reconciliation'] ?? [];
        if ($recon['total_challans'] !== 0 || $recon['total_pending_paise'] !== 0) {
            throw new Exception("Clean record vehicle fixture returned non-zero challans");
        }
    }

    /**
     * Test 5: Verify Billing Credit Deduction, Idempotency Deduplication & COGS Margins.
     */
    public static function testBillingAndIdempotencyValidation(): void
    {
        $service = new ProviderVerificationService();
        $billing = $service->validateBillingAndIdempotency('MH12AB1234', 'idemp-test-audit-01', 'org-test-audit');

        if (!$billing['double_charge_prevented']) {
            throw new Exception("Idempotency deduplication check failed: double charge was not prevented");
        }
        if ($billing['first_invocation']['credits_deducted'] !== 1) {
            throw new Exception("First call must deduct 1 credit");
        }
        if ($billing['replayed_invocation']['credits_deducted'] !== 0) {
            throw new Exception("Replayed call must deduct 0 credits (idempotent)");
        }
        if ($billing['financial_ledger_integrity']['total_paise_billed'] !== 1500) {
            throw new Exception("Ledger integrity failed: expected 1500 paise total");
        }

        // COGS Margin verification
        $cogs = $billing['cogs_margin_analysis'] ?? [];
        if ($cogs['customer_retail_paise'] !== 1500 || $cogs['provider_cost_paise'] !== 850) {
            throw new Exception("COGS calculation mismatch: retail or provider cost incorrect");
        }
        if ($cogs['gross_margin_paise'] !== 650 || $cogs['gross_margin_pct'] !== 43.3) {
            throw new Exception("Gross margin mismatch: expected 650 paise (43.3%)");
        }
    }

    /**
     * Test 6: Verify Comprehensive Error Handling (404, 429, 504, 503, Invariant 2).
     */
    public static function testErrorScenariosAndFailSafes(): void
    {
        $service = new ProviderVerificationService();
        $errors = $service->testErrorScenarios();

        if (!($errors['error_404_not_found']['passed'] ?? false)) {
            throw new Exception("404 Vehicle Not Found error test failed");
        }
        if (!($errors['error_429_rate_limit']['passed'] ?? false)) {
            throw new Exception("429 Rate Limit error test failed");
        }
        if ($errors['error_429_rate_limit']['retry_after_seconds'] !== 60) {
            throw new Exception("429 Retry-After seconds incorrect");
        }
        if (!($errors['error_504_timeout']['passed'] ?? false)) {
            throw new Exception("504 Timeout error test failed");
        }
        if (!($errors['error_503_unavailable']['passed'] ?? false)) {
            throw new Exception("503 Unavailable error test failed");
        }
        if (!($errors['invariant_2_production_guard']['passed'] ?? false)) {
            throw new Exception("Invariant 2 Production Guard test failed");
        }
    }

    /**
     * Test 7: Verify Production Configuration Gate & Credential Protection.
     * Enforces: "Execute only when authorized credentials are available. Never expose credentials or substitute mock data in production."
     */
    public static function testProductionConfigurationGate(): void
    {
        $service = new ProviderVerificationService();
        $prod = $service->confirmProductionConfiguration();

        // In development/testing environment without live client credentials:
        if ($prod['execution_status'] === 'BLOCKED_PENDING_CREDENTIALS') {
            if ($prod['can_execute_production'] !== false) {
                throw new Exception("can_execute_production must be false when credentials are not provisioned");
            }
            if ($prod['blocker_code'] !== 'EXT-01') {
                throw new Exception("Blocker code must be EXT-01 (Awaiting Client Provisioning)");
            }
            if (!$prod['production_readiness']['invariant_2_mock_fallback_in_prod_forbidden']) {
                throw new Exception("Invariant 2 mock fallback must be strictly forbidden in production");
            }
        }

        // Secret Masking Verification (Invariant 1)
        $cfg = $prod['safe_masked_configuration'] ?? [];
        if (!str_contains($cfg['api_key_masked'], '••••') && !str_contains($cfg['api_key_masked'], 'NOT CONFIGURED')) {
            throw new Exception("Invariant 1 Leakage: API key was not properly masked in production confirmation: {$cfg['api_key_masked']}");
        }
    }
}
