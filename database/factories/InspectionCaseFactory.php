<?php

namespace Database\Factories;

use App\Models\InspectionCase;
use App\Models\Organization;
use App\Models\InspectionTemplate;
use App\Models\VehicleProfile;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class InspectionCaseFactory extends Factory
{
    protected $model = InspectionCase::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'organization_id' => Organization::factory(),
            'vehicle_profile_id' => (string) Str::uuid(),
            'template_id' => (string) Str::uuid(),
            'status' => 'DRAFT',
            'priority' => 'MEDIUM',
            'inspection_address' => 'Auto Yard, Chakan, Pune',
        ];
    }
}
