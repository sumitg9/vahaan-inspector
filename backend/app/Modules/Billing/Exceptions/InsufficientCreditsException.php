<?php

namespace App\Modules\Billing\Exceptions;

use Exception;

class InsufficientCreditsException extends Exception
{
    public function __construct(string $message = 'Insufficient credit wallet balance to complete this transaction.')
    {
        parent::__construct($message, 402);
    }
}
