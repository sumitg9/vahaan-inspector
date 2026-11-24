<?php

namespace App\Modules\Providers\Drivers;

use App\Modules\Providers\Contracts\ChallanDataProviderInterface;
use App\Modules\Providers\Contracts\VehicleDataProviderInterface;
use App\Modules\Providers\DTOs\NormalizedChallanResponseDto;
use App\Modules\Providers\DTOs\NormalizedVehicleDto;
use App\Modules\Providers\Exceptions\ProviderRateLimitException;
use App\Modules\Providers\Exceptions\ProviderTimeoutException;
use App\Modules\Providers\Exceptions\ProviderUnavailableException;
use App\Modules\Providers\Exceptions\VehicleNotFoundException;

class MockProvider implements VehicleDataProviderInterface, ChallanDataProviderInterface
{
    protected string $environment;

    public function __construct(string $environment = 'mock')
    {
        $this->environment = $environment;
    }

    public function getProviderName(): string
    {
        return 'mock';
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function getEnvironment(): string
    {
        return $this->environment;
    }

    /**
     * Lookup vehicle registry in mock driver with deterministic scenarios.
     */
    public function lookupVehicle(string $registrationNumber, array $options = []): NormalizedVehicleDto
    {
        $reg = strtoupper(str_replace(' ', '', trim($registrationNumber)));

        // 1. Deterministic Error Simulations
        if ($reg === 'UP16AB0000') {
            throw new ProviderTimeoutException('mock', $reg, 8);
        }
        if ($reg === 'RJ14XY0000') {
            throw new ProviderRateLimitException('mock', 60);
        }
        if ($reg === 'GJ01AB0000') {
            throw new ProviderUnavailableException('mock', 'Provider balance exhausted');
        }
        if ($reg === 'WB02AB0000') {
            throw new VehicleNotFoundException('mock', $reg);
        }

        // 2. Specific Deterministic Fixtures
        if ($reg === 'MH12AB1234') {
            return NormalizedVehicleDto::fromRaw([
                'rc_number' => 'MH12AB1234',
                'registration_date' => '2022-06-15',
                'manufacturing_date' => '2022-04-01',
                'chassis_number' => 'MAT624001P2123456',
                'engine_number' => 'ISBE59123456',
                'owner_name' => 'M/S LOGISTICS INDIA PVT LTD',
                'ownership_sequence' => 1,
                'maker' => 'TATA MOTORS LTD',
                'model' => 'PRIMA 2830.K',
                'variant' => 'CAB CHASSIS TIPPER',
                'vehicle_class' => 'Heavy Goods Vehicle (HGV)',
                'body_type' => 'Tipper (Dump Truck)',
                'fuel_type' => 'DIESEL',
                'color' => 'ARCTIC WHITE',
                'norms' => 'BHARAT STAGE VI (BS-VI)',
                'seating_capacity' => 3,
                'cubic_capacity' => 6700,
                'gross_vehicle_weight' => 28000,
                'rto_code' => 'MH-12',
                'rto_name' => 'PUNE RTO',
                'state_code' => 'MH',
                'rc_status' => 'ACTIVE',
                'financier' => 'TATA MOTORS FINANCE LIMITED',
                'insurance_company' => 'BAJAJ ALLIANZ GENERAL INSURANCE',
                'insurance_policy_number' => 'BAGIC/COMM/2023/981245',
                'insurance_valid_until' => '2026-06-14',
                'fitness_valid_until' => '2026-06-14',
                'tax_valid_until' => '2026-06-14',
                'pucc_valid_until' => '2025-12-14',
                'national_permit_number' => 'NP/MH/2022/19820',
                'national_permit_valid_until' => '2027-06-14',
                'blacklist_status' => 'CLEAN',
            ], 'mock', true);
        }

        if ($reg === 'DL01XY9999') {
            return NormalizedVehicleDto::fromRaw([
                'rc_number' => 'DL01XY9999',
                'registration_date' => '2020-01-10',
                'manufacturing_date' => '2019-11-20',
                'chassis_number' => 'MALBB51BLHM981234',
                'engine_number' => 'G4LCHM761234',
                'owner_name' => 'VIKRAM ARORA',
                'ownership_sequence' => 2,
                'maker' => 'HYUNDAI MOTOR INDIA LTD',
                'model' => 'CRETA',
                'variant' => '1.5 SX',
                'vehicle_class' => 'Motor Car (LMV)',
                'body_type' => 'SUV',
                'fuel_type' => 'PETROL',
                'color' => 'POLAR WHITE',
                'norms' => 'BS-VI',
                'seating_capacity' => 5,
                'cubic_capacity' => 1497,
                'gross_vehicle_weight' => 1690,
                'rto_code' => 'DL-01',
                'rto_name' => 'MALL ROAD RTO',
                'state_code' => 'DL',
                'rc_status' => 'ACTIVE',
                'financier' => null, // Restricted / Not available
                'insurance_company' => 'BAJAJ ALLIANZ',
                'insurance_policy_number' => 'BAGIC/PVT/2020/12984',
                'insurance_valid_until' => '2025-01-09',
                'fitness_valid_until' => null, // Restricted
                'tax_valid_until' => 'LTT',
                'pucc_valid_until' => '2025-01-09',
                'national_permit_number' => null,
                'national_permit_valid_until' => null,
                'blacklist_status' => 'CLEAN',
            ], 'mock', true);
        }

        if ($reg === 'KA01MJ0001') {
            return NormalizedVehicleDto::fromRaw([
                'rc_number' => 'KA01MJ0001',
                'registration_date' => '2023-09-01',
                'manufacturing_date' => '2023-08-01',
                'chassis_number' => 'WBA43AZ00P1234567',
                'engine_number' => 'B48B20123456',
                'owner_name' => 'SUNIL NARANG',
                'ownership_sequence' => 1,
                'maker' => 'BMW INDIA PVT LTD',
                'model' => '330LI',
                'variant' => 'GRAN LIMOUSINE M SPORT',
                'vehicle_class' => 'Luxury Sedan (LMV)',
                'body_type' => 'Sedan',
                'fuel_type' => 'PETROL',
                'color' => 'MINERAL WHITE',
                'norms' => 'BS-VI',
                'seating_capacity' => 5,
                'cubic_capacity' => 1998,
                'gross_vehicle_weight' => 2050,
                'rto_code' => 'KA-01',
                'rto_name' => 'KORAMANGALA RTO',
                'state_code' => 'KA',
                'rc_status' => 'ACTIVE',
                'financier' => null,
                'insurance_company' => 'HDFC ERGO GENERAL INSURANCE',
                'insurance_policy_number' => '2311/98201/00/000',
                'insurance_valid_until' => '2026-08-31',
                'fitness_valid_until' => '2038-08-31',
                'tax_valid_until' => 'LTT',
                'pucc_valid_until' => '2025-08-31',
                'national_permit_number' => null,
                'national_permit_valid_until' => null,
                'blacklist_status' => 'CLEAN',
            ], 'mock', true);
        }

        // 3. Fallback Synthesized Deterministic Vehicle
        $state = substr($reg, 0, 2);
        return NormalizedVehicleDto::fromRaw([
            'rc_number' => $reg,
            'registration_date' => '2021-04-10',
            'manufacturing_date' => '2021-03-01',
            'chassis_number' => 'MA3F' . substr(md5($reg), 0, 12),
            'engine_number' => 'ENG' . substr(md5($reg), 0, 8),
            'owner_name' => 'DEMO ENTERPRISE USER',
            'ownership_sequence' => 1,
            'maker' => 'ASHOK LEYLAND',
            'model' => '4220 HG',
            'variant' => 'HAULAGE TRUCK',
            'vehicle_class' => 'Commercial Goods Carrier',
            'body_type' => 'Flatbed',
            'fuel_type' => 'DIESEL',
            'norms' => 'BS-VI',
            'rto_code' => substr($reg, 0, 4),
            'rto_name' => 'REGIONAL TRANSPORT OFFICE',
            'state_code' => $state,
            'rc_status' => 'ACTIVE',
            'financier' => 'HDFC BANK LIMITED',
            'insurance_company' => 'NEW INDIA ASSURANCE',
            'insurance_valid_until' => '2025-04-09',
            'fitness_valid_until' => '2026-04-09',
            'blacklist_status' => 'CLEAN',
        ], 'mock', true);
    }

    /**
     * Lookup challans in mock driver with deterministic scenarios.
     */
    public function lookupChallans(string $registrationNumber, array $options = []): NormalizedChallanResponseDto
    {
        $reg = strtoupper(str_replace(' ', '', trim($registrationNumber)));

        if ($reg === 'UP16AB0000') {
            throw new ProviderTimeoutException('mock', $reg, 8);
        }
        if ($reg === 'RJ14XY0000') {
            throw new ProviderRateLimitException('mock', 60);
        }
        if ($reg === 'GJ01AB0000') {
            throw new ProviderUnavailableException('mock', 'Provider balance exhausted');
        }

        // Clean Vehicle: 0 Challans
        if ($reg === 'KA01MJ0001') {
            return NormalizedChallanResponseDto::fromRaw($reg, [], 'mock', true);
        }

        // Multiple Challans: MH12AB1234
        if ($reg === 'MH12AB1234') {
            return NormalizedChallanResponseDto::fromRaw($reg, [
                [
                    'challan_number' => 'MH1209230009182',
                    'challan_date' => '2024-03-12 14:22:10',
                    'offence_name' => 'Driving in violation of mandatory road signs / Speeding (Sec 112/183)',
                    'amount' => 2000, // ₹2,000 -> 200,000 paise
                    'status' => 'Pending',
                    'state' => 'MH',
                    'rto' => 'PUNE HIGHWAY POLICE',
                    'court_name' => null,
                    'payment_date' => null,
                ],
                [
                    'challan_number' => 'MH1205220001092',
                    'challan_date' => '2023-11-05 09:15:00',
                    'offence_name' => 'Improper Parking creating obstruction (Sec 122/177)',
                    'amount' => 1000, // ₹1,000 -> 100,000 paise
                    'status' => 'Disposed',
                    'state' => 'MH',
                    'rto' => 'PUNE CITY POLICE',
                    'court_name' => null,
                    'payment_date' => '2023-11-08 11:00:00',
                ],
            ], 'mock', true);
        }

        // Disposed History Only: MH04CD5678
        if ($reg === 'MH04CD5678') {
            return NormalizedChallanResponseDto::fromRaw($reg, [
                [
                    'challan_number' => 'MH0401230004910',
                    'challan_date' => '2023-01-14 11:00:00',
                    'offence_name' => 'Driving without Seatbelt (Sec 194B)',
                    'amount' => 1000,
                    'status' => 'Disposed',
                    'state' => 'MH',
                    'rto' => 'THANE TRAFFIC BRANCH',
                    'payment_date' => '2023-01-15 16:20:00',
                ],
            ], 'mock', true);
        }

        // Single Challan: DL01XY9999
        if ($reg === 'DL01XY9999') {
            return NormalizedChallanResponseDto::fromRaw($reg, [
                [
                    'challan_number' => 'DL019827361541',
                    'challan_date' => '2024-02-18 09:30:12',
                    'offence_name' => 'Exceeding prescribed speed limits (Automated Speed Camera)',
                    'amount' => 2000,
                    'status' => 'Pending',
                    'state' => 'DL',
                    'rto' => 'DELHI TRAFFIC POLICE',
                ],
            ], 'mock', true);
        }

        // Fallback: 1 Pending Warning Notice
        return NormalizedChallanResponseDto::fromRaw($reg, [
            [
                'challan_number' => 'CH-' . substr(md5($reg), 0, 10),
                'challan_date' => '2024-01-10 10:00:00',
                'offence_name' => 'General Traffic Regulation Infringement (Sec 177)',
                'amount' => 500,
                'status' => 'Pending',
                'state' => substr($reg, 0, 2),
                'rto' => 'REGIONAL TRANSPORT ENFORCEMENT',
            ],
        ], 'mock', true);
    }
}
