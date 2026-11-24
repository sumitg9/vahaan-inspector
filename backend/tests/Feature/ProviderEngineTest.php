<?php

namespace Tests\Feature;

use App\Models\CreditWallet;
use App\Models\Organization;
use App\Models\User;
use App\Models\VehicleProfile;
use App\Models\WalletTransaction;
use App\Modules\Providers\Contracts\ChallanDataProviderInterface;
use App\Modules\Providers\Contracts\VehicleDataProviderInterface;
use App\Modules\Providers\Drivers\ApisathiProvider;
use App\Modules\Providers\Drivers\MockProvider;
use App\Modules\Providers\DTOs\NormalizedChallanDto;
use App\Modules\Providers\DTOs\NormalizedChallanResponseDto;
use App\Modules\Providers\DTOs\NormalizedVehicleDto;
use App\Modules\Providers\Exceptions\ProviderConfigurationException;
use App\Modules\Providers\Exceptions\ProviderRateLimitException;
use App\Modules\Providers\Exceptions\ProviderTimeoutException;
use App\Modules\Providers\Exceptions\ProviderUnavailableException;
use App\Modules\Providers\Exceptions\VehicleNotFoundException;
use App\Modules\Providers\Services\ProviderAuditLogger;
use App\Modules\Providers\Services\ProviderManager;
use App\Modules\VehicleIntel\Services\VehicleIntelligenceService;

class ProviderEngineTest
{
    /**
     * Test 1: Verify MockProvider returns NormalizedVehicleDto with watermark for standard fixture.
     */
    public static function testMockProviderStandardVehicle(): void
    {
        $provider = new MockProvider();
        $dto = $provider->lookupVehicle('MH12AB1234');

        if (!$dto instanceof NormalizedVehicleDto) {
            throw new \Exception("Expected NormalizedVehicleDto instance");
        }
        if ($dto->registrationNumber !== 'MH12AB1234') {
            throw new \Exception("Mismatch registration number: {$dto->registrationNumber}");
        }
        if ($dto->isMockData !== true) {
            throw new \Exception("Expected isMockData to be true");
        }
        if ($dto->watermark !== 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE') {
            throw new \Exception("Indelible mock watermark missing from DTO");
        }
        if (!$dto->hypothecated || $dto->financierName !== 'TATA MOTORS FINANCE LIMITED') {
            throw new \Exception("Hypothecation data missing or incorrect");
        }
        if (strlen($dto->rawResponseHash) !== 64) {
            throw new \Exception("Invalid SHA-256 raw response hash");
        }
    }

    /**
     * Test 2: Verify MockProvider returns NormalizedChallanResponseDto with paise monetary precision.
     */
    public static function testMockProviderChallansPaisePrecision(): void
    {
        $provider = new MockProvider();
        $res = $provider->lookupChallans('MH12AB1234');

        if (!$res instanceof NormalizedChallanResponseDto) {
            throw new \Exception("Expected NormalizedChallanResponseDto instance");
        }
        if ($res->totalChallans !== 2) {
            throw new \Exception("Expected 2 challans for MH12AB1234, found {$res->totalChallans}");
        }
        if ($res->pendingChallansCount !== 1) {
            throw new \Exception("Expected 1 pending challan, found {$res->pendingChallansCount}");
        }
        // ₹2,000 pending -> 200,000 paise
        if ($res->totalPendingPaise !== 200000) {
            throw new \Exception("Expected 200000 paise pending, found {$res->totalPendingPaise}");
        }
        // ₹1,000 disposed -> 100,000 paise
        if ($res->totalDisposedPaise !== 100000) {
            throw new \Exception("Expected 100000 paise disposed, found {$res->totalDisposedPaise}");
        }
        // Clean vehicle scenario: KA01MJ0001
        $clean = $provider->lookupChallans('KA01MJ0001');
        if ($clean->totalChallans !== 0 || $clean->pendingChallansCount !== 0) {
            throw new \Exception("Expected 0 challans for clean record fixture KA01MJ0001");
        }
    }

    /**
     * Test 3: Verify deterministic error fixtures in MockProvider.
     */
    public static function testDeterministicErrorScenarios(): void
    {
        $provider = new MockProvider();

        // 1. Timeout scenario
        $timeoutCaught = false;
        try {
            $provider->lookupVehicle('UP16AB0000');
        } catch (ProviderTimeoutException $e) {
            $timeoutCaught = true;
            if ($e->getHttpStatusCode() !== 504) {
                throw new \Exception("Expected HTTP 504 for timeout exception");
            }
        }
        if (!$timeoutCaught) throw new \Exception("UP16AB0000 did not throw ProviderTimeoutException");

        // 2. Rate limit scenario
        $rateLimitCaught = false;
        try {
            $provider->lookupVehicle('RJ14XY0000');
        } catch (ProviderRateLimitException $e) {
            $rateLimitCaught = true;
            if ($e->getHttpStatusCode() !== 429) {
                throw new \Exception("Expected HTTP 429 for rate limit exception");
            }
        }
        if (!$rateLimitCaught) throw new \Exception("RJ14XY0000 did not throw ProviderRateLimitException");

        // 3. Balance exhausted scenario
        $exhaustedCaught = false;
        try {
            $provider->lookupVehicle('GJ01AB0000');
        } catch (ProviderUnavailableException $e) {
            $exhaustedCaught = true;
            if ($e->getHttpStatusCode() !== 503) {
                throw new \Exception("Expected HTTP 503 for unavailable exception");
            }
        }
        if (!$exhaustedCaught) throw new \Exception("GJ01AB0000 did not throw ProviderUnavailableException");

        // 4. Vehicle Not Found 404
        $notFoundCaught = false;
        try {
            $provider->lookupVehicle('WB02AB0000');
        } catch (VehicleNotFoundException $e) {
            $notFoundCaught = true;
            if ($e->getHttpStatusCode() !== 404) {
                throw new \Exception("Expected HTTP 404 for not found exception");
            }
        }
        if (!$notFoundCaught) throw new \Exception("WB02AB0000 did not throw VehicleNotFoundException");
    }

    /**
     * Test 4: Verify DPDP Act 2023 Masking functions.
     */
    public static function testDpdpActMasking(): void
    {
        $maskedOwner = NormalizedVehicleDto::maskOwnerName('M/S LOGISTICS INDIA PRIVATE LIMITED');
        if (!str_contains($maskedOwner, 'M****') && !str_contains($maskedOwner, 'I****')) {
            throw new \Exception("Owner name not properly masked under DPDP rules: {$maskedOwner}");
        }

        $maskedChassis = NormalizedVehicleDto::maskChassis('MAT624001P2123456');
        if (!str_contains($maskedChassis, '******')) {
            throw new \Exception("Chassis number not properly masked: {$maskedChassis}");
        }

        $maskedEngine = NormalizedVehicleDto::maskEngine('ISBE59123456');
        if (!str_contains($maskedEngine, '******')) {
            throw new \Exception("Engine number not properly masked: {$maskedEngine}");
        }
    }

    /**
     * Test 5: Verify Production Safety Guard prevents mock fallback in production.
     */
    public static function testProductionSafetyGuard(): void
    {
        // When in production with prodEnabled = false or missing API key
        $prodProvider = new ApisathiProvider(
            baseUrl: 'https://apisathi.in/api/v1',
            apiKey: '',
            secretKey: '',
            timeoutSeconds: 8,
            environment: 'production',
            prodEnabled: false
        );

        $guardBlocked = false;
        try {
            $prodProvider->lookupVehicle('MH12AB1234');
        } catch (ProviderConfigurationException $e) {
            $guardBlocked = true;
            if (!str_contains($e->getMessage(), 'Production APISathi provider is disabled')) {
                throw new \Exception("Unexpected production guard exception message: {$e->getMessage()}");
            }
        }

        if (!$guardBlocked) {
            throw new \Exception("Production guard failed: ApisathiProvider allowed execution without authorization!");
        }
    }

    /**
     * Test 6: Verify ProviderAuditLogger sanitizes sensitive headers and keys.
     */
    public static function testAuditLoggerHeaderSanitization(): void
    {
        $rawHeaders = [
            'Host' => 'apisathi.in',
            'X-API-KEY' => 'secret_live_apikey_99812498124',
            'X-SECRET-KEY' => 'super_secret_token_12893819',
            'Authorization' => 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            'Content-Type' => 'application/json',
        ];

        $sanitized = ProviderAuditLogger::sanitizeHeaders($rawHeaders);

        if ($sanitized['X-API-KEY'] !== '[REDACTED]') {
            throw new \Exception("X-API-KEY was not redacted in sanitized headers!");
        }
        if ($sanitized['X-SECRET-KEY'] !== '[REDACTED]') {
            throw new \Exception("X-SECRET-KEY was not redacted in sanitized headers!");
        }
        if ($sanitized['Authorization'] !== '[REDACTED]') {
            throw new \Exception("Authorization header was not redacted!");
        }
        if ($sanitized['Content-Type'] !== 'application/json') {
            throw new \Exception("Safe header was unexpectedly altered");
        }
    }

    /**
     * Test 7: Verify ProviderManager resolves drivers cleanly and enforces environment isolation.
     */
    public static function testProviderManagerResolution(): void
    {
        $manager = new ProviderManager('mock', 'mock');
        $driver = $manager->driver();

        if (!$driver instanceof MockProvider) {
            throw new \Exception("Expected MockProvider for default driver");
        }
        if ($driver->getProviderName() !== 'mock') {
            throw new \Exception("Expected provider name 'mock'");
        }

        // Custom swap
        $mockCustom = new MockProvider('sandbox');
        $manager->setDriver('custom', $mockCustom);
        if ($manager->driver('custom')->getEnvironment() !== 'sandbox') {
            throw new \Exception("Custom driver swap failed");
        }
    }

    /**
     * Test 8: Verify Partial Responses, Restricted Fields and Provenance Tags.
     */
    public static function testPartialResponseAndRestrictedFields(): void
    {
        $provider = new MockProvider();
        $dto = $provider->lookupVehicle('DL01XY9999');

        if ($dto->fitnessValidUntil !== null) {
            throw new \Exception("Expected null fitness validity for restricted vehicle DL01XY9999");
        }
        if ($dto->financierName !== null) {
            throw new \Exception("Expected null financier for restricted vehicle DL01XY9999");
        }

        $prov = $dto->provenanceMetadata['field_provenance'] ?? [];
        if (($prov['fitness_valid_until'] ?? '') !== 'restricted') {
            throw new \Exception("fitness_valid_until must be tagged with 'restricted' provenance");
        }
        if (($prov['financier_name'] ?? '') !== 'restricted') {
            throw new \Exception("financier_name must be tagged with 'restricted' provenance");
        }
    }

    /**
     * Test 9: Verify VehicleIntelligenceService status checking and combined verification structure.
     */
    public static function testCombinedVerificationAndStatusCheck(): void
    {
        $service = new VehicleIntelligenceService();

        // 1. Status Check
        $status = $service->checkVehicleStatus('MH12AB1234');
        if (!isset($status['registration_number']) || $status['registration_number'] !== 'MH12AB1234') {
            throw new \Exception("Invalid status check registration number");
        }
        if (!isset($status['combined_credit_cost'])) {
            throw new \Exception("Missing combined_credit_cost in status check");
        }

        // 2. Combined Verification Structure
        $combined = $service->verifyCombined('MH12AB1234', null, null, true);
        if (!isset($combined['vehicle']) || !isset($combined['challans'])) {
            throw new \Exception("Combined verification missing vehicle or challans payload");
        }
        if (!isset($combined['field_provenance']) || empty($combined['field_provenance'])) {
            throw new \Exception("Combined verification missing field_provenance metadata");
        }
        if ($combined['registration_number'] !== 'MH12AB1234') {
            throw new \Exception("Combined verification registration number mismatch");
        }
    }
}
