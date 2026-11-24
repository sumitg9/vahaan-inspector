<?php

namespace App\Modules\Organizations\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Modules\Auditing\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BranchController extends Controller
{
    /**
     * List all branches for the current tenant.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $branches = Branch::orderBy('name')->get();

        return $this->success($branches, 'Branches retrieved successfully');
    }

    /**
     * Create a new branch within current tenant.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
            'city' => 'required|string|max:100',
            'state' => 'required|string|max:100',
            'pincode' => 'required|string|max:10',
            'address' => 'required|string',
            'is_headquarters' => 'nullable|boolean',
        ]);

        // Check uniqueness within this tenant
        $exists = Branch::where('code', strtoupper($validated['code']))->exists();
        if ($exists) {
            return $this->error("Branch with code '{$validated['code']}' already exists in your organization.", 422);
        }

        $branch = Branch::create([
            'id' => (string) Str::uuid(),
            'organization_id' => $user->organization_id,
            'name' => $validated['name'],
            'code' => strtoupper($validated['code']),
            'city' => $validated['city'],
            'state' => $validated['state'],
            'pincode' => $validated['pincode'],
            'address' => $validated['address'],
            'is_headquarters' => $validated['is_headquarters'] ?? false,
        ]);

        AuditService::log(
            $user->organization_id,
            $user->id,
            'BRANCH_CREATED',
            'branches',
            $branch->id,
            null,
            $validated,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($branch, 'Branch created successfully', 201);
    }

    /**
     * Get branch details (strictly tenant-isolated).
     */
    public function show(Request $request, string $id)
    {
        $branch = Branch::find($id);

        if (!$branch) {
            return $this->error('Branch not found', 404);
        }

        return $this->success($branch);
    }

    /**
     * Update branch details.
     */
    public function update(Request $request, string $id)
    {
        $user = $request->user();
        $branch = Branch::find($id);

        if (!$branch) {
            return $this->error('Branch not found', 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'pincode' => 'nullable|string|max:10',
            'address' => 'nullable|string',
            'is_headquarters' => 'nullable|boolean',
        ]);

        $oldValues = $branch->only(array_keys($validated));
        $branch->update($validated);

        AuditService::log(
            $user->organization_id,
            $user->id,
            'BRANCH_UPDATED',
            'branches',
            $branch->id,
            $oldValues,
            $validated,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success($branch->fresh(), 'Branch updated successfully');
    }

    /**
     * Delete a branch.
     */
    public function destroy(Request $request, string $id)
    {
        $user = $request->user();
        $branch = Branch::find($id);

        if (!$branch) {
            return $this->error('Branch not found', 404);
        }

        $branch->delete();

        AuditService::log(
            $user->organization_id,
            $user->id,
            'BRANCH_DELETED',
            'branches',
            $id,
            null,
            null,
            $request->ip(),
            $request->userAgent()
        );

        return $this->success(null, 'Branch deleted successfully');
    }
}
