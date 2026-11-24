<?php

namespace Database\Seeders;

use App\Models\Organization;
use App\Models\Branch;
use App\Models\User;
use App\Models\CreditWallet;
use App\Models\WalletTransaction;
use App\Models\Client;
use App\Models\BankBranch;
use App\Models\VehicleProfile;
use App\Models\Challan;
use App\Models\InspectionTemplate;
use App\Models\InspectionCase;
use App\Models\InspectionItemResult;
use App\Models\InspectionTyre;
use App\Models\Valuation;
use App\Models\ReportSnapshot;
use App\Models\AuditLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class SyntheticDataSeeder extends Seeder
{
    public function run(): void
    {
        // ---------------------------------------------------------
        // 1. Organizations (Tenants)
        // ---------------------------------------------------------
        $orgSpeedcheck = Organization::updateOrCreate(
            ['slug' => 'speedcheck'],
            [
                'id' => 'e4eaaaf2-d142-11e1-b3e4-080027620c41',
                'name' => 'SpeedCheck Valuers Pvt Ltd',
                'legal_name' => 'SpeedCheck Asset Valuation & Surveyors India Private Limited',
                'email' => 'operations@speedcheck.in',
                'phone' => '+912025678900',
                'gst_number' => '27AABCS1429B1Z8',
                'pan_number' => 'AABCS1429B',
                'status' => 'ACTIVE',
                'report_disclaimer' => 'This vehicle inspection and valuation dossier has been compiled in accordance with standard Indian commercial banking practices. Physical findings reflect vehicle condition at inspection time.',
            ]
        );

        $orgApex = Organization::updateOrCreate(
            ['slug' => 'apex-surveyors'],
            [
                'id' => 'f5fbbbf3-e253-22f2-c4f5-191138731d52',
                'name' => 'Apex Vehicle Surveyors LLP',
                'legal_name' => 'Apex Motor Surveyors & Technical Auditors LLP',
                'email' => 'desk@apexsurveyors.com',
                'phone' => '+912222889900',
                'gst_number' => '27AAKFA4912J1ZG',
                'pan_number' => 'AAKFA4912J',
                'status' => 'ACTIVE',
            ]
        );

        // ---------------------------------------------------------
        // 2. Branches
        // ---------------------------------------------------------
        $branchPune = Branch::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'code' => 'PUN-HQ'],
            [
                'id' => '11111111-1111-1111-1111-111111111111',
                'name' => 'Pune Headquarters & Commercial Hub',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '411001',
                'address' => 'Plot 42, Senapati Bapat Road, Shivaji Nagar, Pune',
                'is_headquarters' => true,
            ]
        );

        $branchChakan = Branch::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'code' => 'CHK-02'],
            [
                'id' => '22222222-2222-2222-2222-222222222222',
                'name' => 'Chakan Auto Logistics Yard',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'pincode' => '410501',
                'address' => 'MIDC Phase II, Chakan Auto Hub, Pune',
                'is_headquarters' => false,
            ]
        );

        // ---------------------------------------------------------
        // 3. Users (RBAC)
        // ---------------------------------------------------------
        $passwordHash = Hash::make('SecretPass@2026');

        $adminUser = User::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'email' => 'admin@speedcheck.in'],
            [
                'id' => '33333333-3333-3333-3333-333333333333',
                'branch_id' => $branchPune->id,
                'name' => 'Anil Deshmukh',
                'phone' => '+919822012345',
                'password_hash' => $passwordHash,
                'role' => 'ORG_ADMIN',
                'is_active' => true,
            ]
        );

        $valuerUser = User::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'email' => 'valuer.sharma@speedcheck.in'],
            [
                'id' => '44444444-4444-4444-4444-444444444444',
                'branch_id' => $branchPune->id,
                'name' => 'Suresh Sharma',
                'phone' => '+919822098765',
                'password_hash' => $passwordHash,
                'role' => 'VALUER',
                'is_active' => true,
            ]
        );

        $inspectorUser = User::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'email' => 'inspector.rajesh@speedcheck.in'],
            [
                'id' => '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
                'branch_id' => $branchChakan->id,
                'name' => 'Rajesh Kumar',
                'phone' => '+919876543210',
                'password_hash' => $passwordHash,
                'role' => 'INSPECTOR',
                'is_active' => true,
            ]
        );

        // Apex Organization Inspector (for Tenant Isolation Testing)
        $apexInspector = User::updateOrCreate(
            ['organization_id' => $orgApex->id, 'email' => 'inspector.vikram@apex.in'],
            [
                'id' => '55555555-5555-5555-5555-555555555555',
                'name' => 'Vikram More',
                'phone' => '+919933445566',
                'password_hash' => $passwordHash,
                'role' => 'INSPECTOR',
                'is_active' => true,
            ]
        );

        // ---------------------------------------------------------
        // 4. Credit Wallets & Double-Entry Ledgers
        // ---------------------------------------------------------
        $walletSpeedcheck = CreditWallet::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id],
            [
                'id' => (string) Str::uuid(),
                'balance_credits' => 950,
                'low_balance_threshold' => 50,
                'auto_recharge_enabled' => true,
            ]
        );

        WalletTransaction::updateOrCreate(
            ['idempotency_key' => 'tx_init_topup_speedcheck_2026'],
            [
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $walletSpeedcheck->id,
                'transaction_type' => 'CREDIT_TOPUP',
                'credits_amount' => 1000,
                'balance_after' => 1000,
                'description' => 'Initial enterprise credit package purchase (1000 credits)',
                'created_at' => now()->subDays(5),
            ]
        );

        WalletTransaction::updateOrCreate(
            ['idempotency_key' => 'tx_lookup_mh12ab1234_2026'],
            [
                'id' => (string) Str::uuid(),
                'credit_wallet_id' => $walletSpeedcheck->id,
                'transaction_type' => 'RC_LOOKUP_DEDUCTION',
                'credits_amount' => -50,
                'balance_after' => 950,
                'description' => 'Vehicle RC and eChallan verification for MH12AB1234',
                'created_at' => now()->subDays(1),
            ]
        );

        // ---------------------------------------------------------
        // 5. Clients & Bank Branches
        // ---------------------------------------------------------
        $clientHdfc = Client::updateOrCreate(
            ['organization_id' => $orgSpeedcheck->id, 'name' => 'HDFC Bank Limited'],
            [
                'id' => '66666666-6666-6666-6666-666666666666',
                'client_type' => 'BANK',
                'contact_person' => 'Pooja Kulkarni',
                'email' => 'autoloans.pune@hdfcbank.com',
                'phone' => '+912066881122',
                'pan_number' => 'AAACH2702H',
                'gst_number' => '27AAACH2702H1ZX',
                'billing_address' => 'HDFC Bank House, Senapati Bapat Road, Pune',
                'is_active' => true,
            ]
        );

        $bankBranchPuneCamp = BankBranch::updateOrCreate(
            ['client_id' => $clientHdfc->id, 'branch_code' => 'HDFC0000039'],
            [
                'id' => '77777777-7777-7777-7777-777777777777',
                'branch_name' => 'Pune Camp Retail Assets Branch',
                'contact_person' => 'Amitabh Saxena',
                'email' => 'amitabh.s@hdfcbank.com',
                'phone' => '+919822119988',
                'city' => 'Pune',
                'state' => 'Maharashtra',
                'address' => 'East Street, Camp, Pune 411001',
            ]
        );

        // ---------------------------------------------------------
        // 6. Normalized Vehicle Profiles
        // ---------------------------------------------------------
        $vehHcv = VehicleProfile::updateOrCreate(
            ['registration_number' => 'MH12AB1234'],
            [
                'id' => '88888888-8888-8888-8888-888888888888',
                'chassis_number' => 'MA3EWB12S00123456',
                'engine_number' => 'K12MN1234567',
                'maker_model' => 'TATA MOTORS LTD / PRIMA 4028.S',
                'maker_name' => 'TATA MOTORS LTD',
                'model_name' => 'PRIMA 4028.S',
                'variant_name' => 'CAB CHASSIS',
                'vehicle_class' => 'Heavy Goods Vehicle (HGV)',
                'body_type' => 'TRACTOR COMMERCIAL',
                'fuel_type' => 'DIESEL',
                'color' => 'ARCTIC WHITE',
                'emission_norms' => 'BHARAT STAGE VI (BS-VI)',
                'seating_capacity' => 2,
                'cubic_capacity' => 6700,
                'unladen_weight_kg' => 7250,
                'gross_vehicle_weight_kg' => 40000,
                'number_of_cylinders' => 6,
                'wheelbase_mm' => 3800,
                'registration_date' => '2022-06-15',
                'manufacturing_date' => '2022-04-01',
                'rto_code' => 'MH-12',
                'rto_name' => 'PUNE RTO',
                'state_code' => 'MH',
                'rc_status' => 'ACTIVE',
                'ownership_sequence' => 1,
                'owner_name_masked' => 'M**** L**** LOGISTICS PVT LTD',
                'hypothecated' => true,
                'financier_name' => 'HDFC BANK LIMITED',
                'insurance_company' => 'ICICI LOMBARD GENERAL INSURANCE CO LTD',
                'insurance_policy_number' => '3001/29849201/00/000',
                'insurance_valid_until' => '2026-06-14',
                'fitness_valid_until' => '2026-06-14',
                'tax_valid_until' => '2026-06-14',
                'pucc_valid_until' => '2026-12-14',
                'national_permit_number' => 'NP/MH/2022/19820',
                'national_permit_valid_until' => '2027-06-14',
                'blacklist_status' => 'CLEAN',
                'provider_source' => 'mock_gateway',
                'is_mock_data' => true,
            ]
        );

        // ---------------------------------------------------------
        // 7. Traffic Challans
        // ---------------------------------------------------------
        Challan::updateOrCreate(
            ['challan_number' => 'MH1209230009182'],
            [
                'id' => (string) Str::uuid(),
                'vehicle_profile_id' => $vehHcv->id,
                'offence_details' => 'Driving in violation of mandatory road signs / Speeding (Sec 112/183)',
                'offence_date_time' => '2026-09-12 14:32:00',
                'fine_amount_paise' => 200000, // ₹2,000.00
                'state_code' => 'MH',
                'rto_name' => 'PUNE HIGHWAY POLICE',
                'challan_status' => 'PENDING',
                'provider_source' => 'mock_gateway',
                'is_mock_data' => true,
            ]
        );

        Challan::updateOrCreate(
            ['challan_number' => 'MH1205220001092'],
            [
                'id' => (string) Str::uuid(),
                'vehicle_profile_id' => $vehHcv->id,
                'offence_details' => 'Improper Parking creating obstruction (Sec 122/177)',
                'offence_date_time' => '2026-05-10 09:15:00',
                'fine_amount_paise' => 100000, // ₹1,000.00
                'state_code' => 'MH',
                'rto_name' => 'PUNE CITY POLICE',
                'challan_status' => 'DISPOSED',
                'payment_date' => '2026-05-12 11:00:00',
                'receipt_number' => 'RC-MH12-984920',
                'provider_source' => 'mock_gateway',
                'is_mock_data' => true,
            ]
        );

        // ---------------------------------------------------------
        // 8. Inspection Case
        // ---------------------------------------------------------
        $templateHcv = InspectionTemplate::where('vehicle_category', 'COMMERCIAL_HEAVY')->first();

        $caseHcv = InspectionCase::updateOrCreate(
            ['loan_reference_number' => 'HDFC-AUTO-2026-8912'],
            [
                'id' => '99999999-9999-9999-9999-999999999999',
                'organization_id' => $orgSpeedcheck->id,
                'branch_id' => $branchChakan->id,
                'client_id' => $clientHdfc->id,
                'bank_branch_id' => $bankBranchPuneCamp->id,
                'vehicle_profile_id' => $vehHcv->id,
                'assigned_inspector_id' => $inspectorUser->id,
                'template_id' => $templateHcv->id,
                'status' => 'APPROVED',
                'priority' => 'HIGH',
                'scheduled_at' => now()->subDays(2),
                'inspection_address' => 'Chakan Logistics Park Yard 4, Talegaon-Chakan Road, Pune, MH 410501',
                'inspection_latitude' => 18.752310,
                'inspection_longitude' => 73.856920,
                'odometer_reading_km' => 142580,
                'engine_started' => true,
                'road_tested' => true,
                'summary_condition_rating' => 'GOOD',
                'qc_remarks' => 'Chassis straight without distortion. Cabin interior clean. Tyres in roadworthy state.',
                'submitted_at' => now()->subDays(1),
                'approved_by' => $valuerUser->id,
                'approved_at' => now()->subHours(6),
            ]
        );

        // ---------------------------------------------------------
        // 9. Inspection Item Results
        // ---------------------------------------------------------
        $checkpoints = [
            ['cabin_exterior', 'cabin_panels', 'Cabin Sheet Metal & Doors', 'PASS', 'Minor paint scratching on driver step.'],
            ['load_body', 'platform_floor', 'Cargo Bed Floor Plate Condition', 'PASS', 'Floor plate intact, no heavy rust.'],
            ['chassis_frame', 'longitudinal_beams', 'Main Longitudinal Members', 'PASS', 'Beams true and straight without weld repairs.'],
            ['chassis_frame', 'chassis_stamping', 'VIN Stamping Match with RC', 'PASS', 'Stamping crisp and matches RC verbatim.'],
            ['powertrain_mechanical', 'engine_start_idle', 'Engine Starting & Smooth Idling', 'PASS', 'Instant self-start with clean idle sound.'],
            ['powertrain_mechanical', 'oil_fluid_leaks', 'Engine Oil & Fluid Leaks', 'ATTENTION_REQUIRED', 'Minor seepage around rocker cover.'],
            ['brakes_steering_suspension', 'air_brakes_pressure', 'Air Brake System', 'PASS', 'Pressure builds to 8.5 bar smoothly.'],
            ['electricals_documents', 'speed_governor', 'Speed Governor Seal', 'PASS', 'Minda speed limiter intact and sealed at 80 km/h.'],
        ];

        foreach ($checkpoints as $cp) {
            InspectionItemResult::updateOrCreate(
                ['inspection_case_id' => $caseHcv->id, 'section_key' => $cp[0], 'item_key' => $cp[1]],
                [
                    'id' => (string) Str::uuid(),
                    'item_label' => $cp[2],
                    'rating' => $cp[3],
                    'remarks' => $cp[4],
                    'verified_physically' => true,
                ]
            );
        }

        // ---------------------------------------------------------
        // 10. Multi-Axle Tyres (10 Wheels + Spare)
        // ---------------------------------------------------------
        $tyrePositions = [
            [1, 'FRONT_LEFT', 'MRF STEEL MUSCLE', '295/90 R20', 11.5, 80, 'GOOD'],
            [1, 'FRONT_RIGHT', 'MRF STEEL MUSCLE', '295/90 R20', 11.0, 75, 'GOOD'],
            [2, 'REAR_LEFT_OUTER', 'APOLLO ENDURACE', '295/90 R20', 7.5, 55, 'AVERAGE'],
            [2, 'REAR_LEFT_INNER', 'APOLLO ENDURACE', '295/90 R20', 7.0, 50, 'AVERAGE'],
            [2, 'REAR_RIGHT_OUTER', 'APOLLO ENDURACE', '295/90 R20', 8.0, 60, 'GOOD'],
            [2, 'REAR_RIGHT_INNER', 'APOLLO ENDURACE', '295/90 R20', 7.5, 55, 'AVERAGE'],
            [3, 'AXLE3_LO', 'JK TYRE JETSTEEL', '295/90 R20', 9.0, 65, 'GOOD'],
            [3, 'AXLE3_LI', 'JK TYRE JETSTEEL', '295/90 R20', 8.5, 60, 'GOOD'],
            [3, 'AXLE3_RO', 'JK TYRE JETSTEEL', '295/90 R20', 8.5, 60, 'GOOD'],
            [3, 'AXLE3_RI', 'JK TYRE JETSTEEL', '295/90 R20', 8.0, 55, 'AVERAGE'],
            [3, 'SPARE', 'MRF SUPER LUG', '295/90 R20', 12.0, 85, 'GOOD'],
        ];

        foreach ($tyrePositions as $tp) {
            InspectionTyre::updateOrCreate(
                ['inspection_case_id' => $caseHcv->id, 'position' => $tp[1]],
                [
                    'id' => (string) Str::uuid(),
                    'axle_number' => $tp[0],
                    'brand' => $tp[2],
                    'size_spec' => $tp[3],
                    'tread_depth_mm' => $tp[4],
                    'remaining_life_pct' => $tp[5],
                    'condition' => $tp[6],
                    'remarks' => 'Normal highway wear pattern observed.',
                ]
            );
        }

        // ---------------------------------------------------------
        // 11. Professional Valuation & Valuer Override
        // ---------------------------------------------------------
        Valuation::updateOrCreate(
            ['inspection_case_id' => $caseHcv->id],
            [
                'id' => (string) Str::uuid(),
                'valuation_methodology' => 'DEPRECIATED_MARKET_VALUE',
                'ex_showroom_price_paise' => 385000000, // ₹38,50,000.00
                'base_depreciated_value_paise' => 198275000, // ₹19,82,750.00
                'age_in_months' => 53,
                'age_depreciation_pct' => 48.50,
                'odometer_adjustment_paise' => 8500000, // -₹85,000.00
                'condition_deduction_paise' => 5000000, // -₹50,000.00
                'estimated_repair_refurbishment_paise' => 10500000, // -₹1,05,000.00
                'proposed_fair_market_value_paise' => 174275000, // ₹17,42,750.00
                'proposed_distress_value_paise' => 148133700, // ₹14,81,337.00
                'valuer_override_applied' => true,
                'override_fair_market_value_paise' => 170000000, // ₹17,00,000.00
                'override_distress_value_paise' => 145000000, // ₹14,50,000.00
                'override_justification' => 'Adjusted downwards by ₹42,750 based on local Pune commercial transport market demand softening and upcoming fitness renewal cost.',
                'valuer_id' => $valuerUser->id,
                'certified_valuer_remarks' => 'Vehicle is roadworthy and structurally sound. Suitable for hypothecation up to 75% of fair market value.',
                'approved_at' => now()->subHours(6),
            ]
        );

        // ---------------------------------------------------------
        // 12. Immutable Frozen Report Snapshot v1.0
        // ---------------------------------------------------------
        $snapshotPayload = [
            'report_id' => 'RPT-2026-MH12-8912',
            'version' => '1.0',
            'generated_at' => now()->subHours(6)->toIso8601String(),
            'vehicle' => $vehHcv->toArray(),
            'inspection' => $caseHcv->toArray(),
            'valuation' => [
                'ex_showroom_inr' => 3850000,
                'approved_fair_market_value_inr' => 1700000,
                'approved_distress_value_inr' => 1450000,
                'valuer_name' => $valuerUser->name,
            ],
            'is_mock_watermarked' => true,
        ];

        ReportSnapshot::updateOrCreate(
            ['inspection_case_id' => $caseHcv->id, 'version' => '1.0'],
            [
                'id' => (string) Str::uuid(),
                'verification_token' => 'rpt_98a76f54c3b2e1d09876543210abcdef',
                'snapshot_data' => $snapshotPayload,
                'sha256_checksum' => hash('sha256', json_encode($snapshotPayload)),
                'page_count' => 9,
                'is_mock_watermarked' => true,
                'rendered_at' => now()->subHours(6),
            ]
        );

        // ---------------------------------------------------------
        // 13. Audit Log Entry
        // ---------------------------------------------------------
        AuditLog::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $orgSpeedcheck->id,
            'user_id' => $valuerUser->id,
            'action' => 'VALUATION_APPROVED',
            'entity_type' => 'inspection_cases',
            'entity_id' => $caseHcv->id,
            'old_values' => ['status' => 'UNDER_REVIEW'],
            'new_values' => ['status' => 'APPROVED', 'fmv_inr' => 1700000],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'VahanCheck-Web/1.0',
            'created_at' => now()->subHours(6),
        ]);
    }
}
