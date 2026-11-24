<?php

namespace App\Modules\Evidence\Controllers;

use App\Http\Controllers\Controller;
use App\Models\InspectionCase;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Evidence\Services\DocumentComparisonService;
use App\Modules\Evidence\Services\DocumentOcrServiceInterface;
use App\Modules\Evidence\Services\MockDocumentOcrService;
use Illuminate\Http\Request;

class DocumentOcrController extends Controller
{
    protected DocumentOcrServiceInterface $ocrService;
    protected DocumentComparisonService $comparisonService;

    public function __construct(
        ?DocumentOcrServiceInterface $ocrService = null,
        ?DocumentComparisonService $comparisonService = null
    ) {
        $this->ocrService = $ocrService ?? new MockDocumentOcrService();
        $this->comparisonService = $comparisonService ?? new DocumentComparisonService();
    }

    /**
     * Process OCR on an uploaded vehicle document.
     */
    public function processOcr(Request $request, string $id)
    {
        $validated = $request->validate([
            'document_type' => 'required|string|in:RC_SMART_CARD,INSURANCE_POLICY,PUC_CERTIFICATE,FITNESS_CERTIFICATE,PERMIT',
            's3_key' => 'required|string',
            'scenario' => 'nullable|string|in:standard,discrepancy,expired',
        ]);

        $ocrResult = $this->ocrService->extractDocumentData(
            $validated['document_type'],
            $validated['s3_key'],
            ['scenario' => $validated['scenario'] ?? 'standard']
        );

        return $this->success($ocrResult, 'Document OCR processed successfully');
    }

    /**
     * Compare OCR-extracted document data with canonical VAHAN registry record.
     */
    public function compare(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'extracted_fields' => 'required|array',
            'canonical_profile' => 'nullable|array',
        ]);

        $canonical = $validated['canonical_profile'] ?? null;
        if (!$canonical && class_exists(InspectionCase::class)) {
            try {
                $case = InspectionCase::with('vehicleProfile')->where('id', $id)->first();
                if ($case && $case->vehicleProfile) {
                    $canonical = $case->vehicleProfile->toArray();
                }
            } catch (\Throwable $e) {}
        }

        if (!$canonical) {
            // Standard fallback vehicle profile for MH12AB1234
            $canonical = [
                'registration_number' => 'MH12AB1234',
                'chassis_number' => 'MAT621045K8Z12345',
                'vin_masked' => 'MAT621045K8Z12345',
                'engine_number' => '497TC92XYZ56789',
                'engine_number_masked' => '497TC92XYZ56789',
                'owner_name' => 'M/S LOGISTICS INDIA PRIVATE LIMITED',
                'owner_name_masked' => 'M/S LOGISTICS INDIA PRIVATE LIMITED',
                'rc_status' => 'ACTIVE',
            ];
        }

        $comparisonResult = $this->comparisonService->compareDocumentWithRegistry(
            $validated['extracted_fields'],
            $canonical
        );

        if (class_exists(AuditService::class)) {
            AuditService::log(
                $orgId,
                'DOCUMENT_OCR_VERIFIED',
                'inspection_cases',
                $id,
                [],
                [
                    'match_percentage' => $comparisonResult['overall_match_percentage'],
                    'status' => $comparisonResult['status'],
                    'discrepancies_count' => count($comparisonResult['discrepancies']),
                ],
                $user?->id
            );
        }

        return $this->success($comparisonResult, 'Document registry comparison evaluated');
    }
}
