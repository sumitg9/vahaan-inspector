<?php

namespace App\Modules\Inspections\Services;

use App\Modules\Inspections\Exceptions\InvalidStateTransitionException;
use App\Modules\Inspections\Exceptions\MandatoryCorrectionNotesMissingException;
use App\Modules\Inspections\Exceptions\UnauthorizedTransitionException;

class InspectionCaseStateMachine
{
    // Canonical Lifecycle States
    public const STATUS_DRAFT = 'DRAFT';
    public const STATUS_ASSIGNED = 'ASSIGNED';
    public const STATUS_IN_PROGRESS = 'IN_PROGRESS';
    public const STATUS_SUBMITTED = 'SUBMITTED';
    public const STATUS_UNDER_REVIEW = 'UNDER_REVIEW';
    public const STATUS_CORRECTION_REQUESTED = 'CORRECTION_REQUESTED';
    public const STATUS_APPROVED = 'APPROVED';
    public const STATUS_CANCELLED = 'CANCELLED';

    /**
     * Map of valid forward and backward state transitions.
     */
    protected const ALLOWED_TRANSITIONS = [
        self::STATUS_DRAFT => [
            self::STATUS_ASSIGNED,
            self::STATUS_CANCELLED,
        ],
        self::STATUS_ASSIGNED => [
            self::STATUS_IN_PROGRESS,
            self::STATUS_ASSIGNED, // Re-assignment to different inspector
            self::STATUS_CANCELLED,
        ],
        self::STATUS_IN_PROGRESS => [
            self::STATUS_SUBMITTED,
            self::STATUS_ASSIGNED, // Revert back to assigned if inspector reallocated
            self::STATUS_CANCELLED,
        ],
        self::STATUS_SUBMITTED => [
            self::STATUS_UNDER_REVIEW,
            self::STATUS_CORRECTION_REQUESTED,
            self::STATUS_APPROVED,
        ],
        self::STATUS_UNDER_REVIEW => [
            self::STATUS_CORRECTION_REQUESTED,
            self::STATUS_APPROVED,
        ],
        self::STATUS_CORRECTION_REQUESTED => [
            self::STATUS_IN_PROGRESS,
            self::STATUS_SUBMITTED,
            self::STATUS_CANCELLED,
        ],
        // Terminal states
        self::STATUS_APPROVED => [],
        self::STATUS_CANCELLED => [],
    ];

    /**
     * Role capability matrix for state transitions.
     */
    protected const ROLE_ALLOWED_TARGET_STATUSES = [
        'SUPER_ADMIN' => ['*'],
        'ORG_ADMIN' => [
            self::STATUS_ASSIGNED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_CORRECTION_REQUESTED,
            self::STATUS_APPROVED,
            self::STATUS_CANCELLED,
        ],
        'MANAGER' => [
            self::STATUS_ASSIGNED,
            self::STATUS_UNDER_REVIEW,
            self::STATUS_CORRECTION_REQUESTED,
            self::STATUS_APPROVED,
            self::STATUS_CANCELLED,
        ],
        'VALUER' => [
            self::STATUS_UNDER_REVIEW,
            self::STATUS_CORRECTION_REQUESTED,
            self::STATUS_APPROVED,
        ],
        'INSPECTOR' => [
            self::STATUS_IN_PROGRESS,
            self::STATUS_SUBMITTED,
        ],
        'CLIENT_VIEWER' => [], // Read-only
    ];

    /**
     * Validate whether a transition is syntactically valid in the state graph.
     */
    public static function canTransition(string $currentStatus, string $targetStatus): bool
    {
        $current = strtoupper($currentStatus);
        $target = strtoupper($targetStatus);

        if ($current === $target) {
            return $current === self::STATUS_ASSIGNED; // Idempotent reassignment
        }

        $allowed = self::ALLOWED_TRANSITIONS[$current] ?? [];
        return in_array($target, $allowed, true);
    }

    /**
     * Check if a specific user role is permitted to trigger the transition.
     */
    public static function isRoleAuthorized(string $role, string $targetStatus): bool
    {
        $role = strtoupper($role);
        $target = strtoupper($targetStatus);

        if ($role === 'SUPER_ADMIN') {
            return true;
        }

        $allowed = self::ROLE_ALLOWED_TARGET_STATUSES[$role] ?? [];
        return in_array($target, $allowed, true);
    }

    /**
     * Enforce valid transition with role verification and invariant checks.
     *
     * @throws InvalidStateTransitionException
     * @throws UnauthorizedTransitionException
     * @throws MandatoryCorrectionNotesMissingException
     */
    public static function applyTransition(
        string $currentStatus,
        string $targetStatus,
        string $role,
        ?string $correctionRemarks = null
    ): void {
        $current = strtoupper($currentStatus);
        $target = strtoupper($targetStatus);

        // 1. Verify State Graph
        if (!self::canTransition($current, $target)) {
            throw new InvalidStateTransitionException($current, $target);
        }

        // 2. Verify Role Permissions
        if (!self::isRoleAuthorized($role, $target)) {
            throw new UnauthorizedTransitionException($role, $target);
        }

        // 3. Verify Quality Invariant: Rejection remarks strictly mandatory
        if ($target === self::STATUS_CORRECTION_REQUESTED) {
            if (!$correctionRemarks || trim($correctionRemarks) === '') {
                throw new MandatoryCorrectionNotesMissingException();
            }
        }
    }

    /**
     * Get all legally valid target transitions for a given status and user role.
     */
    public static function getAllowedTransitions(string $currentStatus, string $role): array
    {
        $current = strtoupper($currentStatus);
        $role = strtoupper($role);
        $possibleTargets = self::ALLOWED_TRANSITIONS[$current] ?? [];

        return array_values(array_filter($possibleTargets, function ($target) use ($role) {
            return self::isRoleAuthorized($role, $target);
        }));
    }
}
