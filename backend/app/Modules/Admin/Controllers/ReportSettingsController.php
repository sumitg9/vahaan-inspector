<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;

class ReportSettingsController extends Controller
{
    /**
     * Get report branding, watermark, and disclaimer settings.
     */
    public function show(Request $request)
    {
        $user = $request->user();
        $orgId = $request->query('organization_id') ?? $user->organization_id;
        $org = $orgId ? Organization::find($orgId) : null;

        $reportSettings = $org?->settings['report_settings'] ?? [
            'header_title' => 'COMPREHENSIVE MOTOR VEHICLE INSPECTION & VALUATION DOSSIER',
            'footer_text' => 'CONFIDENTIAL & PRIVILEGED VALUATION REPORT — PREPARED FOR BANKING & FINANCING INSTITUTIONS',
            'logo_url' => $org?->logo_url ?? 'https://vahancheck.io/branding/logo-dark.png',
            'report_disclaimer' => $org?->report_disclaimer ?? 'This inspection dossier and certified valuation report are issued based on visual inspection, mechanical condition appraisal, Central Motor Vehicles Rules 1989/1995 compliance checks, and algorithmic depreciation curves. No dismantling or destructive testing was conducted.',
            'signature_blocks' => [
                'field_inspector' => true,
                'qc_manager' => true,
                'certified_valuer' => true,
            ],
            'monetary_currency' => 'INR',
            'watermark_mock_policy' => 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE',
            'mock_watermark_locked' => true, // Invariant 2: Cannot be turned off when using mock/demo data
        ];

        return $this->success([
            'organization_id' => $orgId,
            'organization_name' => $org?->name ?? 'Default Organization',
            'report_settings' => $reportSettings,
        ]);
    }

    /**
     * Update report settings.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.report_settings') && !$user->hasPermission('org.update')) {
            return $this->error('Access denied to modify report settings.', 403);
        }

        $validated = $request->validate([
            'header_title' => 'nullable|string|max:255',
            'footer_text' => 'nullable|string|max:255',
            'logo_url' => 'nullable|url',
            'report_disclaimer' => 'nullable|string',
            'signature_blocks' => 'nullable|array',
            'organization_id' => 'nullable|uuid|exists:organizations,id',
        ]);

        $orgId = $validated['organization_id'] ?? $user->organization_id;
        $org = Organization::findOrFail($orgId);

        $currentSettings = $org->settings ?? [];
        $currentReport = $currentSettings['report_settings'] ?? [];

        // Invariant 2 & AC-REP-03: Ensure watermark mock policy remains immutable
        $validated['watermark_mock_policy'] = 'DEMONSTRATION DATA — NOT FOR OFFICIAL USE';
        $validated['mock_watermark_locked'] = true;

        $newReport = array_merge($currentReport, $validated);
        $currentSettings['report_settings'] = $newReport;
        
        if (isset($validated['logo_url'])) {
            $org->logo_url = $validated['logo_url'];
        }
        if (isset($validated['report_disclaimer'])) {
            $org->report_disclaimer = $validated['report_disclaimer'];
        }

        $org->settings = $currentSettings;
        $org->save();

        AuditService::log(
            $org->id,
            $user->id,
            'REPORT_SETTINGS_UPDATED',
            'organizations',
            $org->id,
            $currentReport,
            $newReport,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($newReport, 'Report settings and branding updated successfully.');
    }
}
