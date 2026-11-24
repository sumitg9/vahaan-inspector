<?php

namespace App\Modules\Fleet\Services;

use App\Models\ScheduledFleetCheck;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Support\Str;

class ScheduledComplianceCheckService
{
    protected FleetManagementService $fleetService;
    protected NotificationService $notificationService;
    protected ?AuditService $auditService;

    public function __construct(
        FleetManagementService $fleetService,
        NotificationService $notificationService,
        ?AuditService $auditService = null
    ) {
        $this->fleetService = $fleetService;
        $this->notificationService = $notificationService;
        $this->auditService = $auditService;
    }

    /**
     * Get or create default schedule configuration for an organization.
     */
    public function getSchedule(string $organizationId): array
    {
        $sched = ScheduledFleetCheck::where('organization_id', $organizationId)->first();
        if (!$sched) {
            return [
                'organization_id' => $organizationId,
                'frequency' => 'DAILY',
                'hour_utc' => 2,
                'is_enabled' => true,
                'max_credits_per_run' => 500,
                'auto_reverify_older_than_days' => 15,
                'alert_recipients' => ['ops@fleetvahaan.in', 'compliance@fleetvahaan.in'],
                'last_run_at' => null,
                'last_run_summary' => null,
            ];
        }

        return $sched->toArray();
    }

    /**
     * Update schedule configuration.
     */
    public function updateSchedule(string $organizationId, array $config): ScheduledFleetCheck
    {
        $sched = ScheduledFleetCheck::where('organization_id', $organizationId)->first();
        if (!$sched) {
            $sched = new ScheduledFleetCheck([
                'id' => (string) Str::uuid(),
                'organization_id' => $organizationId,
            ]);
        }

        $sched->fill([
            'frequency' => $config['frequency'] ?? $sched->frequency ?? 'DAILY',
            'hour_utc' => (int) ($config['hour_utc'] ?? $sched->hour_utc ?? 2),
            'is_enabled' => (bool) ($config['is_enabled'] ?? $sched->is_enabled ?? true),
            'max_credits_per_run' => (int) ($config['max_credits_per_run'] ?? $sched->max_credits_per_run ?? 500),
            'auto_reverify_older_than_days' => (int) ($config['auto_reverify_older_than_days'] ?? $sched->auto_reverify_older_than_days ?? 15),
            'alert_recipients' => $config['alert_recipients'] ?? $sched->alert_recipients ?? [],
        ]);

        $sched->save();
        return $sched;
    }

    /**
     * Execute scheduled compliance audit and dispatch proactive statutory alerts.
     */
    public function runScheduledCheck(string $organizationId, ?string $userId = null): array
    {
        $list = $this->fleetService->listFleet($organizationId);
        $items = $list['items'] ?? [];

        $totalChecked = count($items);
        $expiredFound = 0;
        $expiringSoonFound = 0;
        $alertsDispatched = 0;

        foreach ($items as $item) {
            $comp = $item['compliance'] ?? [];
            $docs = $comp['documents'] ?? [];
            $reg = $item['registration_number'] ?? 'UNKNOWN';
            $unit = $item['fleet_unit_number'] ?? 'N/A';

            foreach ($docs as $docKey => $doc) {
                $days = $doc['days_remaining'] ?? null;
                if ($days === null) continue;

                if ($doc['is_expired'] || $days <= 30) {
                    if ($doc['is_expired']) {
                        $expiredFound++;
                    } else {
                        $expiringSoonFound++;
                    }

                    // Dispatch notification for alertable documents
                    $this->notificationService->dispatchExpiryAlert(
                        $organizationId,
                        $reg,
                        $unit,
                        $doc['document'] ?? strtoupper($docKey),
                        $days,
                        $userId
                    );
                    $alertsDispatched++;
                }
            }
        }

        $now = date('Y-m-d H:i:s');
        $summary = [
            'total_checked' => $totalChecked,
            'expired_found' => $expiredFound,
            'expiring_soon_found' => $expiringSoonFound,
            'alerts_dispatched' => $alertsDispatched,
            'executed_at' => $now,
        ];

        // Record in scheduled_fleet_checks
        $sched = ScheduledFleetCheck::where('organization_id', $organizationId)->first();
        if ($sched) {
            $sched->last_run_at = $now;
            $sched->last_run_summary = $summary;
            $sched->save();
        }

        if ($this->auditService && $userId) {
            $this->auditService->log(
                $organizationId,
                $userId,
                'SCHEDULED_FLEET_CHECK_EXECUTED',
                'ScheduledFleetCheck',
                $organizationId,
                [],
                $summary
            );
        }

        return $summary;
    }
}
