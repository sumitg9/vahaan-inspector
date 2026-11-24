<?php

namespace Database\Factories;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'organization_id' => Organization::factory(),
            'name' => 'Inspector ' . Str::random(4),
            'email' => strtolower(Str::random(8)) . '@agency.com',
            'phone' => '+9198' . rand(10000000, 99999999),
            'password_hash' => Hash::make('SecretPass@2026'),
            'role' => 'INSPECTOR',
            'is_active' => true,
        ];
    }
}
