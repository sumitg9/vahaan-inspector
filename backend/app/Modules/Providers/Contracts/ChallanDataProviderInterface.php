<?php

namespace App\Modules\Providers\Contracts;

use App\Modules\Providers\DTOs\NormalizedChallanResponseDto;

interface ChallanDataProviderInterface extends ProviderInterface
{
    /**
     * Retrieve and normalize traffic violation records from Parivahan eChallan.
     *
     * @param string $registrationNumber e.g. 'MH12AB1234'
     * @param array $options Provider-specific flags
     * @return NormalizedChallanResponseDto
     * @throws \App\Modules\Providers\Exceptions\ProviderException
     */
    public function lookupChallans(string $registrationNumber, array $options = []): NormalizedChallanResponseDto;
}
