<?php

namespace Database\Seeders;

use App\Models\InspectionTemplate;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class InspectionTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Heavy Commercial Vehicle (HCV) Template v1
        InspectionTemplate::updateOrCreate(
            ['vehicle_category' => 'COMMERCIAL_HEAVY', 'version' => 1],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Heavy Commercial Vehicle & Multi-Axle Truck Dossier Template',
                'is_active' => true,
                'schema_definition' => [
                    'category' => 'COMMERCIAL_HEAVY',
                    'standard_axles' => 3,
                    'sections' => [
                        [
                            'key' => 'cabin_exterior',
                            'title' => 'Cabin & Exterior Body Structure',
                            'items' => [
                                ['key' => 'cabin_panels', 'label' => 'Cabin Sheet Metal & Doors', 'mandatory' => true],
                                ['key' => 'windshield_glass', 'label' => 'Windshield Glass & Wipers', 'mandatory' => true],
                                ['key' => 'front_bumper', 'label' => 'Front Bumper & Grille', 'mandatory' => true],
                                ['key' => 'paint_corrosion', 'label' => 'Paint Work & Rust Extent', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'load_body',
                            'title' => 'Load Bed & Cargo Body',
                            'items' => [
                                ['key' => 'platform_floor', 'label' => 'Cargo Bed Floor Plate Condition', 'mandatory' => true],
                                ['key' => 'side_walls_tailgate', 'label' => 'Side Drop Panels & Tailgate', 'mandatory' => true],
                                ['key' => 'headboard_structure', 'label' => 'Cabin-to-Body Headboard & Cab Guard', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'chassis_frame',
                            'title' => 'Chassis Frame & Structural Integrity',
                            'items' => [
                                ['key' => 'longitudinal_beams', 'label' => 'Main Longitudinal Members (Straightness/Welds)', 'mandatory' => true],
                                ['key' => 'cross_members_rivets', 'label' => 'Cross Members, Gussets & Riveting', 'mandatory' => true],
                                ['key' => 'chassis_stamping', 'label' => 'VIN Stamping Match with RC', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'powertrain_mechanical',
                            'title' => 'Engine & Mechanical Powertrain',
                            'items' => [
                                ['key' => 'engine_start_idle', 'label' => 'Engine Starting & Smooth Idling', 'mandatory' => true],
                                ['key' => 'oil_fluid_leaks', 'label' => 'Engine Oil, Coolant & Diesel Leaks', 'mandatory' => true],
                                ['key' => 'cooling_radiator', 'label' => 'Radiator, Hoses & Intercooler', 'mandatory' => true],
                                ['key' => 'exhaust_smoke', 'label' => 'Exhaust Smoke Level (Black/White/Normal)', 'mandatory' => true],
                                ['key' => 'clutch_gearbox', 'label' => 'Clutch Bite & Gearbox Shifting', 'mandatory' => true],
                                ['key' => 'propeller_diff', 'label' => 'Propeller Shaft & Differential Housing', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'brakes_steering_suspension',
                            'title' => 'Brakes, Steering & Suspension Systems',
                            'items' => [
                                ['key' => 'air_brakes_pressure', 'label' => 'Dual Circuit Air Brake Build-up & Leakage', 'mandatory' => true],
                                ['key' => 'steering_play_pump', 'label' => 'Steering Gear Play & Power Steering Pump', 'mandatory' => true],
                                ['key' => 'leaf_springs', 'label' => 'Front & Rear Heavy-Duty Leaf Spring Assemblies', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'electricals_documents',
                            'title' => 'Electricals, Safety & Document Match',
                            'items' => [
                                ['key' => 'battery_starter', 'label' => 'Heavy Commercial Battery & Alternator Output', 'mandatory' => true],
                                ['key' => 'lights_reflectors', 'label' => 'Headlights, Indicators & Conspicuity Tape', 'mandatory' => true],
                                ['key' => 'speed_governor', 'label' => 'Approved Speed Governor Fitted & Sealed', 'mandatory' => true],
                                ['key' => 'hsrp_plates', 'label' => 'High Security Registration Plates (Front/Rear)', 'mandatory' => true],
                                ['key' => 'fastag_tag', 'label' => 'Active Fastag RFID Tag Affixed', 'mandatory' => true],
                            ],
                        ],
                    ],
                ],
            ]
        );

        // 2. Passenger Car Template v1
        InspectionTemplate::updateOrCreate(
            ['vehicle_category' => 'PASSENGER_CAR', 'version' => 1],
            [
                'id' => (string) Str::uuid(),
                'name' => 'Passenger Car & Light Commercial Vehicle Template',
                'is_active' => true,
                'schema_definition' => [
                    'category' => 'PASSENGER_CAR',
                    'standard_axles' => 2,
                    'sections' => [
                        [
                            'key' => 'exterior_panels',
                            'title' => 'Exterior Body Panels & Paint',
                            'items' => [
                                ['key' => 'bonnet_fenders', 'label' => 'Bonnet, Fenders & Front Apron', 'mandatory' => true],
                                ['key' => 'doors_pillars', 'label' => 'A/B/C Pillars & Running Boards', 'mandatory' => true],
                                ['key' => 'boot_rear_quarter', 'label' => 'Boot Lid & Rear Quarter Panels', 'mandatory' => true],
                            ],
                        ],
                        [
                            'key' => 'mechanical_engine',
                            'title' => 'Engine, Transmission & AC',
                            'items' => [
                                ['key' => 'engine_noise_vibration', 'label' => 'Engine Noise & Vibration Level', 'mandatory' => true],
                                ['key' => 'transmission_clutch', 'label' => 'Transmission Engagement & Fluid Leakage', 'mandatory' => true],
                                ['key' => 'air_conditioning', 'label' => 'Climate Control Cooling & Blower', 'mandatory' => true],
                            ],
                        ],
                    ],
                ],
            ]
        );
    }
}
