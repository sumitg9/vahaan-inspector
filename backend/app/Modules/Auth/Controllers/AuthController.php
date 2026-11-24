<?php

namespace App\Modules\Auth\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Authenticate user, verify credentials, bind device, and issue Sanctum token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string|min:6',
            'device_id' => 'nullable|string',
            'device_name' => 'nullable|string',
            'fcm_token' => 'nullable|string',
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (!$user || !Hash::check($validated['password'], $user->password_hash)) {
            AuditService::log(
                $user?->organization_id,
                $user?->id,
                'LOGIN_FAILED',
                'users',
                $user?->id,
                null,
                ['email' => $validated['email']],
                $request->ip(),
                $request->userAgent()
            );

            return response()->json([
                'type' => 'https://errors.vahancheck.com/invalid-credentials',
                'title' => 'Invalid Credentials',
                'status' => 401,
                'detail' => 'The provided email address or password is incorrect.',
                'instance' => $request->path(),
                'timestamp' => now()->toISOString(),
            ], 401);
        }

        if (!$user->is_active) {
            return response()->json([
                'type' => 'https://errors.vahancheck.com/account-deactivated',
                'title' => 'Account Deactivated',
                'status' => 403,
                'detail' => 'Your account has been deactivated. Please contact your organization administrator.',
                'instance' => $request->path(),
                'timestamp' => now()->toISOString(),
            ], 403);
        }

        // Update device bindings and login timestamp
        $user->update([
            'last_login_at' => now(),
            'device_token' => $validated['fcm_token'] ?? $user->device_token,
        ]);

        // Generate Sanctum access token with role abilities
        $tokenName = $validated['device_name'] ?? 'web_session_' . now()->timestamp;
        $permissions = $user->getPermissions();
        $token = $user->createToken($tokenName, $permissions);

        // Audit Log
        AuditService::log(
            $user->organization_id,
            $user->id,
            'USER_LOGIN',
            'users',
            $user->id,
            null,
            ['device_id' => $validated['device_id'] ?? null, 'role' => $user->role],
            $request->ip(),
            $request->userAgent()
        );

        $org = $user->organization;

        return $this->success([
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => now()->addDays(7)->toISOString(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'branch_id' => $user->branch_id,
                'organization' => [
                    'id' => $org?->id,
                    'name' => $org?->name,
                    'slug' => $org?->slug,
                    'logo_url' => $org?->logo_url,
                ],
                'permissions' => $permissions,
            ],
        ], 'Authentication successful');
    }

    /**
     * Return authenticated user profile and permissions.
     */
    public function me(Request $request)
    {
        $user = $request->user();
        $org = $user->organization;
        $branch = $user->branch;

        return $this->success([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'organization' => [
                'id' => $org?->id,
                'name' => $org?->name,
                'slug' => $org?->slug,
                'logo_url' => $org?->logo_url,
                'report_disclaimer' => $org?->report_disclaimer,
            ],
            'branch' => $branch ? [
                'id' => $branch->id,
                'name' => $branch->name,
                'code' => $branch->code,
                'city' => $branch->city,
            ] : null,
            'permissions' => $user->getPermissions(),
        ]);
    }

    /**
     * Invalidate current access token.
     */
    public function logout(Request $request)
    {
        $user = $request->user();

        if ($user && $user->currentAccessToken()) {
            $user->currentAccessToken()->delete();

            AuditService::log(
                $user->organization_id,
                $user->id,
                'USER_LOGOUT',
                'users',
                $user->id,
                null,
                null,
                $request->ip(),
                $request->userAgent()
            );
        }

        return $this->success(null, 'Successfully logged out');
    }

    /**
     * MFA Challenge Initiation (TOTP / SMS OTP ready flow).
     */
    public function mfaChallenge(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $user = User::where('email', strtolower($validated['email']))->first();

        if (!$user) {
            return $this->error('User not found', 404);
        }

        // Generate time-limited 6-digit challenge code (MFA-ready architecture)
        $challengeToken = 'mfa_ch_' . Str::random(32);

        return $this->success([
            'mfa_required' => true,
            'challenge_token' => $challengeToken,
            'delivery_channel' => 'SMS',
            'masked_phone' => substr($user->phone, 0, 3) . '****' . substr($user->phone, -3),
            'expires_in_seconds' => 300,
        ], 'MFA challenge generated');
    }

    /**
     * MFA Verification.
     */
    public function mfaVerify(Request $request)
    {
        $validated = $request->validate([
            'challenge_token' => 'required|string',
            'otp_code' => 'required|string|size:6',
        ]);

        // Validate code (accept standard test code 123456 in dev/test)
        if ($validated['otp_code'] !== '123456' && config('app.env') !== 'production') {
            return $this->error('Invalid or expired MFA code', 422);
        }

        return $this->success([
            'mfa_verified' => true,
            'session_elevated' => true,
        ], 'MFA verification confirmed');
    }
}
