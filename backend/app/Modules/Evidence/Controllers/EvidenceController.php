<?php

namespace App\Modules\Evidence\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Evidence\Services\EvidenceStorageService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class EvidenceController extends Controller
{
    protected EvidenceStorageService $evidenceService;

    public function __construct(EvidenceStorageService $evidenceService)
    {
        $this->evidenceService = $evidenceService;
    }

    /**
     * Issue pre-signed S3 upload URL with metadata constraints.
     */
    public function presign(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'category' => 'required|string|max:50',
            'mime_type' => 'required|string|max:50',
            'file_size_bytes' => 'required|integer|min:1',
            'sha256_hash' => 'required|string|size:64',
        ]);

        try {
            $presigned = $this->evidenceService->generatePresignedUpload(
                $id,
                $validated['category'],
                $validated['mime_type'],
                $validated['file_size_bytes'],
                $validated['sha256_hash'],
                $orgId
            );

            return $this->success($presigned, 'Pre-signed S3 upload URL generated');
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Store and verify an evidence artifact record after upload.
     */
    public function store(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'category' => 'required|string|max:50',
            's3_key' => 'required|string',
            'file_size_bytes' => 'required|integer|min:1',
            'mime_type' => 'required|string|max:50',
            'sha256_hash' => 'required|string|size:64',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'captured_at' => 'nullable|date',
            'caption' => 'nullable|string',
            'is_damage_proof' => 'nullable|boolean',
        ]);

        $validated['inspection_case_id'] = $id;
        $validated['inspector_id'] = $user?->id ?? 'user-inspector-default';

        try {
            $evidence = $this->evidenceService->storeEvidence($validated, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'EVIDENCE_UPLOADED',
                    'inspection_evidences',
                    $evidence['id'] ?? null,
                    [],
                    [
                        'case_id' => $id,
                        'category' => $evidence['category'],
                        'sha256_hash' => $evidence['sha256_hash'],
                    ],
                    $user?->id
                );
            }

            return $this->success($evidence, 'Evidence artifact recorded successfully', 201);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * List all evidence artifacts for a specific inspection case.
     */
    public function index(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $evidences = $this->evidenceService->getEvidencesByCase($id, $orgId);

        return $this->success($evidences, 'Evidence artifacts retrieved');
    }
}
