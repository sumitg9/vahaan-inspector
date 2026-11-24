<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthenticationTest extends TestCase
{
    /**
     * Test successful login with correct credentials.
     */
    public function test_user_can_login_with_valid_credentials(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@speedcheck.in',
            'password' => 'SecretPass@2026',
            'device_name' => 'Chrome Web Portal',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'token',
                'token_type',
                'user' => [
                    'id',
                    'name',
                    'email',
                    'role',
                    'organization' => ['id', 'name', 'slug'],
                    'permissions',
                ],
            ],
        ]);
    }

    /**
     * Test login failure with incorrect password returns 401.
     */
    public function test_user_cannot_login_with_invalid_password(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'admin@speedcheck.in',
            'password' => 'WrongPassword#999',
        ]);

        $response->assertStatus(401);
        $response->assertJson([
            'status' => 401,
            'title' => 'Invalid Credentials',
        ]);
    }

    /**
     * Test that MFA challenge endpoint generates a challenge token.
     */
    public function test_mfa_challenge_generation(): void
    {
        $response = $this->postJson('/api/v1/auth/mfa/challenge', [
            'email' => 'valuer.sharma@speedcheck.in',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'data' => [
                'mfa_required',
                'challenge_token',
                'delivery_channel',
                'expires_in_seconds',
            ],
        ]);
    }
}
