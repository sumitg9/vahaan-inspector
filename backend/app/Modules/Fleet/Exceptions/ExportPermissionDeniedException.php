<?php

namespace App\Modules\Fleet\Exceptions;

class ExportPermissionDeniedException extends FleetException
{
    public function __construct(string $message = "Forbidden: Insufficient privileges to export fleet data.")
    {
        parent::__construct($message, 403);
    }
}
