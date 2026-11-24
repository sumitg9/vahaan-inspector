<?php

namespace App\Modules\Providers\Contracts;

interface ProviderInterface
{
    /**
     * Get unique provider identifier (e.g. 'mock', 'apisathi').
     */
    public function getProviderName(): string;

    /**
     * Check if the provider is enabled and configured for current environment.
     */
    public function isAvailable(): bool;

    /**
     * Get the environment mode ('mock', 'sandbox', 'production').
     */
    public function getEnvironment(): string;
}
