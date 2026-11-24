<?php

namespace App\Modules\VehicleIntel\Controllers;

use App\Http\Controllers\Controller;
use App\Models\VehicleProfile;
use App\Modules\VehicleIntel\Services\VehicleIntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class VehicleLookupController extends Controller
{
    protected VehicleIntelligenceService $service;

    public function __construct(VehicleIntelligenceService $service)
    {
        $this->service = $service;
    }

    /**
     * Query and verify vehicle registration details from VAHAN registry.
     * Enforces DPDP Act 2023 consent requirement.
     */
    public function lookup(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => ['required', 'string', 'min:6', 'max:15', 'regex:/^[A-Z0-9]+$/i'],
            'consent' => ['required', 'boolean'],
            'force_fresh' => ['nullable', 'boolean'],
        ], [
            'consent.required' => 'DPDP Act 2023: Customer / borrower consent is mandatory before registry verification.',
            'registration_number.regex' => 'Registration number must contain alphanumeric characters only.',
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors()->toArray());
        }

        if (!$request->boolean('consent')) {
            return $this->error(
                'DPDP Act 2023 compliance failure: Verification cannot proceed without affirmative customer consent.',
                403
            );
        }

        $user = $request->user();
        $orgId = $user ? $user->organization_id : null;
        $userId = $user ? $user->id : null;
        $regNo = $request->input('registration_number');
        $forceFresh = $request->boolean('force_fresh', false);

        try {
            $result = $this->service->lookupVehicle($regNo, $orgId, $userId, $forceFresh);
            return $this->success($result, 'Vehicle registry verified successfully');
        } catch (\App\Modules\Providers\Exceptions\VehicleNotFoundException $e) {
            return $this->error($e->getMessage(), 404);
        } catch (\App\Modules\Providers\Exceptions\ProviderRateLimitException $e) {
            return $this->error($e->getMessage(), 429);
        } catch (\App\Modules\Providers\Exceptions\ProviderTimeoutException $e) {
            return $this->error($e->getMessage(), 504);
        } catch (\App\Modules\Providers\Exceptions\ProviderException $e) {
            return $this->error($e->getMessage(), $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->error('Failed to complete vehicle registry verification: ' . $e->getMessage(), 502);
        }
    }

    /**
     * Perform an integrated, combined VAHAN Registry and Traffic Challan verification.
     */
    public function verifyCombined(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => ['required', 'string', 'min:6', 'max:15', 'regex:/^[A-Z0-9]+$/i'],
            'consent' => ['required', 'boolean'],
            'force_fresh' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors()->toArray());
        }

        if (!$request->boolean('consent')) {
            return $this->error(
                'DPDP Act 2023 compliance failure: Combined verification cannot proceed without affirmative customer consent.',
                403
            );
        }

        $user = $request->user();
        $orgId = $user ? $user->organization_id : null;
        $userId = $user ? $user->id : null;
        $regNo = $request->input('registration_number');
        $forceFresh = $request->boolean('force_fresh', false);

        try {
            $result = $this->service->verifyCombined($regNo, $orgId, $userId, $forceFresh);
            return $this->success($result, 'Combined vehicle verification completed successfully');
        } catch (\App\Modules\Providers\Exceptions\VehicleNotFoundException $e) {
            return $this->error($e->getMessage(), 404);
        } catch (\App\Modules\Providers\Exceptions\ProviderRateLimitException $e) {
            return $this->error($e->getMessage(), 429);
        } catch (\App\Modules\Providers\Exceptions\ProviderTimeoutException $e) {
            return $this->error($e->getMessage(), 504);
        } catch (\App\Modules\Providers\Exceptions\ProviderException $e) {
            return $this->error($e->getMessage(), $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->error('Failed to complete combined verification: ' . $e->getMessage(), 502);
        }
    }

    /**
     * Check vehicle status, cache presence, and credit costs.
     */
    public function checkStatus(Request $request): JsonResponse
    {
        $reg = $request->query('registration_number');
        if (!$reg) {
            return $this->error('Registration number is required', 422);
        }

        $status = $this->service->checkVehicleStatus($reg);
        return $this->success($status);
    }

    /**
     * Get paginated vehicle profiles list.
     */
    public function index(Request $request): JsonResponse
    {
        $profiles = $this->service->getVehicleProfiles($request->all(), (int) $request->get('per_page', 15));
        return $this->success($profiles);
    }

    /**
     * Get specific vehicle profile by ID.
     */
    public function show(string $id): JsonResponse
    {
        $profile = $this->service->getVehicleProfileById($id);
        if (!$profile) {
            return $this->error('Vehicle profile not found', 404);
        }
        return $this->success($profile);
    }

    /**
     * Force fresh refresh of vehicle RC from registry.
     */
    public function refresh(Request $request, string $id): JsonResponse
    {
        $profile = VehicleProfile::find($id);
        if (!$profile) {
            return $this->error('Vehicle profile not found', 404);
        }

        $user = $request->user();
        $orgId = $user ? $user->organization_id : null;
        $userId = $user ? $user->id : null;

        try {
            $result = $this->service->lookupVehicle($profile->registration_number, $orgId, $userId, true);
            return $this->success($result, 'Vehicle RC refreshed from registry');
        } catch (\Throwable $e) {
            return $this->error('Failed to refresh vehicle RC: ' . $e->getMessage(), 502);
        }
    }
}
