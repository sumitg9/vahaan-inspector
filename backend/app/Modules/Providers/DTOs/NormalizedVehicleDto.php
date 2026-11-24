<?php

namespace App\Modules\Providers\DTOs;

/**
 * Standardized Data Transfer Object for VAHAN Vehicle Registry records.
 * Complies with DPDP Act 2023 with mandatory PII masking and provenance tracking.
 */
class NormalizedVehicleDto
{
    public function __construct(
        public readonly string $registrationNumber,
        public readonly string $chassisNumberMasked,
        public readonly string $engineNumberMasked,
        public readonly string $ownerNameMasked,
        public readonly int $ownershipSequence,
        public readonly string $makerModel,
        public readonly ?string $makerName,
        public readonly ?string $modelName,
        public readonly ?string $variantName,
        public readonly string $vehicleClass,
        public readonly ?string $bodyType,
        public readonly string $fuelType,
        public readonly ?string $color,
        public readonly ?string $emissionNorms,
        public readonly ?int $seatingCapacity,
        public readonly ?int $cubicCapacity,
        public readonly ?int $grossVehicleWeightKg,
        public readonly ?string $registrationDate,
        public readonly ?string $manufacturingDate,
        public readonly ?string $rtoCode,
        public readonly ?string $rtoName,
        public readonly ?string $stateCode,
        public readonly string $rcStatus, // ACTIVE, SUSPENDED, CANCELLED
        public readonly bool $hypothecated,
        public readonly ?string $financierName,
        public readonly ?string $insuranceCompany,
        public readonly ?string $insurancePolicyNumber,
        public readonly ?string $insuranceValidUntil,
        public readonly ?string $fitnessValidUntil,
        public readonly ?string $taxValidUntil,
        public readonly ?string $puccValidUntil,
        public readonly ?string $nationalPermitNumber,
        public readonly ?string $nationalPermitValidUntil,
        public readonly string $blacklistStatus, // CLEAN, BLACKLISTED
        public readonly string $providerSource, // apisathi, mock
        public readonly bool $isMockData,
        public readonly ?string $watermark,
        public readonly string $rawResponseHash,
        public readonly string $fetchedAt,
        public readonly array $provenanceMetadata = []
    ) {}

    /**
     * Create from raw array with safe null fallbacks and DPDP masking.
     */
    public static function fromRaw(array $data, string $providerSource, bool $isMock = false): self
    {
        $rawJson = json_encode($data);
        $hash = hash('sha256', $rawJson ?: '');

        $rawReg = strtoupper(trim($data['rc_number'] ?? $data['registration_number'] ?? $data['reg_no'] ?? 'UNKNOWN'));
        $rawChassis = $data['chassis_number'] ?? $data['chassis_no'] ?? $data['vin'] ?? 'unavailable';
        $rawEngine = $data['engine_number'] ?? $data['engine_no'] ?? 'unavailable';
        $rawOwner = $data['owner_name'] ?? 'unavailable';

        $maker = $data['maker'] ?? $data['maker_name'] ?? null;
        $model = $data['model'] ?? $data['model_name'] ?? null;
        $makerModel = $data['maker_model'] ?? ($maker && $model ? "{$maker} {$model}" : ($maker ?? $model ?? 'Standard Spec Chassis'));

        return new self(
            registrationNumber: $rawReg,
            chassisNumberMasked: self::maskChassis($rawChassis),
            engineNumberMasked: self::maskEngine($rawEngine),
            ownerNameMasked: self::maskOwnerName($rawOwner),
            ownershipSequence: (int) ($data['ownership_sequence'] ?? $data['owner_serial_number'] ?? 1),
            makerModel: $makerModel,
            makerName: $maker,
            modelName: $model,
            variantName: $data['variant'] ?? $data['variant_name'] ?? null,
            vehicleClass: $data['vehicle_class'] ?? $data['vehicle_category'] ?? 'Commercial/LMV',
            bodyType: $data['body_type'] ?? null,
            fuelType: strtoupper($data['fuel_type'] ?? 'DIESEL'),
            color: $data['color'] ?? null,
            emissionNorms: $data['norms'] ?? $data['emission_norms'] ?? 'BS-VI',
            seatingCapacity: isset($data['seating_capacity']) ? (int) $data['seating_capacity'] : null,
            cubicCapacity: isset($data['cubic_capacity']) ? (int) $data['cubic_capacity'] : null,
            grossVehicleWeightKg: isset($data['gross_vehicle_weight']) ? (int) $data['gross_vehicle_weight'] : (isset($data['gross_vehicle_weight_kg']) ? (int) $data['gross_vehicle_weight_kg'] : null),
            registrationDate: $data['registration_date'] ?? null,
            manufacturingDate: $data['manufacturing_date'] ?? null,
            rtoCode: $data['rto_code'] ?? null,
            rtoName: $data['rto_name'] ?? null,
            stateCode: $data['state_code'] ?? ($data['rto_code'] ? substr($data['rto_code'], 0, 2) : null),
            rcStatus: strtoupper($data['rc_status'] ?? 'ACTIVE'),
            hypothecated: !empty($data['financier']) || !empty($data['financier_name']),
            financierName: $data['financier'] ?? $data['financier_name'] ?? null,
            insuranceCompany: $data['insurance_company'] ?? null,
            insurancePolicyNumber: $data['insurance_policy_number'] ?? null,
            insuranceValidUntil: $data['insurance_valid_until'] ?? null,
            fitnessValidUntil: $data['fitness_valid_until'] ?? null,
            taxValidUntil: $data['tax_valid_until'] ?? null,
            puccValidUntil: $data['pucc_valid_until'] ?? null,
            nationalPermitNumber: $data['national_permit_number'] ?? null,
            nationalPermitValidUntil: $data['national_permit_valid_until'] ?? null,
            blacklistStatus: strtoupper($data['blacklist_status'] ?? 'CLEAN'),
            providerSource: $providerSource,
            isMockData: $isMock,
            watermark: $isMock ? 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE' : null,
            rawResponseHash: $hash,
            fetchedAt: date('Y-m-d H:i:s'),
            provenanceMetadata: [
                'provider' => $providerSource,
                'sha256' => $hash,
                'compliance' => 'DPDP_ACT_2023_MASKED',
                'field_provenance' => [
                    'registration_number' => 'rto_registry',
                    'chassis_number' => 'dpdp_masked',
                    'engine_number' => 'dpdp_masked',
                    'owner_name' => 'dpdp_masked',
                    'maker_model' => 'rto_registry',
                    'fuel_type' => 'rto_registry',
                    'emission_norms' => 'rto_registry',
                    'fitness_valid_until' => !empty($data['fitness_valid_until']) ? 'rto_registry' : 'restricted',
                    'financier_name' => (!empty($data['financier']) || !empty($data['financier_name']))
                        ? 'rto_registry'
                        : (array_key_exists('financier', $data) && $data['financier'] === null ? 'restricted' : 'not_applicable'),
                    'insurance_company' => !empty($data['insurance_company']) ? 'provider_reported' : 'unavailable',
                    'pucc_valid_until' => !empty($data['pucc_valid_until']) ? 'rto_registry' : 'unavailable',
                    'national_permit_number' => !empty($data['national_permit_number']) ? 'rto_registry' : 'not_applicable',
                    'blacklist_status' => 'rto_enforcement',
                ],
            ]
        );
    }

    /**
     * DPDP Act 2023 Masking: Preserves first letter, masks middle with asterisks.
     */
    public static function maskOwnerName(?string $name): string
    {
        if (!$name || $name === 'unavailable') {
            return 'REDACTED';
        }
        $words = explode(' ', trim($name));
        $maskedWords = array_map(function ($word) {
            $len = strlen($word);
            if ($len <= 2) {
                return $word;
            }
            return $word[0] . '****' . ($len > 5 ? $word[$len - 1] : '');
        }, $words);

        return implode(' ', $maskedWords);
    }

    public static function maskChassis(?string $chassis): string
    {
        if (!$chassis || $chassis === 'unavailable') {
            return 'unavailable';
        }
        $len = strlen($chassis);
        if ($len <= 8) {
            return substr($chassis, 0, 3) . '****';
        }
        return substr($chassis, 0, 7) . '******' . substr($chassis, -3);
    }

    public static function maskEngine(?string $engine): string
    {
        if (!$engine || $engine === 'unavailable') {
            return 'unavailable';
        }
        $len = strlen($engine);
        if ($len <= 6) {
            return substr($engine, 0, 2) . '****';
        }
        return substr($engine, 0, 4) . '******';
    }

    public function toArray(): array
    {
        return [
            'registration_number' => $this->registrationNumber,
            'chassis_number' => $this->chassisNumberMasked,
            'engine_number' => $this->engineNumberMasked,
            'owner_name_masked' => $this->ownerNameMasked,
            'ownership_sequence' => $this->ownershipSequence,
            'maker_model' => $this->makerModel,
            'maker_name' => $this->makerName,
            'model_name' => $this->modelName,
            'variant_name' => $this->variantName,
            'vehicle_class' => $this->vehicleClass,
            'body_type' => $this->bodyType,
            'fuel_type' => $this->fuelType,
            'color' => $this->color,
            'emission_norms' => $this->emissionNorms,
            'seating_capacity' => $this->seatingCapacity,
            'cubic_capacity' => $this->cubicCapacity,
            'gross_vehicle_weight_kg' => $this->grossVehicleWeightKg,
            'registration_date' => $this->registrationDate,
            'manufacturing_date' => $this->manufacturingDate,
            'rto_code' => $this->rtoCode,
            'rto_name' => $this->rtoName,
            'state_code' => $this->stateCode,
            'rc_status' => $this->rcStatus,
            'hypothecated' => $this->hypothecated,
            'financier_name' => $this->financierName,
            'insurance_company' => $this->insuranceCompany,
            'insurance_policy_number' => $this->insurancePolicyNumber,
            'insurance_valid_until' => $this->insuranceValidUntil,
            'fitness_valid_until' => $this->fitnessValidUntil,
            'tax_valid_until' => $this->taxValidUntil,
            'pucc_valid_until' => $this->puccValidUntil,
            'national_permit_number' => $this->nationalPermitNumber,
            'national_permit_valid_until' => $this->nationalPermitValidUntil,
            'blacklist_status' => $this->blacklistStatus,
            'provider_source' => $this->providerSource,
            'is_mock_data' => $this->isMockData,
            'watermark' => $this->watermark,
            'raw_response_hash' => $this->rawResponseHash,
            'fetched_at' => $this->fetchedAt,
            'provenance_metadata' => $this->provenanceMetadata,
        ];
    }
}
