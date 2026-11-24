<?php

namespace App\Modules\Tyres\Services;

class AxleLayoutService
{
    /**
     * Supported configurable vehicle axle and wheel configurations.
     */
    protected const CONFIGURATIONS = [
        '2_AXLE_4W' => [
            'code' => '2_AXLE_4W',
            'name' => '2-Axle (4 Wheels + Spare)',
            'description' => 'Passenger cars, SUVs, sedans, hatchbacks, and light utility vans.',
            'axles_count' => 2,
            'road_wheels_count' => 4,
            'spare_wheels_count' => 1,
            'total_wheels_count' => 5,
            'standard_tyre_size' => '195/65 R15',
            'axles' => [
                [
                    'axle_number' => 1,
                    'type' => 'STEERING',
                    'wheels' => [
                        ['position' => 'FRONT_LEFT', 'label' => 'Front Left', 'is_dual' => false],
                        ['position' => 'FRONT_RIGHT', 'label' => 'Front Right', 'is_dual' => false],
                    ],
                ],
                [
                    'axle_number' => 2,
                    'type' => 'DRIVE',
                    'wheels' => [
                        ['position' => 'REAR_LEFT', 'label' => 'Rear Left', 'is_dual' => false],
                        ['position' => 'REAR_RIGHT', 'label' => 'Rear Right', 'is_dual' => false],
                    ],
                ],
            ],
            'spare' => ['position' => 'SPARE', 'label' => 'Stepney / Spare Wheel'],
        ],

        '2_AXLE_6W' => [
            'code' => '2_AXLE_6W',
            'name' => '2-Axle Commercial Dual (6 Wheels + Spare)',
            'description' => 'Light commercial vehicles (LCV), 16-seater buses, 9-11 tonne medium goods carriers.',
            'axles_count' => 2,
            'road_wheels_count' => 6,
            'spare_wheels_count' => 1,
            'total_wheels_count' => 7,
            'standard_tyre_size' => '8.25 R16',
            'axles' => [
                [
                    'axle_number' => 1,
                    'type' => 'STEERING',
                    'wheels' => [
                        ['position' => 'FRONT_LEFT', 'label' => 'Front Left (Steer)', 'is_dual' => false],
                        ['position' => 'FRONT_RIGHT', 'label' => 'Front Right (Steer)', 'is_dual' => false],
                    ],
                ],
                [
                    'axle_number' => 2,
                    'type' => 'DRIVE_DUAL',
                    'wheels' => [
                        ['position' => 'REAR_LEFT_OUTER', 'label' => 'Rear Left Outer', 'is_dual' => true],
                        ['position' => 'REAR_LEFT_INNER', 'label' => 'Rear Left Inner', 'is_dual' => true],
                        ['position' => 'REAR_RIGHT_INNER', 'label' => 'Rear Right Inner', 'is_dual' => true],
                        ['position' => 'REAR_RIGHT_OUTER', 'label' => 'Rear Right Outer', 'is_dual' => true],
                    ],
                ],
            ],
            'spare' => ['position' => 'SPARE', 'label' => 'Stepney / Spare Wheel'],
        ],

        '3_AXLE_10W' => [
            'code' => '3_AXLE_10W',
            'name' => '3-Axle Heavy Commercial (10 Wheels + Spare)',
            'description' => '28-tonne heavy goods tipper, multi-axle cargo carrier (e.g. Tata Prima 2830.K, Ashok Leyland 2820).',
            'axles_count' => 3,
            'road_wheels_count' => 10,
            'spare_wheels_count' => 1,
            'total_wheels_count' => 11, // AC-TYRE-01: 10 road wheels + 1 spare
            'standard_tyre_size' => '295/90 R20',
            'axles' => [
                [
                    'axle_number' => 1,
                    'type' => 'STEERING',
                    'wheels' => [
                        ['position' => 'FRONT_LEFT', 'label' => 'Front Left (Steer Axle 1)', 'is_dual' => false],
                        ['position' => 'FRONT_RIGHT', 'label' => 'Front Right (Steer Axle 1)', 'is_dual' => false],
                    ],
                ],
                [
                    'axle_number' => 2,
                    'type' => 'DRIVE_DUAL',
                    'wheels' => [
                        ['position' => 'AXLE2_LEFT_OUTER', 'label' => 'Axle 2 Left Outer (Drive)', 'is_dual' => true],
                        ['position' => 'AXLE2_LEFT_INNER', 'label' => 'Axle 2 Left Inner (Drive)', 'is_dual' => true],
                        ['position' => 'AXLE2_RIGHT_INNER', 'label' => 'Axle 2 Right Inner (Drive)', 'is_dual' => true],
                        ['position' => 'AXLE2_RIGHT_OUTER', 'label' => 'Axle 2 Right Outer (Drive)', 'is_dual' => true],
                    ],
                ],
                [
                    'axle_number' => 3,
                    'type' => 'TAG_LIFT_DUAL',
                    'wheels' => [
                        ['position' => 'AXLE3_LEFT_OUTER', 'label' => 'Axle 3 Left Outer (Tag/Lift)', 'is_dual' => true],
                        ['position' => 'AXLE3_LEFT_INNER', 'label' => 'Axle 3 Left Inner (Tag/Lift)', 'is_dual' => true],
                        ['position' => 'AXLE3_RIGHT_INNER', 'label' => 'Axle 3 Right Inner (Tag/Lift)', 'is_dual' => true],
                        ['position' => 'AXLE3_RIGHT_OUTER', 'label' => 'Axle 3 Right Outer (Tag/Lift)', 'is_dual' => true],
                    ],
                ],
            ],
            'spare' => ['position' => 'SPARE', 'label' => 'Stepney / Spare Wheel'],
        ],

        '4_AXLE_12W' => [
            'code' => '4_AXLE_12W',
            'name' => '4-Axle Heavy Haulage (12 Wheels + Spare)',
            'description' => '35-tonne commercial haulage with twin steering axles.',
            'axles_count' => 4,
            'road_wheels_count' => 12,
            'spare_wheels_count' => 1,
            'total_wheels_count' => 13,
            'standard_tyre_size' => '295/90 R20',
            'axles' => [
                [
                    'axle_number' => 1,
                    'type' => 'STEERING_1',
                    'wheels' => [
                        ['position' => 'FRONT_LEFT_1', 'label' => 'Axle 1 Front Left', 'is_dual' => false],
                        ['position' => 'FRONT_RIGHT_1', 'label' => 'Axle 1 Front Right', 'is_dual' => false],
                    ],
                ],
                [
                    'axle_number' => 2,
                    'type' => 'STEERING_2',
                    'wheels' => [
                        ['position' => 'FRONT_LEFT_2', 'label' => 'Axle 2 Second Steer Left', 'is_dual' => false],
                        ['position' => 'FRONT_RIGHT_2', 'label' => 'Axle 2 Second Steer Right', 'is_dual' => false],
                    ],
                ],
                [
                    'axle_number' => 3,
                    'type' => 'DRIVE_DUAL',
                    'wheels' => [
                        ['position' => 'AXLE3_LEFT_OUTER', 'label' => 'Axle 3 Left Outer', 'is_dual' => true],
                        ['position' => 'AXLE3_LEFT_INNER', 'label' => 'Axle 3 Left Inner', 'is_dual' => true],
                        ['position' => 'AXLE3_RIGHT_INNER', 'label' => 'Axle 3 Right Inner', 'is_dual' => true],
                        ['position' => 'AXLE3_RIGHT_OUTER', 'label' => 'Axle 3 Right Outer', 'is_dual' => true],
                    ],
                ],
                [
                    'axle_number' => 4,
                    'type' => 'TAG_DUAL',
                    'wheels' => [
                        ['position' => 'AXLE4_LEFT_OUTER', 'label' => 'Axle 4 Left Outer', 'is_dual' => true],
                        ['position' => 'AXLE4_LEFT_INNER', 'label' => 'Axle 4 Left Inner', 'is_dual' => true],
                        ['position' => 'AXLE4_RIGHT_INNER', 'label' => 'Axle 4 Right Inner', 'is_dual' => true],
                        ['position' => 'AXLE4_RIGHT_OUTER', 'label' => 'Axle 4 Right Outer', 'is_dual' => true],
                    ],
                ],
            ],
            'spare' => ['position' => 'SPARE', 'label' => 'Stepney / Spare Wheel'],
        ],
    ];

    /**
     * Get all supported axle configurations.
     */
    public function getConfigurations(): array
    {
        return array_values(self::CONFIGURATIONS);
    }

    /**
     * Get configuration definition by code.
     */
    public function getConfiguration(string $code): ?array
    {
        return self::CONFIGURATIONS[strtoupper($code)] ?? null;
    }

    /**
     * Detect or default layout based on vehicle class / category.
     */
    public function detectLayoutForCategory(string $category, int $axleCount = 2): array
    {
        $cat = strtoupper(trim($category));

        if (str_contains($cat, 'COMMERCIAL_HEAVY') || str_contains($cat, 'HCV') || $axleCount >= 3) {
            return self::CONFIGURATIONS['3_AXLE_10W'];
        }

        if (str_contains($cat, 'COMMERCIAL_LIGHT') || str_contains($cat, 'LCV') || str_contains($cat, 'GOODS')) {
            return self::CONFIGURATIONS['2_AXLE_6W'];
        }

        return self::CONFIGURATIONS['2_AXLE_4W'];
    }
}
