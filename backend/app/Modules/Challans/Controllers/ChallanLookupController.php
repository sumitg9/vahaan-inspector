<?php

namespace App\Modules\Challans\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\VehicleIntel\Services\VehicleIntelligenceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChallanLookupController extends Controller
{
    protected VehicleIntelligenceService $service;

    public function __construct(VehicleIntelligenceService $service)
    {
        $this->service = $service;
    }

    /**
     * Retrieve traffic violations & eChallans for a vehicle.
     */
    public function lookup(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => ['required', 'string', 'min:6', 'max:15', 'regex:/^[A-Z0-9]+$/i'],
            'force_fresh' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors()->toArray());
        }

        $user = $request->user();
        $orgId = $user ? $user->organization_id : null;
        $userId = $user ? $user->id : null;
        $regNo = $request->input('registration_number');
        $forceFresh = $request->boolean('force_fresh', false);

        try {
            $result = $this->service->lookupChallans($regNo, $orgId, $userId, $forceFresh);
            return $this->success($result, 'Traffic challans retrieved successfully');
        } catch (\App\Modules\Providers\Exceptions\ProviderRateLimitException $e) {
            return $this->error($e->getMessage(), 429);
        } catch (\App\Modules\Providers\Exceptions\ProviderTimeoutException $e) {
            return $this->error($e->getMessage(), 504);
        } catch (\App\Modules\Providers\Exceptions\ProviderException $e) {
            return $this->error($e->getMessage(), $e->getHttpStatusCode());
        } catch (\Throwable $e) {
            return $this->error('Failed to retrieve traffic violations: ' . $e->getMessage(), 502);
        }
    }

    /**
     * Force refresh live violations from enforcement registry.
     */
    public function refresh(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'registration_number' => ['required', 'string', 'min:6', 'max:15', 'regex:/^[A-Z0-9]+$/i'],
        ]);

        if ($validator->fails()) {
            return $this->error($validator->errors()->first(), 422, $validator->errors()->toArray());
        }

        $user = $request->user();
        $orgId = $user ? $user->organization_id : null;
        $userId = $user ? $user->id : null;
        $regNo = $request->input('registration_number');

        try {
            $result = $this->service->lookupChallans($regNo, $orgId, $userId, true);
            return $this->success($result, 'Traffic challans refreshed from enforcement registry');
        } catch (\Throwable $e) {
            return $this->error('Failed to refresh challans: ' . $e->getMessage(), 502);
        }
    }
}
