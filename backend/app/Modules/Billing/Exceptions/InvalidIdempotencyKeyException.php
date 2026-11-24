<?php

namespace App\Modules\Billing\Exceptions;

use Exception;

class InvalidIdempotencyKeyException extends Exception
{
    public function __construct(string $message = 'Invalid or missing Idempotency-Key header.')
    {
        parent::__construct($message, 400);
    }
}
