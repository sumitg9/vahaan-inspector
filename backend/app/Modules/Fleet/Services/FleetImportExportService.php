<?php

namespace App\Modules\Fleet\Services;

use App\Modules\Auditing\Services\AuditService;
use App\Modules\Fleet\Exceptions\ExportPermissionDeniedException;
use App\Modules\Fleet\Exceptions\FleetException;

class FleetImportExportService
{
    protected FleetManagementService $fleetService;
    protected ?AuditService $auditService;

    public function __construct(
        FleetManagementService $fleetService,
        ?AuditService $auditService = null
    ) {
        $this->fleetService = $fleetService;
        $this->auditService = $auditService;
    }

    /**
     * Import vehicles from CSV text content.
     */
    public function importFromCsv(string $organizationId, string $csvContent, ?string $userId = null): array
    {
        $lines = preg_split('/\r\n|\r|\n/', trim($csvContent));
        if (empty($lines)) {
            throw new FleetException("CSV content is empty.");
        }

        // Parse header line
        $headerLine = array_shift($lines);
        $headers = array_map('trim', str_getcsv(strtolower($headerLine)));

        $regIndex = array_search('registration_number', $headers);
        if ($regIndex === false) {
            $regIndex = array_search('registration_no', $headers);
        }
        if ($regIndex === false) {
            $regIndex = array_search('reg_number', $headers);
        }
        if ($regIndex === false) {
            $regIndex = 0; // Default first column
        }

        $unitIndex = array_search('fleet_unit_number', $headers);
        if ($unitIndex === false) $unitIndex = array_search('unit_number', $headers);
        $driverIndex = array_search('assigned_driver_name', $headers);
        if ($driverIndex === false) $driverIndex = array_search('driver_name', $headers);
        $phoneIndex = array_search('assigned_driver_phone', $headers);
        if ($phoneIndex === false) $phoneIndex = array_search('driver_phone', $headers);
        $depotIndex = array_search('depot_location', $headers);
        if ($depotIndex === false) $depotIndex = array_search('depot', $headers);
        $classIndex = array_search('vehicle_class', $headers);

        $imported = 0;
        $duplicates = 0;
        $errors = [];
        $records = [];

        foreach ($lines as $lineNum => $line) {
            if (empty(trim($line))) continue;

            $cols = array_map('trim', str_getcsv($line));
            $reg = strtoupper(preg_replace('/[^a-zA-Z0-9]/', '', $cols[$regIndex] ?? ''));

            if (empty($reg)) {
                $errors[] = "Row " . ($lineNum + 2) . ": Empty registration number.";
                continue;
            }

            if (!preg_match('/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/', $reg)) {
                $errors[] = "Row " . ($lineNum + 2) . ": Invalid Indian registration format ({$reg}).";
                continue;
            }

            $vehicleData = [
                'registration_number' => $reg,
                'fleet_unit_number' => $unitIndex !== false && isset($cols[$unitIndex]) ? $cols[$unitIndex] : null,
                'assigned_driver_name' => $driverIndex !== false && isset($cols[$driverIndex]) ? $cols[$driverIndex] : null,
                'assigned_driver_phone' => $phoneIndex !== false && isset($cols[$phoneIndex]) ? $cols[$phoneIndex] : null,
                'depot_location' => $depotIndex !== false && isset($cols[$depotIndex]) ? $cols[$depotIndex] : 'Central Depot',
                'vehicle_class' => $classIndex !== false && isset($cols[$classIndex]) ? $cols[$classIndex] : 'Heavy Goods Vehicle',
            ];

            try {
                $newVehicle = $this->fleetService->addVehicleToFleet($organizationId, $vehicleData);
                $records[] = $newVehicle;
                $imported++;
            } catch (\Throwable $e) {
                if (str_contains(strtolower($e->getMessage()), 'already active')) {
                    $duplicates++;
                } else {
                    $errors[] = "Row " . ($lineNum + 2) . " ({$reg}): " . $e->getMessage();
                }
            }
        }

        if ($this->auditService && $userId) {
            $this->auditService->log(
                $organizationId,
                $userId,
                'FLEET_CSV_IMPORTED',
                'FleetVehicle',
                $organizationId,
                [],
                ['imported' => $imported, 'duplicates' => $duplicates, 'errors_count' => count($errors)]
            );
        }

        return [
            'total_rows_processed' => count($lines),
            'imported_count' => $imported,
            'duplicate_count' => $duplicates,
            'error_count' => count($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Export fleet compliance report as CSV with strict RBAC permission checking.
     *
     * @throws ExportPermissionDeniedException
     */
    public function exportToCsv(string $organizationId, bool $hasExportPermission, ?string $userId = null): string
    {
        if (!$hasExportPermission) {
            if ($this->auditService && $userId) {
                $this->auditService->logSecurityAlert(
                    $organizationId,
                    $userId,
                    'UNAUTHORIZED_FLEET_EXPORT_ATTEMPT',
                    ['attempted_action' => 'fleet.export']
                );
            }
            throw new ExportPermissionDeniedException("Access Denied: Missing 'fleet.export' permission.");
        }

        $list = $this->fleetService->listFleet($organizationId);
        $items = $list['items'] ?? [];

        $headers = [
            'Fleet Unit #',
            'Registration Number',
            'Make & Model',
            'Vehicle Class',
            'Depot Location',
            'Assigned Driver',
            'Driver Phone',
            'Fitness Expiry',
            'Fitness Status',
            'Insurance Expiry',
            'Insurance Status',
            'PUC Expiry',
            'PUC Status',
            'Permit Expiry',
            'Permit Status',
            'Road Tax Valid Until',
            'Overall Compliance',
            'Pending Challans',
            'Total Fines (INR)',
        ];

        $output = fopen('php://temp', 'r+');
        fputcsv($output, $headers);

        foreach ($items as $item) {
            $comp = $item['compliance'] ?? [];
            $docs = $comp['documents'] ?? [];

            $row = [
                $item['fleet_unit_number'] ?? '',
                $item['registration_number'] ?? '',
                $item['maker_model'] ?? '',
                $item['vehicle_class'] ?? '',
                $item['depot_location'] ?? '',
                $item['assigned_driver_name'] ?? '',
                $item['assigned_driver_phone'] ?? '',
                $docs['fitness']['valid_until'] ?? 'N/A',
                $docs['fitness']['status'] ?? 'N/A',
                $docs['insurance']['valid_until'] ?? 'N/A',
                $docs['insurance']['status'] ?? 'N/A',
                $docs['pucc']['valid_until'] ?? 'N/A',
                $docs['pucc']['status'] ?? 'N/A',
                $docs['permit']['valid_until'] ?? 'N/A',
                $docs['permit']['status'] ?? 'N/A',
                $docs['tax']['valid_until'] ?? 'N/A',
                $comp['overall_status'] ?? 'UNKNOWN',
                $comp['pending_challan_count'] ?? 0,
                $comp['total_fines_inr'] ?? '0.00',
            ];

            fputcsv($output, $row);
        }

        rewind($output);
        $csvString = stream_get_contents($output);
        fclose($output);

        if ($this->auditService && $userId) {
            $this->auditService->log(
                $organizationId,
                $userId,
                'FLEET_EXPORT_GENERATED',
                'FleetVehicle',
                $organizationId,
                [],
                ['rows_exported' => count($items), 'format' => 'CSV']
            );
        }

        return $csvString;
    }
}
