<?php

namespace App\Modules\Inspections\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Inspections\Exceptions\InspectionException;
use App\Modules\Inspections\Exceptions\InvalidStateTransitionException;
use App\Modules\Inspections\Exceptions\MandatoryCorrectionNotesMissingException;
use App\Modules\Inspections\Exceptions\UnauthorizedTransitionException;
use App\Modules\Inspections\Services\InspectionCaseStateMachine;
use App\Modules\Inspections\Services\InspectionService;
use Illuminate\Http\Request;

class InspectionController extends Controller
{
    protected InspectionService $inspectionService;

    public function __construct(InspectionService $inspectionService)
    {
        $this->inspectionService = $inspectionService;
    }

    /**
     * List all inspection cases for current tenant with status and priority filtering.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $filters = [
            'status' => $request->query('status', 'ALL'),
            'priority' => $request->query('priority'),
            'search' => $request->query('search'),
            'per_page' => (int) $request->query('per_page', 15),
        ];

        $cases = $this->inspectionService->getCases($orgId, $filters);

        return $this->success($cases, 'Inspection cases retrieved successfully');
    }

    /**
     * Create a new inspection case dossier.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'registration_number' => 'required|string|max:20',
            'vehicle_model' => 'nullable|string|max:255',
            'maker_name' => 'nullable|string|max:100',
            'model_name' => 'nullable|string|max:100',
            'vehicle_category' => 'nullable|string|in:COMMERCIAL_HEAVY,COMMERCIAL_LIGHT,PASSENGER_CAR,TWO_WHEELER,THREE_WHEELER,AGRICULTURAL,CONSTRUCTION',
            'client_id' => 'nullable|uuid',
            'bank_branch_id' => 'nullable|uuid',
            'branch_id' => 'nullable|uuid',
            'loan_reference_number' => 'nullable|string|max:100',
            'assigned_inspector_id' => 'nullable|uuid',
            'priority' => 'nullable|string|in:NORMAL,HIGH,URGENT',
            'scheduled_at' => 'nullable|date',
            'inspection_address' => 'nullable|string',
        ]);

        try {
            $case = $this->inspectionService->createCase($validated, $orgId, $user?->id);

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'INSPECTION_CASE_CREATED',
                    'inspection_cases',
                    $case['id'] ?? null,
                    [],
                    ['case_number' => $case['case_number'] ?? null, 'status' => $case['status'] ?? null],
                    $user?->id
                );
            }

            return $this->success($case, 'Inspection case initialized successfully', 201);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Retrieve complete dossier details including checkpoints and allowed transitions.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'ORG_ADMIN';

        $case = $this->inspectionService->getCase($id, $orgId);
        if (!$case) {
            return $this->error('Inspection case not found or access unauthorized.', 404);
        }

        $case['allowed_transitions'] = InspectionCaseStateMachine::getAllowedTransitions($case['status'] ?? 'DRAFT', $userRole);

        return $this->success($case, 'Inspection dossier details retrieved');
    }

    /**
     * Assign inspector and schedule appointment.
     */
    public function assign(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'ORG_ADMIN';

        $validated = $request->validate([
            'inspector_id' => 'required|uuid',
            'scheduled_at' => 'required|date',
        ]);

        try {
            $updated = $this->inspectionService->assignInspector(
                $id,
                $validated['inspector_id'],
                $validated['scheduled_at'],
                $userRole,
                $orgId
            );

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTOR_ASSIGNED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Inspector assigned and appointment scheduled');
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Start field inspection on-site.
     */
    public function start(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'INSPECTOR';

        try {
            $updated = $this->inspectionService->startInspection($id, $userRole, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTION_STARTED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Inspection initiated on-site');
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Save draft checkpoint responses during progress.
     */
    public function saveDraft(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'checkpoints' => 'required|array',
            'checkpoints.*.section_key' => 'required|string',
            'checkpoints.*.item_key' => 'required|string',
            'checkpoints.*.rating' => 'required|string|in:not_checked,pass,fail,repair_required',
            'checkpoints.*.verified_physically' => 'required|boolean',
            'checkpoints.*.remarks' => 'nullable|string',
        ]);

        try {
            $saved = $this->inspectionService->saveDraftCheckpoints($id, $validated['checkpoints'], $orgId);
            return $this->success($saved, 'Draft checkpoint responses saved');
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Submit completed inspection dossier for quality review.
     */
    public function submit(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'INSPECTOR';

        $validated = $request->validate([
            'odometer_reading_km' => 'required|integer|min:0',
            'engine_started' => 'required|boolean',
            'road_tested' => 'required|boolean',
            'summary_condition_rating' => 'nullable|string|in:EXCELLENT,GOOD,FAIR,POOR,SCRAP',
        ]);

        try {
            $updated = $this->inspectionService->submitCase($id, $validated, $userRole, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTION_SUBMITTED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Inspection submitted for quality review');
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Reviewer / Valuer requests correction from surveyor with mandatory remarks.
     */
    public function requestCorrection(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'VALUER';

        $validated = $request->validate([
            'qc_remarks' => 'required|string|min:5',
        ]);

        try {
            $updated = $this->inspectionService->requestCorrection($id, $validated['qc_remarks'], $userRole, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTION_CORRECTION_REQUESTED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Correction requested from field surveyor');
        } catch (MandatoryCorrectionNotesMissingException $e) {
            return $this->error($e->getMessage(), 422);
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Valuer / Manager approves the inspection dossier.
     */
    public function approve(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'VALUER';

        try {
            $updated = $this->inspectionService->approveCase($id, $userRole, $user?->id ?? 'system', $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTION_APPROVED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Inspection dossier approved successfully');
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Cancel an inspection case.
     */
    public function cancel(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';
        $userRole = $user->role ?? 'ORG_ADMIN';

        $validated = $request->validate([
            'reason' => 'required|string|min:3',
        ]);

        try {
            $updated = $this->inspectionService->cancelCase($id, $validated['reason'], $userRole, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log($orgId, 'INSPECTION_CANCELLED', 'inspection_cases', $id, [], $updated, $user?->id);
            }

            return $this->success($updated, 'Inspection case cancelled');
        } catch (InvalidStateTransitionException|UnauthorizedTransitionException $e) {
            return $this->error($e->getMessage(), 403);
        } catch (InspectionException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
