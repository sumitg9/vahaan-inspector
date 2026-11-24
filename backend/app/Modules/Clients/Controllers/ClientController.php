<?php

namespace App\Modules\Clients\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Auditing\Services\AuditService;
use App\Modules\Clients\Services\ClientService;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    protected ClientService $clientService;

    public function __construct(ClientService $clientService)
    {
        $this->clientService = $clientService;
    }

    /**
     * List all clients for the authenticated organization.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $filters = [
            'search' => $request->query('search'),
            'client_type' => $request->query('client_type', 'ALL'),
            'is_active' => $request->has('is_active') ? filter_var($request->query('is_active'), FILTER_VALIDATE_BOOLEAN) : null,
        ];

        $clients = $this->clientService->getClients($orgId, $filters);

        return $this->success($clients, 'Clients retrieved successfully');
    }

    /**
     * Store a newly created client.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_type' => 'nullable|string|in:BANK,NBFC,DEALER,SURVEYOR,FLEET_OPERATOR,INSURANCE,OTHER',
            'contact_person' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'pan_number' => 'nullable|string|size:10',
            'gst_number' => 'nullable|string|size:15',
            'billing_address' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        try {
            $client = $this->clientService->createClient($validated, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'CLIENT_CREATED',
                    'clients',
                    $client['id'] ?? null,
                    [],
                    $client,
                    $user?->id
                );
            }

            return $this->success($client, 'Client created successfully', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    /**
     * Display the specified client.
     */
    public function show(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $client = $this->clientService->getClient($id, $orgId);
        if (!$client) {
            return $this->error('Client not found or access unauthorized.', 404);
        }

        return $this->success($client, 'Client details retrieved');
    }

    /**
     * Update the specified client.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'client_type' => 'sometimes|string|in:BANK,NBFC,DEALER,SURVEYOR,FLEET_OPERATOR,INSURANCE,OTHER',
            'contact_person' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'sometimes|string|max:20',
            'pan_number' => 'nullable|string|size:10',
            'gst_number' => 'nullable|string|size:15',
            'billing_address' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $updated = $this->clientService->updateClient($id, $validated, $orgId);
        if (!$updated) {
            return $this->error('Client not found or access unauthorized.', 404);
        }

        if (class_exists(AuditService::class)) {
            AuditService::log(
                $orgId,
                'CLIENT_UPDATED',
                'clients',
                $id,
                [],
                $updated,
                $user?->id
            );
        }

        return $this->success($updated, 'Client updated successfully');
    }

    /**
     * List bank branches under the given client.
     */
    public function branches(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        try {
            $branches = $this->clientService->getClientBranches($id, $orgId);
            return $this->success($branches, 'Bank branches retrieved successfully');
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 404);
        }
    }

    /**
     * Store a new bank branch under the given client.
     */
    public function storeBranch(Request $request, string $id)
    {
        $user = $request->user();
        $orgId = $user->organization_id ?? 'org-11111111-1111-1111-1111-111111111111';

        $validated = $request->validate([
            'branch_name' => 'required|string|max:255',
            'branch_code' => 'required|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'address' => 'nullable|string',
        ]);

        try {
            $branch = $this->clientService->createBankBranch($id, $validated, $orgId);

            if (class_exists(AuditService::class)) {
                AuditService::log(
                    $orgId,
                    'BANK_BRANCH_CREATED',
                    'bank_branches',
                    $branch['id'] ?? null,
                    [],
                    $branch,
                    $user?->id
                );
            }

            return $this->success($branch, 'Bank branch created successfully', 201);
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
