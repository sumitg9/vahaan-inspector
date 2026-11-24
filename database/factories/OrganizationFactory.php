<?php

namespace Database\Factories;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrganizationFactory extends Factory
{
    protected $model = Organization::class;

    public function definition(): array
    {
        $name = 'Valuation Agency ' . Str::random(5);
        return [
            'id' => (string) Str::uuid(),
            'name' => $name,
            'legal_name' => $name . ' Private Limited',
            'slug' => Str::slug($name),
            'email' => strtolower(Str::random(8)) . '@agency.com',
            'phone' => '+9198' . rand(10000000, 99999999),
            'status' => 'ACTIVE',
        ];
    }
}
