<?php

namespace App\Modules\Organizations\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;

class OrganizationController extends Controller
{
    /**
     * Get current tenant organization profile.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $org = $user->organization;

        if (!$org) {
            return $this->error('Organization not found', 404);
        }

        return $this->success([
            'id' => $org->id,
            'name' => $org->name,
            'legal_name' => $org->legal_name,
            'slug' => $org->slug,
            'email' => $org->email,
            'phone' => $org->phone,
            'gst_number' => $org->gst_number,
            'pan_number' => $org->pan_number,
            'logo_url' => $org->logo_url,
            'report_disclaimer' => $org->report_disclaimer,
            'status' => $org->status,
            'created_at' => $org->created_at->toISOString(),
        ]);
    }

    /**
     * Update tenant organization profile (Admin only).
     */
    public function update(Request $request)
    {
        $user = $request->user();
        $org = $user->organization;

        if (!$org) {
            return $this->error('Organization not found', 404);
        }

        $validated = $request->validate([
            'legal_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:20',
            'report_disclaimer' => 'nullable|string',
            'logo_url' => 'nullable|url',
        ]);

        $oldValues = $org->only(array_keys($validated));
        $org->update($validated);

        AuditService::log(
            $org->id,
            $user->id,
            'ORGANIZATION_UPDATED',
            'organizations',
            $org->id,
            $oldValues,
            $validated,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($org->fresh(), 'Organization settings updated successfully');
    }
}
