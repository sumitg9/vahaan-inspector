<?php

namespace App\Modules\Fleet\Services;

use App\Models\Challan;
use App\Models\FleetVehicle;
use App\Models\VehicleProfile;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Fleet\Exceptions\FleetException;
use Illuminate\Support\Str;

class FleetManagementService
{
    protected ComplianceExpiryEngine $complianceEngine;
    protected ?AuditService $auditService;

    public function __construct(
        ComplianceExpiryEngine $complianceEngine,
        ?AuditService $auditService = null
    ) {
        $this->complianceEngine = $complianceEngine;
        $this->auditService = $auditService;
    }

    /**
     * List fleet vehicles with real-time compliance evaluation and challans summary.
     */
    public function listFleet(string $organizationId, array $filters = []): array
    {
        $statusFilter = strtoupper($filters['status'] ?? 'ALL');
        $search = strtolower(trim($filters['search'] ?? ''));
        $depot = $filters['depot'] ?? null;

        // In-memory or Eloquent query
        $fleet = FleetVehicle::where('organization_id', $organizationId)->where('is_active', true)->get();

        $items = [];
        $compliantCount = 0;
        $expiringSoonCount = 0;
        $expiredCount = 0;
        $challanCount = 0;
        $totalFinesPaise = 0;

        foreach ($fleet as $vehicle) {
            $profile = $vehicle->vehicleProfile ?? VehicleProfile::find($vehicle->vehicle_profile_id);

            // Fetch challans for this vehicle profile
            $challans = Challan::where('vehicle_profile_id', $vehicle->vehicle_profile_id)->get();
            $challansArray = is_array($challans) ? $challans : (method_exists($challans, 'toArray') ? $challans->toArray() : []);

            $compliance = $this->complianceEngine->evaluateVehicle($profile ?? [], $challansArray);

            $overallStatus = $compliance['overall_status'];
            if ($overallStatus === ComplianceExpiryEngine::STATUS_COMPLIANT) {
                $compliantCount++;
            } elseif ($overallStatus === ComplianceExpiryEngine::STATUS_EXPIRING_SOON) {
                $expiringSoonCount++;
            } elseif ($overallStatus === ComplianceExpiryEngine::STATUS_NON_COMPLIANT) {
                $expiredCount++;
            }

            if ($compliance['pending_challan_count'] > 0) {
                $challanCount++;
                $totalFinesPaise += $compliance['total_fines_paise'];
            }

            // Apply filters
            if ($statusFilter === 'COMPLIANT' && $overallStatus !== ComplianceExpiryEngine::STATUS_COMPLIANT) {
                continue;
            }
            if ($statusFilter === 'EXPIRING_SOON' && $overallStatus !== ComplianceExpiryEngine::STATUS_EXPIRING_SOON) {
                continue;
            }
            if ($statusFilter === 'EXPIRED' && $overallStatus !== ComplianceExpiryEngine::STATUS_NON_COMPLIANT) {
                continue;
            }
            if ($statusFilter === 'HAS_CHALLANS' && $compliance['pending_challan_count'] === 0) {
                continue;
            }

            if ($depot && strtolower($vehicle->depot_location ?? '') !== strtolower($depot)) {
                continue;
            }

            $reg = $profile?->registration_number ?? 'UNKNOWN';
            $unit = $vehicle->fleet_unit_number ?? '';
            $driver = $vehicle->assigned_driver_name ?? '';

            if ($search !== '') {
                $matchesSearch = str_contains(strtolower($reg), $search)
                    || str_contains(strtolower($unit), $search)
                    || str_contains(strtolower($driver), $search);
                if (!$matchesSearch) {
                    continue;
                }
            }

            $items[] = [
                'id' => $vehicle->id,
                'organization_id' => $vehicle->organization_id,
                'vehicle_profile_id' => $vehicle->vehicle_profile_id,
                'fleet_unit_number' => $vehicle->fleet_unit_number,
                'registration_number' => $reg,
                'maker_model' => $profile?->maker_model ?? 'TATA PRIMA 2830.K',
                'vehicle_class' => $profile?->vehicle_class ?? 'Heavy Goods Vehicle',
                'assigned_driver_name' => $vehicle->assigned_driver_name,
                'assigned_driver_phone' => $vehicle->assigned_driver_phone,
                'depot_location' => $vehicle->depot_location ?? 'Central Terminal',
                'compliance' => $compliance,
                'is_active' => (bool) $vehicle->is_active,
                'created_at' => $vehicle->created_at,
            ];
        }

        $total = count($fleet);
        $scorePct = $total > 0 ? round(($compliantCount / $total) * 100, 1) : 100.0;

        return [
            'total_vehicles' => $total,
            'filtered_count' => count($items),
            'compliant_count' => $compliantCount,
            'expiring_soon_count' => $expiringSoonCount,
            'expired_count' => $expiredCount,
            'compliance_score_pct' => $scorePct,
            'vehicles_with_challans' => $challanCount,
            'total_pending_fines_paise' => $totalFinesPaise,
            'total_pending_fines_inr' => number_format($totalFinesPaise / 100, 2),
            'items' => $items,
        ];
    }

    /**
     * Get single fleet vehicle profile & compliance dossier.
     */
    public function getFleetVehicle(string $organizationId, string $id): ?array
    {
        $vehicle = FleetVehicle::where('organization_id', $organizationId)->where('id', $id)->first();
        if (!$vehicle) {
            return null;
        }

        $profile = $vehicle->vehicleProfile ?? VehicleProfile::find($vehicle->vehicle_profile_id);
        $challans = Challan::where('vehicle_profile_id', $vehicle->vehicle_profile_id)->get();
        $challansArray = is_array($challans) ? $challans : (method_exists($challans, 'toArray') ? $challans->toArray() : []);

        $compliance = $this->complianceEngine->evaluateVehicle($profile ?? [], $challansArray);

        return [
            'fleet_vehicle' => $vehicle,
            'vehicle_profile' => $profile,
            'compliance' => $compliance,
            'challans' => $challansArray,
        ];
    }

    /**
     * Add a vehicle to the organization fleet.
     */
    public function addVehicleToFleet(string $organizationId, array $data): FleetVehicle
    {
        $reg = strtoupper(trim($data['registration_number'] ?? ''));
        if (empty($reg)) {
            throw new FleetException("Registration number is mandatory.");
        }

        // Find or create VehicleProfile
        $profile = VehicleProfile::where('registration_number', $reg)->first();
        if (!$profile) {
            $profile = VehicleProfile::create([
                'id' => (string) Str::uuid(),
                'registration_number' => $reg,
                'maker_model' => $data['maker_model'] ?? 'TATA MOTORS PRIMA 2830.K',
                'vehicle_class' => $data['vehicle_class'] ?? 'Heavy Goods Vehicle',
                'fuel_type' => $data['fuel_type'] ?? 'DIESEL',
                'state_code' => substr($reg, 0, 2),
                'fitness_valid_until' => $data['fitness_valid_until'] ?? date('Y-m-d', strtotime('+180 days')),
                'insurance_valid_until' => $data['insurance_valid_until'] ?? date('Y-m-d', strtotime('+60 days')),
                'pucc_valid_until' => $data['pucc_valid_until'] ?? date('Y-m-d', strtotime('+90 days')),
                'national_permit_valid_until' => $data['national_permit_valid_until'] ?? date('Y-m-d', strtotime('+365 days')),
                'tax_valid_until' => $data['tax_valid_until'] ?? date('Y-m-d', strtotime('+180 days')),
                'owner_name_masked' => $data['owner_name_masked'] ?? 'F**** L**** LOGISTICS',
            ]);
        }

        // Check duplicate within organization
        $existing = FleetVehicle::where('organization_id', $organizationId)
            ->where('vehicle_profile_id', $profile->id)
            ->first();

        if ($existing) {
            if (!$existing->is_active) {
                $existing->is_active = true;
                $existing->save();
                return $existing;
            }
            throw new FleetException("Vehicle {$reg} is already active in this fleet.");
        }

        return FleetVehicle::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $organizationId,
            'vehicle_profile_id' => $profile->id,
            'fleet_unit_number' => $data['fleet_unit_number'] ?? 'FLT-' . strtoupper(Str::random(4)),
            'assigned_driver_name' => $data['assigned_driver_name'] ?? null,
            'assigned_driver_phone' => $data['assigned_driver_phone'] ?? null,
            'depot_location' => $data['depot_location'] ?? 'Central Depot',
            'insurance_alert_days_before' => (int) ($data['insurance_alert_days_before'] ?? 30),
            'fitness_alert_days_before' => (int) ($data['fitness_alert_days_before'] ?? 30),
            'pucc_alert_days_before' => (int) ($data['pucc_alert_days_before'] ?? 15),
            'permit_alert_days_before' => (int) ($data['permit_alert_days_before'] ?? 30),
            'is_active' => true,
        ]);
    }

    /**
     * Update fleet vehicle details.
     */
    public function updateFleetVehicle(string $organizationId, string $id, array $data): FleetVehicle
    {
        $vehicle = FleetVehicle::where('organization_id', $organizationId)->where('id', $id)->first();
        if (!$vehicle) {
            throw new FleetException("Fleet vehicle not found.");
        }

        $vehicle->update(array_intersect_key($data, array_flip([
            'fleet_unit_number',
            'assigned_driver_name',
            'assigned_driver_phone',
            'depot_location',
            'insurance_alert_days_before',
            'fitness_alert_days_before',
            'pucc_alert_days_before',
            'permit_alert_days_before',
            'is_active',
        ])));

        return $vehicle;
    }

    /**
     * Remove or deactivate a fleet vehicle.
     */
    public function removeVehicleFromFleet(string $organizationId, string $id): bool
    {
        $vehicle = FleetVehicle::where('organization_id', $organizationId)->where('id', $id)->first();
        if (!$vehicle) {
            return false;
        }

        $vehicle->is_active = false;
        return $vehicle->save();
    }

    /**
     * Overall fleet analytics & compliance telemetry.
     */
    public function getFleetAnalytics(string $organizationId): array
    {
        $list = $this->listFleet($organizationId);

        $depotCounts = [];
        $fitnessExpired = 0;
        $insuranceExpired = 0;
        $puccExpired = 0;
        $permitExpired = 0;
        $taxExpired = 0;

        foreach ($list['items'] as $item) {
            $d = $item['depot_location'] ?? 'Central Depot';
            $depotCounts[$d] = ($depotCounts[$d] ?? 0) + 1;

            $docs = $item['compliance']['documents'] ?? [];
            if (!empty($docs['fitness']['is_expired'])) $fitnessExpired++;
            if (!empty($docs['insurance']['is_expired'])) $insuranceExpired++;
            if (!empty($docs['pucc']['is_expired'])) $puccExpired++;
            if (!empty($docs['permit']['is_expired'])) $permitExpired++;
            if (!empty($docs['tax']['is_expired'])) $taxExpired++;
        }

        return [
            'total_fleet' => $list['total_vehicles'],
            'compliant_count' => $list['compliant_count'],
            'expiring_soon_count' => $list['expiring_soon_count'],
            'expired_count' => $list['expired_count'],
            'compliance_score_pct' => $list['compliance_score_pct'],
            'vehicles_with_challans' => $list['vehicles_with_challans'],
            'total_pending_fines_paise' => $list['total_pending_fines_paise'],
            'total_pending_fines_inr' => $list['total_pending_fines_inr'],
            'document_expiry_breakdown' => [
                'fitness_expired' => $fitnessExpired,
                'insurance_expired' => $insuranceExpired,
                'pucc_expired' => $puccExpired,
                'permit_expired' => $permitExpired,
                'tax_expired' => $taxExpired,
            ],
            'depot_distribution' => $depotCounts,
        ];
    }
}
