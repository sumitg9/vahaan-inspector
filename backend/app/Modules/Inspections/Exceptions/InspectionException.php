<?php

namespace App\Modules\Inspections\Exceptions;

use Exception;
use Throwable;

class InspectionException extends Exception
{
    public function __construct(string $message, int $code = 422, ?Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

class InvalidStateTransitionException extends InspectionException
{
    public function __construct(string $currentStatus, string $attemptedStatus)
    {
        parent::__construct(
            "Invalid inspection state transition: Cannot transition case from status '{$currentStatus}' to '{$attemptedStatus}'.",
            422
        );
    }
}

class UnauthorizedTransitionException extends InspectionException
{
    public function __construct(string $role, string $targetStatus)
    {
        parent::__construct(
            "Unauthorized action: User with role '{$role}' does not hold permission to transition case to '{$targetStatus}'.",
            403
        );
    }
}

class MandatoryCorrectionNotesMissingException extends InspectionException
{
    public function __construct()
    {
        parent::__construct(
            "Quality Control Invariant Violation: QC rejection notes are strictly mandatory when requesting corrections.",
            422
        );
    }
}

class UntestedCheckpointDefaultException extends InspectionException
{
    public function __construct(string $itemKey)
    {
        parent::__construct(
            "Prohibition of Data Fabrication Invariant: Checkpoint '{$itemKey}' cannot be defaulted to Pass or Good without physical inspection verification.",
            422
        );
    }
}
