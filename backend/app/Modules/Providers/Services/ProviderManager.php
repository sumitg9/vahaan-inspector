<?php

namespace App\Modules\Providers\Services;

use App\Modules\Providers\Contracts\ChallanDataProviderInterface;
use App\Modules\Providers\Contracts\VehicleDataProviderInterface;
use App\Modules\Providers\Drivers\ApisathiProvider;
use App\Modules\Providers\Drivers\MockProvider;
use InvalidArgumentException;

class ProviderManager
{
    protected array $drivers = [];
    protected string $defaultDriver;
    protected string $environment;

    public function __construct(?string $defaultDriver = null, ?string $environment = null)
    {
        $defaultEnv = function_exists('config') ? config('services.vehicle_provider.env', 'mock') : 'mock';
        $defaultDrv = function_exists('config') ? config('services.vehicle_provider.default', 'mock') : 'mock';

        $this->environment = $environment ?? (function_exists('env') ? env('PROVIDER_ENVIRONMENT', $defaultEnv) : $defaultEnv);
        $this->defaultDriver = $defaultDriver ?? $defaultDrv;
    }

    /**
     * Resolve the vehicle data provider driver.
     */
    public function driver(?string $name = null): VehicleDataProviderInterface
    {
        $driverName = strtolower($name ?? $this->defaultDriver);

        if (!isset($this->drivers[$driverName])) {
            $this->drivers[$driverName] = $this->createDriver($driverName);
        }

        return $this->drivers[$driverName];
    }

    /**
     * Resolve the challan data provider driver.
     */
    public function challanDriver(?string $name = null): ChallanDataProviderInterface
    {
        $driver = $this->driver($name);
        if (!$driver instanceof ChallanDataProviderInterface) {
            throw new InvalidArgumentException("Driver [{$name}] does not implement ChallanDataProviderInterface");
        }
        return $driver;
    }

    /**
     * Instantiate provider driver according to environment and credentials.
     */
    protected function createDriver(string $name): VehicleDataProviderInterface
    {
        return match ($name) {
            'mock' => new MockProvider($this->environment),
            'apisathi' => new ApisathiProvider(
                baseUrl: function_exists('config') ? config('services.vehicle_provider.apisathi.base_url') : null,
                apiKey: function_exists('config') ? config('services.vehicle_provider.apisathi.api_key') : null,
                secretKey: function_exists('config') ? config('services.vehicle_provider.apisathi.secret_key') : null,
                timeoutSeconds: (int) (function_exists('config') ? config('services.vehicle_provider.apisathi.timeout', 8) : 8),
                environment: $this->environment,
                prodEnabled: (bool) (function_exists('config') ? config('services.vehicle_provider.apisathi.prod_enabled', false) : false)
            ),
            default => throw new InvalidArgumentException("Unsupported vehicle provider driver: {$name}"),
        };
    }

    /**
     * Set a custom or mock driver instance (useful for unit testing).
     */
    public function setDriver(string $name, VehicleDataProviderInterface $instance): void
    {
        $this->drivers[strtolower($name)] = $instance;
    }

    public function getEnvironment(): string
    {
        return $this->environment;
    }

    public function getDefaultDriver(): string
    {
        return $this->defaultDriver;
    }
}
