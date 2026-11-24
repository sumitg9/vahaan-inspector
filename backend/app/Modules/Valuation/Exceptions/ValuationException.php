<?php

namespace App\Modules\Valuation\Exceptions;

use Exception;

class ValuationException extends Exception
{
    protected string $errorCode = 'ERR_VALUATION_GENERAL';

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }
}

class ValuationOverrideJustificationException extends ValuationException
{
    protected string $errorCode = 'ERR_VAL_OVERRIDE_JUSTIFICATION_TOO_SHORT';

    public function __construct(string $message = "AC-VAL-02: Valuation override requires a detailed written justification with a minimum of 30 characters.")
    {
        parent::__construct($message, 422);
    }
}

class UnauthorizedValuerException extends ValuationException
{
    protected string $errorCode = 'ERR_VAL_UNAUTHORIZED_ROLE';

    public function __construct(string $role, string $action = "certify or override")
    {
        parent::__construct("Role '{$role}' is not authorized to {$action} vehicle valuation.", 403);
    }
}

class ValuationNotApprovedException extends ValuationException
{
    protected string $errorCode = 'ERR_VAL_REPORT_GATE_UNAPPROVED';

    public function __construct(string $caseId)
    {
        parent::__construct("Final report generation blocked: Valuation for case '{$caseId}' has not been approved and certified by an authorized valuer.", 422);
    }
}
