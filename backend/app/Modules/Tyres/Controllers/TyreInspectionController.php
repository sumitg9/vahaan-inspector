<?php

namespace App\Modules\Tyres\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Tyres\Services\AxleLayoutService;
use App\Modules\Tyres\Services\TyreInspectionService;
use Illuminate\Http\Request;
use InvalidArgumentException;

class TyreInspectionController extends Controller
{
    protected TyreInspectionService $tyreService;
    protected AxleLayoutService $layoutService;

    public function __construct(
        TyreInspectionService $tyreService,
        AxleLayoutService $layoutService
    ) {
        $this->tyreService = $tyreService;
        $this->layoutService = $layoutService;
    }

    /**
     * List all configurable vehicle axle layouts.
     */
    public function layouts(Request $request)
    {
        $category = $request->query('vehicle_category');
        if ($category) {
            $layout = $this->layoutService->detectLayoutForCategory($category);
            return $this->success($layout, 'Suggested axle layout retrieved');
        }

        $all = $this->layoutService->getConfigurations();
        return $this->success($all, 'Vehicle axle layouts retrieved');
    }

    /**
     * Get recorded tyre inspection assessments for an inspection case.
     */
    public function index(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $result = $this->tyreService->getTyresByCase($id, $orgId);

        return $this->success($result, 'Tyre assessment records retrieved');
    }

    /**
     * Log or batch-update tyre assessment records for an inspection case.
     */
    public function store(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'tyres' => 'required|array|min:1',
            'tyres.*.axle_number' => 'nullable|integer|min:0',
            'tyres.*.position' => 'required|string|max:50',
            'tyres.*.brand' => 'required|string|max:100',
            'tyres.*.size_spec' => 'nullable|string|max:50',
            'tyres.*.tread_depth_mm' => 'required|numeric|min:0|max:35',
            'tyres.*.remaining_life_pct' => 'nullable|integer|min:0|max:100',
            'tyres.*.condition' => 'nullable|string|max:50',
            'tyres.*.evidence_id' => 'nullable|uuid',
            'tyres.*.remarks' => 'nullable|string',
        ]);

        try {
            $saved = $this->tyreService->recordTyreAssessment($id, $validated['tyres'], $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'TYRES_RECORDED',
                    'inspection_tyres',
                    $id,
                    [],
                    [
                        'recorded_count' => $saved['recorded_count'],
                        'worn_out_count' => $saved['metrics']['worn_out_count'],
                        'critical_safety_alert' => $saved['metrics']['critical_safety_alert'],
                    ],
                    $user?->id
                );
            }

            return $this->success($saved, 'Tyre assessments recorded successfully', 201);
        } catch (InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
