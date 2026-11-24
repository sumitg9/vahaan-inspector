<?php

namespace App\Modules\Admin\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;

class FeatureFlagController extends Controller
{
    /**
     * System-wide default feature flags.
     */
    protected static array $globalFlags = [
        'enable_live_parivahan_lookup' => [
            'key' => 'enable_live_parivahan_lookup',
            'name' => 'Live Parivahan API Direct Ingestion',
            'description' => 'Route VAHAN queries directly through authorized live government/provider endpoints.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enable_ocr_comparison' => [
            'key' => 'enable_ocr_comparison',
            'name' => 'Automated Document OCR & Registry Comparison',
            'description' => 'Perform OCR text extraction on uploaded RC, Insurance, and Fitness smart cards and compare against VAHAN records.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enforce_cmv_rule_95_tyres' => [
            'key' => 'enforce_cmv_rule_95_tyres',
            'name' => 'Enforce CMV Rule 95 Tyre Safety Threshold',
            'description' => 'Strictly force tyre condition to WORN_OUT and remaining life <= 15% when measured tread depth < 1.6 mm.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enable_distress_valuation_override' => [
            'key' => 'enable_distress_valuation_override',
            'name' => 'Certified Valuer Distress Valuation Override',
            'description' => 'Allow authorized Valuers to override algorithmic valuation with mandatory >= 30 chars written justification.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enable_public_qr_verification' => [
            'key' => 'enable_public_qr_verification',
            'name' => 'Public Cryptographic QR Verification Portal',
            'description' => 'Enable instant public verification of approved report dossier SHA-256 seal via QR code scan.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enable_instant_pdf_download' => [
            'key' => 'enable_instant_pdf_download',
            'name' => 'Instant A4 PDF Dossier Rendering',
            'description' => 'Generate pixel-perfect A4 print dossier with dynamic pagination and digital signature seals.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
        'enforce_dpdp_strict_masking' => [
            'key' => 'enforce_dpdp_strict_masking',
            'name' => 'DPDP Act 2023 Strict PII Name Masking',
            'description' => 'Mandatory masking of registered owner names in all non-consented views and PDF report sections.',
            'enabled' => true,
            'scope' => 'GLOBAL',
        ],
    ];

    /**
     * Get feature flags (global and tenant-scoped).
     */
    public function index(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.feature_flags')) {
            return $this->error('Access denied to feature flags governance.', 403);
        }

        $orgId = $request->query('organization_id') ?? $user->organization_id;
        $org = $orgId ? Organization::find($orgId) : null;
        $orgFlags = $org?->settings['feature_flags'] ?? [];

        $flags = [];
        foreach (self::$globalFlags as $key => $meta) {
            $flag = $meta;
            if (isset($orgFlags[$key])) {
                $flag['enabled'] = (bool) $orgFlags[$key];
                $flag['scope'] = 'TENANT_OVERRIDE';
            }
            $flags[] = $flag;
        }

        return $this->success([
            'organization_id' => $orgId,
            'organization_name' => $org?->name ?? 'Global Platform Defaults',
            'flags' => $flags,
        ]);
    }

    /**
     * Toggle or update a feature flag.
     */
    public function update(Request $request)
    {
        $user = $request->user();
        if (!$user->isSuperAdmin() && !$user->hasPermission('admin.feature_flags')) {
            return $this->error('Access denied to modify feature flags.', 403);
        }

        $validated = $request->validate([
            'key' => 'required|string',
            'enabled' => 'required|boolean',
            'organization_id' => 'nullable|uuid|exists:organizations,id',
        ]);

        $key = $validated['key'];
        if (!isset(self::$globalFlags[$key])) {
            return $this->error("Feature flag '{$key}' does not exist.", 404);
        }

        if (!empty($validated['organization_id'])) {
            $org = Organization::findOrFail($validated['organization_id']);
            $settings = $org->settings ?? [];
            $settings['feature_flags'][$key] = $validated['enabled'];
            $org->settings = $settings;
            $org->save();

            AuditService::log(
                $org->id,
                $user->id,
                'TENANT_FEATURE_FLAG_TOGGLED',
                'feature_flags',
                $key,
                null,
                ['key' => $key, 'enabled' => $validated['enabled'], 'org_id' => $org->id],
                $request->ip(),
                $request->userAgent()
            );

            return $this->success([
                'key' => $key,
                'enabled' => $validated['enabled'],
                'scope' => 'TENANT_OVERRIDE',
                'organization_id' => $org->id,
            ], "Feature flag '{$key}' updated for tenant '{$org->name}'.");
        } else {
            // Global toggle (Super Admin only)
            if (!$user->isSuperAdmin()) {
                return $this->error('Only Super Admins can update global feature flags.', 403);
            }

            self::$globalFlags[$key]['enabled'] = $validated['enabled'];

            AuditService::log(
                null,
                $user->id,
                'GLOBAL_FEATURE_FLAG_TOGGLED',
                'feature_flags',
                $key,
                null,
                ['key' => $key, 'enabled' => $validated['enabled']],
                $request->ip(),
                $request->userAgent()
            );

            return $this->success([
                'key' => $key,
                'enabled' => $validated['enabled'],
                'scope' => 'GLOBAL',
            ], "Global feature flag '{$key}' updated.");
        }
    }
}
