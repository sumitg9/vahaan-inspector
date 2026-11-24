<?php

namespace App\Modules\Billing\Exceptions;

use Exception;

class ReservationNotFoundException extends Exception
{
    public function __construct(string $message = 'Credit reservation not found or has already expired/committed.')
    {
        parent::__construct($message, 404);
    }
}
