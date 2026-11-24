<?php

namespace App\Modules\Providers\Contracts;

use App\Modules\Providers\DTOs\NormalizedVehicleDto;

interface VehicleDataProviderInterface extends ProviderInterface
{
    /**
     * Retrieve and normalize vehicle registration details from VAHAN registry.
     *
     * @param string $registrationNumber e.g. 'MH12AB1234'
     * @param array $options Provider-specific flags (e.g. timeout, bypassCache)
     * @return NormalizedVehicleDto
     * @throws \App\Modules\Providers\Exceptions\ProviderException
     */
    public function lookupVehicle(string $registrationNumber, array $options = []): NormalizedVehicleDto;
}
