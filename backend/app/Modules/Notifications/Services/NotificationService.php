<?php

namespace App\Modules\Notifications\Services;

use App\Models\Notification;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Support\Str;

class NotificationService
{
    protected ?AuditService $auditService;

    public function __construct(?AuditService $auditService = null)
    {
        $this->auditService = $auditService;
    }

    /**
     * Dispatch a notification to the tenant and channel observers.
     */
    public function dispatch(
        string $organizationId,
        string $type,
        string $title,
        string $message,
        string $severity = 'INFO',
        ?array $data = null,
        ?string $userId = null
    ): Notification {
        $notification = Notification::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $organizationId,
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'severity' => $severity,
            'data' => $data ?? [],
            'read_at' => null,
        ]);

        return $notification;
    }

    /**
     * Dispatch statutory compliance expiry alert (30d, 7d, today/expired).
     */
    public function dispatchExpiryAlert(
        string $organizationId,
        string $regNumber,
        string $unitNumber,
        string $docType,
        int $daysRemaining,
        ?string $userId = null
    ): Notification {
        $severity = 'INFO';
        if ($daysRemaining < 0) {
            $severity = 'CRITICAL';
            $title = "EXPIRED: {$docType} for {$regNumber} ({$unitNumber})";
            $message = "The {$docType} certificate expired " . abs($daysRemaining) . " days ago. Immediate ground action required per Central Motor Vehicles Rules.";
            $type = 'EXPIRY_CRITICAL_TODAY';
        } elseif ($daysRemaining === 0) {
            $severity = 'CRITICAL';
            $title = "EXPIRES TODAY: {$docType} for {$regNumber} ({$unitNumber})";
            $message = "The {$docType} certificate expires today. Renew immediately to prevent statutory non-compliance.";
            $type = 'EXPIRY_CRITICAL_TODAY';
        } elseif ($daysRemaining <= 7) {
            $severity = 'WARNING';
            $title = "Expiring in {$daysRemaining} Days: {$docType} for {$regNumber}";
            $message = "Vehicle {$regNumber} ({$unitNumber}) {$docType} is valid for only {$daysRemaining} more days.";
            $type = 'EXPIRY_ALERT_7D';
        } else {
            $severity = 'INFO';
            $title = "Upcoming Expiry ({$daysRemaining}d): {$docType} for {$regNumber}";
            $message = "Vehicle {$regNumber} ({$unitNumber}) {$docType} renewal due in {$daysRemaining} days.";
            $type = 'EXPIRY_ALERT_30D';
        }

        return $this->dispatch($organizationId, $type, $title, $message, $severity, [
            'registration_number' => $regNumber,
            'fleet_unit_number' => $unitNumber,
            'document_type' => $docType,
            'days_remaining' => $daysRemaining,
        ], $userId);
    }

    /**
     * Dispatch notification when a bulk verification job finishes.
     */
    public function dispatchBulkVerificationComplete(
        string $organizationId,
        string $jobId,
        int $total,
        int $succeeded,
        int $failed,
        int $creditsSpent,
        ?string $userId = null
    ): Notification {
        $title = "Bulk Verification Complete ({$succeeded}/{$total} Succeeded)";
        $message = "Batch verification job {$jobId} processed {$total} vehicles. {$succeeded} verified successfully, {$failed} failures. {$creditsSpent} credits deducted.";
        $severity = $failed > 0 ? 'WARNING' : 'SUCCESS';

        return $this->dispatch($organizationId, 'BULK_VERIFICATION_COMPLETED', $title, $message, $severity, [
            'job_id' => $jobId,
            'total_vehicles' => $total,
            'successful' => $succeeded,
            'failed' => $failed,
            'credits_spent' => $creditsSpent,
        ], $userId);
    }

    /**
     * Dispatch cost limit warning when estimated cost nears/exceeds budget.
     */
    public function dispatchCostLimitWarning(
        string $organizationId,
        int $estimatedPaise,
        int $limitPaise,
        ?string $userId = null
    ): Notification {
        $estInr = number_format($estimatedPaise / 100, 2);
        $limitInr = number_format($limitPaise / 100, 2);

        $title = "Cost Limit Exceeded for Bulk Action";
        $message = "Estimated cost of ₹{$estInr} exceeds the configured limit of ₹{$limitInr}. Operation was halted to prevent unauthorized spend.";

        return $this->dispatch($organizationId, 'COST_LIMIT_WARNING', $title, $message, 'CRITICAL', [
            'estimated_paise' => $estimatedPaise,
            'limit_paise' => $limitPaise,
        ], $userId);
    }

    /**
     * List notifications for an organization with optional unread filter.
     */
    public function getNotifications(string $organizationId, ?string $userId = null, bool $unreadOnly = false): array
    {
        // Standalone query fallback
        $query = Notification::where('organization_id', $organizationId);
        if ($unreadOnly) {
            $query->whereNull('read_at');
        }

        return $query->orderBy('created_at', 'desc')->limit(50)->get();
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(string $organizationId, string $notificationId): bool
    {
        $notification = Notification::where('organization_id', $organizationId)
            ->where('id', $notificationId)
            ->first();

        if ($notification) {
            $notification->read_at = date('Y-m-d H:i:s');
            return $notification->save();
        }

        return false;
    }

    /**
     * Get unread notification count.
     */
    public function getUnreadCount(string $organizationId, ?string $userId = null): int
    {
        return Notification::where('organization_id', $organizationId)
            ->whereNull('read_at')
            ->count();
    }
}
