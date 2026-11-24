<?php

namespace App\Modules\Providers\Drivers;

use App\Modules\Providers\Contracts\ChallanDataProviderInterface;
use App\Modules\Providers\Contracts\VehicleDataProviderInterface;
use App\Modules\Providers\DTOs\NormalizedChallanResponseDto;
use App\Modules\Providers\DTOs\NormalizedVehicleDto;
use App\Modules\Providers\Exceptions\ProviderConfigurationException;
use App\Modules\Providers\Exceptions\ProviderException;
use App\Modules\Providers\Exceptions\ProviderRateLimitException;
use App\Modules\Providers\Exceptions\ProviderTimeoutException;
use App\Modules\Providers\Exceptions\VehicleNotFoundException;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ApisathiProvider implements VehicleDataProviderInterface, ChallanDataProviderInterface
{
    protected string $baseUrl;
    protected string $apiKey;
    protected string $secretKey;
    protected int $timeoutSeconds;
    protected string $environment;
    protected bool $prodEnabled;

    public function __construct(
        ?string $baseUrl = null,
        ?string $apiKey = null,
        ?string $secretKey = null,
        int $timeoutSeconds = 8,
        string $environment = 'mock',
        bool $prodEnabled = false
    ) {
        $defaultBase = function_exists('config') ? config('services.vehicle_provider.apisathi.base_url', 'https://apisathi.in/api/v1') : 'https://apisathi.in/api/v1';
        $defaultKey = function_exists('config') ? config('services.vehicle_provider.apisathi.api_key', '') : '';
        $defaultSecret = function_exists('config') ? config('services.vehicle_provider.apisathi.secret_key', '') : '';
        $defaultProdEnabled = function_exists('config') ? (bool) config('services.vehicle_provider.apisathi.prod_enabled', false) : false;

        $this->baseUrl = rtrim($baseUrl ?? $defaultBase, '/');
        $this->apiKey = $apiKey ?? $defaultKey;
        $this->secretKey = $secretKey ?? $defaultSecret;
        $this->timeoutSeconds = $timeoutSeconds > 0 ? $timeoutSeconds : 8;
        $this->environment = $environment;
        $this->prodEnabled = $prodEnabled || $defaultProdEnabled;
    }

    public function getProviderName(): string
    {
        return 'apisathi';
    }

    public function isAvailable(): bool
    {
        if ($this->environment === 'production') {
            return $this->prodEnabled && !empty($this->apiKey);
        }
        return !empty($this->apiKey) || $this->environment === 'mock';
    }

    public function getEnvironment(): string
    {
        return $this->environment;
    }

    /**
     * Enforce production safety invariant.
     * In production, NEVER silently substitute mock data when lookup fails.
     * Keep production disabled until authorized credentials and response validation are provisioned.
     */
    protected function validateProductionGuard(): void
    {
        if ($this->environment === 'production' && (!$this->prodEnabled || empty($this->apiKey))) {
            throw new ProviderConfigurationException(
                "Production APISathi provider is disabled until authorized credentials and response validation are provisioned. " .
                "In accordance with architectural invariants, mock fallback in production is strictly prohibited."
            );
        }
    }

    /**
     * Retrieve vehicle registration details from APISathi RC v1 endpoint.
     * Documentation: https://apisathi.in/docs/products/vehicle-rc-v1/
     */
    public function lookupVehicle(string $registrationNumber, array $options = []): NormalizedVehicleDto
    {
        $this->validateProductionGuard();

        $reg = strtoupper(str_replace(' ', '', trim($registrationNumber)));
        $endpoint = "{$this->baseUrl}/vehicle-rc-v1";

        $response = $this->executeWithRetry(function () use ($endpoint, $reg) {
            return Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'X-SECRET-KEY' => $this->secretKey,
                'Accept' => 'application/json',
            ])->timeout($this->timeoutSeconds)->post($endpoint, [
                'rc_number' => $reg,
            ]);
        }, 'RC_LOOKUP', $reg);

        $status = $response->status();
        $body = $response->json() ?? [];

        if ($status === 404 || ($status === 200 && isset($body['status']) && $body['status'] === 'not_found')) {
            throw new VehicleNotFoundException('apisathi', $reg);
        }

        if ($status === 429) {
            $retryAfter = (int) $response->header('Retry-After', '60');
            throw new ProviderRateLimitException('apisathi', $retryAfter > 0 ? $retryAfter : 60);
        }

        if (!$response->successful()) {
            throw new ProviderException(
                "APISathi RC service returned upstream error (HTTP {$status})",
                502,
                'apisathi',
                $reg
            );
        }

        $data = $body['data'] ?? $body;
        return NormalizedVehicleDto::fromRaw($data, 'apisathi', false);
    }

    /**
     * Retrieve traffic violations from APISathi RC Challan endpoint.
     * Documentation: https://apisathi.in/docs/products/rc-challan/
     */
    public function lookupChallans(string $registrationNumber, array $options = []): NormalizedChallanResponseDto
    {
        $this->validateProductionGuard();

        $reg = strtoupper(str_replace(' ', '', trim($registrationNumber)));
        $endpoint = "{$this->baseUrl}/rc-challan";

        $response = $this->executeWithRetry(function () use ($endpoint, $reg) {
            return Http::withHeaders([
                'X-API-KEY' => $this->apiKey,
                'X-SECRET-KEY' => $this->secretKey,
                'Accept' => 'application/json',
            ])->timeout($this->timeoutSeconds)->post($endpoint, [
                'rc_number' => $reg,
            ]);
        }, 'CHALLAN_LOOKUP', $reg);

        $status = $response->status();
        $body = $response->json() ?? [];

        if ($status === 429) {
            $retryAfter = (int) $response->header('Retry-After', '60');
            throw new ProviderRateLimitException('apisathi', $retryAfter > 0 ? $retryAfter : 60);
        }

        if (!$response->successful()) {
            // NEVER interpret a provider timeout or error as a clean record with zero challans
            throw new ProviderException(
                "APISathi Challan service returned upstream error (HTTP {$status})",
                502,
                'apisathi',
                $reg
            );
        }

        $challansRaw = $body['data']['challans'] ?? $body['challans'] ?? [];
        return NormalizedChallanResponseDto::fromRaw($reg, $challansRaw, 'apisathi', false);
    }

    /**
     * Resilient HTTP execution with exponential backoff on transient network / 5xx failures.
     * Does NOT retry on 4xx client errors (400, 401, 403, 404).
     */
    protected function executeWithRetry(callable $call, string $operation, string $reg)
    {
        $maxRetries = 2;
        $attempt = 0;
        $lastException = null;

        while ($attempt <= $maxRetries) {
            try {
                $response = $call();
                // If upstream 5xx, retry if attempts remain
                if ($response->status() >= 500 && $attempt < $maxRetries) {
                    $attempt++;
                    usleep((int) (500000 * pow(2, $attempt - 1))); // 500ms, 1000ms backoff
                    continue;
                }
                return $response;
            } catch (Exception $e) {
                $lastException = $e;
                if ($attempt < $maxRetries) {
                    $attempt++;
                    usleep((int) (500000 * pow(2, $attempt - 1)));
                    continue;
                }
                break;
            }
        }

        // Exhausted retries or network timeout
        throw new ProviderTimeoutException('apisathi', $reg, $this->timeoutSeconds);
    }
}
