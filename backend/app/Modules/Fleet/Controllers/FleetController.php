<?php

namespace App\Modules\Fleet\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Fleet\Exceptions\CostLimitExceededException;
use App\Modules\Fleet\Exceptions\ExportPermissionDeniedException;
use App\Modules\Fleet\Exceptions\FleetException;
use App\Modules\Fleet\Services\BulkVerificationService;
use App\Modules\Fleet\Services\FleetImportExportService;
use App\Modules\Fleet\Services\FleetManagementService;
use App\Modules\Fleet\Services\ScheduledComplianceCheckService;
use App\Modules\Notifications\Services\NotificationService;
use Illuminate\Http\Request;

class FleetController extends Controller
{
    protected FleetManagementService $fleetService;
    protected BulkVerificationService $bulkService;
    protected FleetImportExportService $importExportService;
    protected ScheduledComplianceCheckService $scheduledService;
    protected NotificationService $notificationService;

    public function __construct(
        FleetManagementService $fleetService,
        BulkVerificationService $bulkService,
        FleetImportExportService $importExportService,
        ScheduledComplianceCheckService $scheduledService,
        NotificationService $notificationService
    ) {
        $this->fleetService = $fleetService;
        $this->bulkService = $bulkService;
        $this->importExportService = $importExportService;
        $this->scheduledService = $scheduledService;
        $this->notificationService = $notificationService;
    }

    protected function resolveOrganizationId(Request $request): string
    {
        return $request->user()?->organization_id
            ?? $request->header('X-Organization-Id')
            ?? 'org-enterprise-default';
    }

    /**
     * List fleet vehicles with real-time compliance status.
     */
    public function index(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $result = $this->fleetService->listFleet($orgId, $request->all());

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Fleet telemetry analytics and statutory compliance summary.
     */
    public function analytics(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $analytics = $this->fleetService->getFleetAnalytics($orgId);

        return response()->json([
            'status' => 'success',
            'data' => $analytics,
        ]);
    }

    /**
     * Add a vehicle to the organization fleet.
     */
    public function store(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);

        $validated = $request->validate([
            'registration_number' => 'required|string',
            'fleet_unit_number' => 'nullable|string',
            'assigned_driver_name' => 'nullable|string',
            'assigned_driver_phone' => 'nullable|string',
            'depot_location' => 'nullable|string',
            'vehicle_class' => 'nullable|string',
            'maker_model' => 'nullable|string',
        ]);

        try {
            $vehicle = $this->fleetService->addVehicleToFleet($orgId, $validated);

            return response()->json([
                'status' => 'success',
                'message' => 'Vehicle successfully onboarded into fleet registry.',
                'data' => $vehicle,
            ], 201);
        } catch (FleetException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Get single vehicle profile and compliance dossier.
     */
    public function show(Request $request, string $id)
    {
        $orgId = $this->resolveOrganizationId($request);
        $dossier = $this->fleetService->getFleetVehicle($orgId, $id);

        if (!$dossier) {
            return response()->json([
                'status' => 'error',
                'message' => 'Fleet vehicle not found.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $dossier,
        ]);
    }

    /**
     * Update fleet vehicle attributes.
     */
    public function update(Request $request, string $id)
    {
        $orgId = $this->resolveOrganizationId($request);

        try {
            $updated = $this->fleetService->updateFleetVehicle($orgId, $id, $request->all());

            return response()->json([
                'status' => 'success',
                'message' => 'Fleet vehicle updated successfully.',
                'data' => $updated,
            ]);
        } catch (FleetException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Remove or deactivate a vehicle from active fleet.
     */
    public function destroy(Request $request, string $id)
    {
        $orgId = $this->resolveOrganizationId($request);
        $removed = $this->fleetService->removeVehicleFromFleet($orgId, $id);

        if (!$removed) {
            return response()->json([
                'status' => 'error',
                'message' => 'Fleet vehicle not found or already deactivated.',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Vehicle deactivated from active fleet.',
        ]);
    }

    /**
     * Estimate bulk verification cost & surface provider coverage warnings.
     */
    public function estimateBulk(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $count = (int) $request->input('vehicle_count', 0);
        $limitPaise = $request->has('cost_limit_paise') ? (int) $request->input('cost_limit_paise') : null;

        $estimate = $this->bulkService->estimateBulkCost($count, $orgId, $limitPaise);

        return response()->json([
            'status' => 'success',
            'data' => $estimate,
        ]);
    }

    /**
     * Execute bulk vehicle verification.
     */
    public function verifyBulk(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $regs = $request->input('registration_numbers', []);
        $costLimitPaise = $request->has('cost_limit_paise') ? (int) $request->input('cost_limit_paise') : null;
        $idempotencyKey = $request->header('Idempotency-Key') ?? $request->input('idempotency_key');
        $userId = $request->user()?->id;

        try {
            $result = $this->bulkService->verifyBulk(
                $orgId,
                (array) $regs,
                $costLimitPaise,
                $idempotencyKey,
                $userId
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Bulk vehicle verification batch processed successfully.',
                'data' => $result,
            ]);
        } catch (CostLimitExceededException $e) {
            return response()->json([
                'status' => 'error',
                'error_code' => 'COST_LIMIT_EXCEEDED',
                'message' => $e->getMessage(),
                'estimated_paise' => $e->estimatedPaise,
                'limit_paise' => $e->limitPaise,
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Import fleet vehicles from CSV payload.
     */
    public function import(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $csvContent = $request->input('csv_content', '');
        $userId = $request->user()?->id;

        try {
            $result = $this->importExportService->importFromCsv($orgId, $csvContent, $userId);

            return response()->json([
                'status' => 'success',
                'message' => "CSV imported: {$result['imported_count']} vehicles added, {$result['duplicate_count']} duplicates skipped.",
                'data' => $result,
            ]);
        } catch (FleetException $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Export fleet records to CSV (RBAC Permission: fleet.export).
     */
    public function export(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $user = $request->user();
        $hasPermission = false;

        if ($user) {
            if (method_exists($user, 'isSuperAdmin') && $user->isSuperAdmin()) {
                $hasPermission = true;
            } elseif (method_exists($user, 'hasPermission')) {
                $hasPermission = $user->hasPermission('fleet.export');
            }
        } elseif ($request->header('X-User-Role') === 'ORG_ADMIN' || $request->header('X-User-Role') === 'MANAGER') {
            $hasPermission = true;
        }

        try {
            $csvData = $this->importExportService->exportToCsv($orgId, $hasPermission, $user?->id);

            return response($csvData, 200, [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="fleet_compliance_export_' . date('Ymd_His') . '.csv"',
            ]);
        } catch (ExportPermissionDeniedException $e) {
            return response()->json([
                'status' => 'error',
                'error_code' => 'PERMISSION_DENIED',
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Get scheduled compliance check configuration.
     */
    public function getSchedule(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $schedule = $this->scheduledService->getSchedule($orgId);

        return response()->json([
            'status' => 'success',
            'data' => $schedule,
        ]);
    }

    /**
     * Update scheduled compliance check configuration.
     */
    public function updateSchedule(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $updated = $this->scheduledService->updateSchedule($orgId, $request->all());

        return response()->json([
            'status' => 'success',
            'message' => 'Scheduled compliance check settings saved.',
            'data' => $updated,
        ]);
    }

    /**
     * Trigger manual execution of scheduled compliance audit.
     */
    public function runScheduledCheck(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $userId = $request->user()?->id;

        $summary = $this->scheduledService->runScheduledCheck($orgId, $userId);

        return response()->json([
            'status' => 'success',
            'message' => "Compliance audit completed: {$summary['total_checked']} vehicles checked, {$summary['alerts_dispatched']} statutory alerts dispatched.",
            'data' => $summary,
        ]);
    }

    /**
     * List expiry alerts & system notifications.
     */
    public function notifications(Request $request)
    {
        $orgId = $this->resolveOrganizationId($request);
        $userId = $request->user()?->id;
        $unreadOnly = (bool) $request->input('unread_only', false);

        $notifications = $this->notificationService->getNotifications($orgId, $userId, $unreadOnly);
        $unreadCount = $this->notificationService->getUnreadCount($orgId, $userId);

        return response()->json([
            'status' => 'success',
            'unread_count' => $unreadCount,
            'data' => $notifications,
        ]);
    }

    /**
     * Mark an alert/notification as read.
     */
    public function markNotificationRead(Request $request, string $id)
    {
        $orgId = $this->resolveOrganizationId($request);
        $marked = $this->notificationService->markAsRead($orgId, $id);

        return response()->json([
            'status' => $marked ? 'success' : 'error',
            'message' => $marked ? 'Notification marked as read.' : 'Notification not found.',
        ]);
    }
}
