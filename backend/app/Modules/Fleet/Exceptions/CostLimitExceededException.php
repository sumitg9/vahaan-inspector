<?php

namespace App\Modules\Fleet\Exceptions;

class CostLimitExceededException extends FleetException
{
    public int $estimatedPaise;
    public int $limitPaise;

    public function __construct(string $message, int $estimatedPaise = 0, int $limitPaise = 0)
    {
        parent::__construct($message);
        $this->estimatedPaise = $estimatedPaise;
        $this->limitPaise = $limitPaise;
    }
}
